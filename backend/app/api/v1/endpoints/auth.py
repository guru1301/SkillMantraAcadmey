"""
Authentication API Endpoints: Login, Logout, Profile, and Session Status.
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from backend.app.api.deps import AuthenticatedUser, get_current_user, get_db, invalidate_cached_session
from backend.app.core.config import settings
from backend.app.core.security import (
    get_trusted_client_ip,
    generate_session_token,
    hash_session_token,
    generate_session_csrf_token,
)
from backend.app.db.models import UserSession
from backend.app.schemas.auth import (
    ChangePasswordRequest,
    ChangePasswordResponse,
    LoginRequest,
    LoginResponse,
    SessionStatusResponse,
    UserProfileResponse,
)
from backend.app.schemas.common import MessageResponse
from backend.app.services.auth_service import (
    authenticate_user,
    change_user_password,
    revoke_session,
    revoke_all_user_sessions,
)

from backend.app.schemas.student import StudentActivationRequest, StudentActivationResponse
from backend.app.services.student_service import activate_student_account
from backend.app.services.rate_limit_service import (
    is_distributed_rate_limited,
    record_distributed_attempt,
    reset_distributed_rate_limit,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Unified Multi-Role Login",
)
def login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> LoginResponse:
    """
    Authenticates super_admin, college_admin, trainer, or student.
    Enforces login rate limiting against brute-force attacks.
    Sets secure HttpOnly session cookie and returns user session profile.
    """
    client_ip = get_trusted_client_ip(request)
    normalized_identifier = payload.email.strip().lower()
    ip_id_key = f"{client_ip}:{normalized_identifier}"

    # 1. IP-level rate limit: 10/min per IP (fail closed)
    ip_limited, _ = is_distributed_rate_limited(
        db,
        scope="login_ip",
        key=client_ip,
        max_requests=getattr(settings, "RATE_LIMIT_LOGIN_IP_MAX", 10),
        window_seconds=60,
        fail_closed=True,
    )
    if ip_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts from this IP address. Please try again later.",
        )

    # 2. Per (ip, identifier) rate limit: 5 failed attempts per 10 minutes with exponential backoff (fail closed)
    ip_id_limited, remaining = is_distributed_rate_limited(
        db,
        scope="login_ip_id",
        key=ip_id_key,
        max_requests=5,
        window_seconds=600,
        fail_closed=True,
    )
    if ip_id_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts for this account from your IP. Please wait 10 minutes before retrying.",
        )

    failed_attempts = 5 - remaining
    if failed_attempts > 0:
        import time
        backoff_delay = min(2.0 ** (failed_attempts - 1) * 0.25, 4.0)
        time.sleep(backoff_delay)

    # 3. Soft global per-identifier threshold: 20/hour (adds delay, not hard lockout)
    soft_limited, _ = is_distributed_rate_limited(
        db,
        scope="login_id_soft",
        key=normalized_identifier,
        max_requests=20,
        window_seconds=3600,
        fail_closed=False,
    )
    if soft_limited:
        import time
        time.sleep(1.0)

    user_agent = request.headers.get("user-agent")

    try:
        session_token, user_dict, csrf_token = authenticate_user(
            db=db,
            identifier=payload.email,
            password=payload.password,
            ip_address=client_ip,
            user_agent=user_agent,
            role_hint=payload.role_hint,
        )
    except Exception as exc:
        record_distributed_attempt(db, scope="login_ip", key=client_ip, window_seconds=60)
        record_distributed_attempt(db, scope="login_ip_id", key=ip_id_key, window_seconds=600)
        record_distributed_attempt(db, scope="login_id_soft", key=normalized_identifier, window_seconds=3600)
        raise exc

    # Successful login: reset failed attempts for this (ip, identifier)
    reset_distributed_rate_limit(db, scope="login_ip_id", key=ip_id_key)

    # Set HTTP-only secure session cookie
    max_age_seconds = settings.SESSION_DURATION_DAYS * 24 * 3600
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_token,
        max_age=max_age_seconds,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/",
    )

    # Set CSRF cookie (HttpOnly=True since Next.js server actions handle requests without client-side cookie access)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        max_age=max_age_seconds,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/",
    )

    must_change = bool(user_dict.get("must_change_password", False))

    user_profile = UserProfileResponse(
        id=user_dict["id"],
        email=user_dict["email"] or "",
        full_name=user_dict["full_name"],
        role=user_dict["role_type"],
        status=user_dict["status"],
        college_id=user_dict["college_id"],
        college_name=user_dict["college_name"],
        must_change_password=must_change,
    )

    return LoginResponse(
        success=True,
        user_id=user_dict["id"],
        email=user_dict["email"],
        full_name=user_dict["full_name"],
        role=user_dict["role_type"],
        college_id=user_dict["college_id"],
        college_name=user_dict["college_name"],
        redirect_to=user_dict["redirect_to"],
        csrf_token=csrf_token,
        must_change_password=must_change,
        user=user_profile,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke Current Session and Clear Cookies",
)
def logout(
    response: Response,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Revokes the current server-side session and clears authentication cookies.
    """
    if current_user.token:
        revoke_session(db, current_user.token)
        invalidate_cached_session(current_user.token)

    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        httponly=True,
    )
    response.delete_cookie(
        key="csrf_token",
        path="/",
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        httponly=False,
    )

    return MessageResponse(success=True, message="Successfully logged out and session revoked.")


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Authenticated User Profile",
)
def get_current_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UserProfileResponse:
    """
    Returns the resolved identity and tenant context of the caller.
    """
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        status=current_user.status,
        college_id=current_user.college_id,
        college_name=current_user.college_name,
        session_id=current_user.session_id,
        must_change_password=current_user.must_change_password,
    )


@router.get(
    "/session",
    response_model=SessionStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify Session Validity",
)
def verify_session(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SessionStatusResponse:
    """
    Returns active session verification without modifying state.
    """
    return SessionStatusResponse(
        authenticated=True,
        valid=True,
        user_id=current_user.id,
        role=current_user.role,
        email=current_user.email,
        college_id=current_user.college_id,
        must_change_password=current_user.must_change_password,
    )


@router.post(
    "/change-password",
    response_model=ChangePasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Change Account Password",
)
def change_password_endpoint(
    request: Request,
    response: Response,
    payload: ChangePasswordRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChangePasswordResponse:
    """
    Allows authenticated users to change their password.
    Enforces password policy, clears must_change_password state,
    revokes other sessions, issues a fresh session, and returns role-based redirect.
    """
    client_ip = get_trusted_client_ip(request)
    cp_limited, _ = is_distributed_rate_limited(
        db,
        scope="change_password_ip",
        key=client_ip,
        max_requests=10,
        window_seconds=60,
    )
    if cp_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password change requests from this IP address. Please try again later.",
        )
    record_distributed_attempt(db, scope="change_password_ip", key=client_ip, window_seconds=60)

    change_user_password(
        db=db,
        user_id=current_user.id,
        role=current_user.role,
        current_password=payload.current_password,
        new_password=payload.new_password,
        current_token=current_user.token,
        except_session_id=current_user.session_id,
    )

    # Issue a fresh session, revoking all existing sessions including current
    revoke_all_user_sessions(db, current_user.id, current_user.role)
    fresh_session_token = generate_session_token()
    token_hash = hash_session_token(fresh_session_token)
    csrf_token = generate_session_csrf_token(fresh_session_token)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=settings.SESSION_DURATION_DAYS)

    fresh_session = UserSession(
        session_token_hash=token_hash,
        user_id=current_user.id,
        user_role=current_user.role,
        college_id=current_user.college_id,
        ip_address=get_trusted_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        created_at=now,
        expires_at=expires_at,
        revoked_at=None,
    )
    db.add(fresh_session)
    db.commit()

    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=fresh_session_token,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=settings.SESSION_DURATION_DAYS * 86400,
        path="/",
    )
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=settings.SESSION_DURATION_DAYS * 86400,
        path="/",
    )

    role_redirects = {
        "super_admin": "/admin/dashboard",
        "college_admin": "/portal",
        "trainer": "/trainer",
        "student": "/student",
    }

    return ChangePasswordResponse(
        success=True,
        message="Password updated successfully. Other active sessions have been revoked.",
        redirect_to=role_redirects.get(current_user.role, "/login"),
    )


@router.post(
    "/student-activate",
    response_model=StudentActivationResponse,
    status_code=status.HTTP_200_OK,
    summary="First-Time Student Identity Verification & Account Activation",
)
def student_activate_endpoint(
    request: Request,
    payload: StudentActivationRequest,
    db: Session = Depends(get_db),
) -> StudentActivationResponse:
    """
    First-time student activation:
    - Validates roll number and date of birth identity verification.
    - Validates single-use activation credential.
    - Sets secure personal password.
    - Applies IP and identifier rate limiting.
    """
    client_ip = get_trusted_client_ip(request)
    normalized_identifier = payload.roll_number.strip().lower()
    ip_roll_key = f"{client_ip}:{normalized_identifier}"

    # Distributed Rate Limiting Check: 20/min per IP, 5/5min per (ip, roll)
    ip_limited, _ = is_distributed_rate_limited(
        db,
        scope="activation_ip",
        key=client_ip,
        max_requests=getattr(settings, "RATE_LIMIT_ACTIVATION_IP_MAX", 20),
        window_seconds=60,
    )
    if ip_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many activation attempts from this IP address. Please try again later.",
        )

    id_limited, _ = is_distributed_rate_limited(
        db,
        scope="activation_ip_roll",
        key=ip_roll_key,
        max_requests=5,
        window_seconds=300,
    )
    if id_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many activation attempts for this roll number from your IP. Please try again later.",
        )

    try:
        result = activate_student_account(db=db, request=payload)
        reset_distributed_rate_limit(db, scope="activation_ip_roll", key=ip_roll_key)
        return StudentActivationResponse(
            success=True,
            message=result["message"],
            rollNumber=result["rollNumber"],
        )
    except HTTPException as exc:
        db.rollback()
        record_distributed_attempt(db, scope="activation_ip_roll", key=ip_roll_key, window_seconds=300)
        record_distributed_attempt(db, scope="activation_ip", key=client_ip, window_seconds=60)
        raise exc
    except Exception as ex:
        db.rollback()
        record_distributed_attempt(db, scope="activation_ip_roll", key=ip_roll_key, window_seconds=300)
        record_distributed_attempt(db, scope="activation_ip", key=client_ip, window_seconds=60)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during account activation.",
        )


