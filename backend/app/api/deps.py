"""
FastAPI Dependencies for Authentication, Role-Based Access Control, and Multi-Tenant Isolation.
"""
from datetime import datetime, timezone
import secrets
import time
from typing import Callable, Dict, Optional, Tuple
from uuid import UUID
from dataclasses import dataclass
from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.security import hash_session_token, verify_csrf_token, verify_session_csrf_token
from backend.app.db.session import get_db
from backend.app.db.models import (
    UserSession,
    AdminUser,
    CollegeUser,
    Trainer,
    Student,
    College,
    Batch,
    TrainingSession,
    Assessment,
    Resource,
)

# Multi-worker authoritative session verification:
# The PostgreSQL 'user_sessions' table serves as the single authoritative source of truth.
# Worker-local memory caching is bypassed to eliminate cross-worker race conditions, ensuring
# instant revocation, lockout, and institutional deactivation across all backend workers.
def get_cached_user(token_hash: str) -> Optional["AuthenticatedUser"]:
    return None

def set_cached_user(token_hash: str, user: "AuthenticatedUser") -> None:
    pass

def invalidate_cached_session(token: str) -> None:
    pass


@dataclass
class AuthenticatedUser:
    """Represents an authenticated actor with tenant scope."""
    id: UUID
    role: str  # super_admin | college_admin | trainer | student
    email: str
    full_name: str
    status: str = "active"
    college_id: Optional[UUID] = None
    college_name: Optional[str] = None
    session_id: Optional[UUID] = None
    token: Optional[str] = None
    must_change_password: bool = False


def get_current_session_token(
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_session_token: Optional[str] = Header(None, alias="X-Session-Token"),
) -> str:
    """
    Extracts the session token from cookie, Authorization header, or X-Session-Token header.
    Raises 401 if no credential is provided.
    """
    # 1. Cookie check
    cookie_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if cookie_token and cookie_token.strip():
        return cookie_token.strip()

    # 2. X-Session-Token header
    if x_session_token and x_session_token.strip():
        return x_session_token.strip()

    # 3. Authorization Bearer header
    if authorization and authorization.strip():
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
        return authorization.strip()

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. No session cookie or token supplied.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    token: str = Depends(get_current_session_token),
    db: Session = Depends(get_db),
) -> AuthenticatedUser:
    """
    Validates the session token in user_sessions, ensures session is not revoked or expired,
    and resolves the primary user entity according to role.
    Strictly verifies account active status across all user roles, including super_admin.
    """
    token_hash = hash_session_token(token)
    cached = get_cached_user(token_hash)
    if cached is not None:
        return cached

    # 1. Query user_sessions by token hash
    stmt = select(UserSession).where(UserSession.session_token_hash == token_hash)
    session_obj = db.execute(stmt).scalar_one_or_none()

    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or unrecognized session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Check revocation
    if session_obj.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Check expiration
    now_utc = datetime.now(timezone.utc)
    if session_obj.expires_at <= now_utc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = session_obj.user_id
    role = session_obj.user_role

    # 4. Resolve user record in primary tables and verify active status
    if role == "super_admin":
        admin = db.execute(select(AdminUser).where(AdminUser.id == user_id)).scalar_one_or_none()
        if not admin:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found.")
        if admin.status != "active":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super administrator account is inactive.")

        must_change = bool(getattr(admin, "must_change_password", False))
        user = AuthenticatedUser(
            id=admin.id,
            role="super_admin",
            email=admin.email,
            full_name=admin.full_name,
            college_id=None,
            college_name=None,
            session_id=session_obj.id,
            token=token,
            must_change_password=must_change,
        )
        set_cached_user(token_hash, user)
        return user

    elif role == "college_admin":
        cu = db.execute(select(CollegeUser).where(CollegeUser.id == user_id)).scalar_one_or_none()
        if not cu:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="College administrator account not found.")
        if cu.status != "active":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="College administrator account is inactive.")

        college = db.execute(select(College).where(College.id == cu.college_id)).scalar_one_or_none()
        if not college or college.status != "active":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Associated college institution is inactive.")

        must_change = bool(getattr(cu, "must_change_password", False))
        user = AuthenticatedUser(
            id=cu.id,
            role="college_admin",
            email=cu.email,
            full_name=cu.full_name,
            college_id=cu.college_id,
            college_name=college.name if college else None,
            session_id=session_obj.id,
            token=token,
            must_change_password=must_change,
        )
        set_cached_user(token_hash, user)
        return user

    elif role == "trainer":
        tr = db.execute(select(Trainer).where(Trainer.id == user_id)).scalar_one_or_none()
        if not tr:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Trainer account not found.")
        if tr.status != "active":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Trainer account is inactive.")

        must_change = bool(getattr(tr, "must_change_password", False))
        user = AuthenticatedUser(
            id=tr.id,
            role="trainer",
            email=tr.email,
            full_name=tr.full_name,
            college_id=None,
            college_name=None,
            session_id=session_obj.id,
            token=token,
            must_change_password=must_change,
        )
        set_cached_user(token_hash, user)
        return user

    elif role == "student":
        st = db.execute(select(Student).where(Student.id == user_id)).scalar_one_or_none()
        if not st:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Student account not found.")
        if st.status != "active":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student account is inactive.")

        college_name = None
        if st.college_id:
            college = db.execute(select(College).where(College.id == st.college_id)).scalar_one_or_none()
            if college and college.status != "active":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Associated college institution is inactive.")
            if college:
                college_name = college.name

        must_change = bool(getattr(st, "must_change_password", False))
        user = AuthenticatedUser(
            id=st.id,
            role="student",
            email=st.email or st.roll_number,
            full_name=st.full_name,
            college_id=st.college_id,
            college_name=college_name,
            session_id=session_obj.id,
            token=token,
            must_change_password=must_change,
        )
        set_cached_user(token_hash, user)
        return user

    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Unrecognized role type '{role}'.")


def get_verified_active_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """
    Validates current authenticated user and blocks access (403 Forbidden)
    if must_change_password is true.
    Used across endpoints that require an active account in good standing.
    """
    if current_user.must_change_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password change required before accessing the platform.",
        )
    return current_user


def require_roles(*allowed_roles: str) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    """
    Factory creating a role-based authorization dependency.
    Enforces that users with mandatory password change must update credentials first.
    """
    def role_checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden for role '{current_user.role}'. Required roles: {', '.join(allowed_roles)}.",
            )
        if current_user.must_change_password:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Password change required before accessing the platform.",
            )
        return current_user
    return role_checker


# Role Dependencies
require_super_admin = require_roles("super_admin")
require_college_admin = require_roles("college_admin")
require_trainer = require_roles("trainer")
require_student = require_roles("student")
require_admin_or_college = require_roles("super_admin", "college_admin")
require_trainer_or_super_admin = require_roles("super_admin", "trainer")
require_staff = require_roles("super_admin", "college_admin", "trainer")
require_administrative_role = require_roles("super_admin", "college_admin", "trainer")


def enforce_tenant_college_id(
    current_user: AuthenticatedUser,
    requested_college_id: Optional[UUID] = None,
) -> UUID:
    """
    Strict Tenant Isolation Guard:
    - If user is college_admin: ALWAYS returns current_user.college_id. If client supplied a differing
      requested_college_id, immediately raises 403 Forbidden.
    - If user is super_admin: returns requested_college_id (or raises 400 if required and omitted).
    - Other roles are forbidden from managing colleges.
    """
    if current_user.role == "college_admin":
        if not current_user.college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="College administrator is not bound to a valid college ID.",
            )
        if requested_college_id is not None and requested_college_id != current_user.college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: Access to another college's resources is strictly prohibited.",
            )
        return current_user.college_id

    elif current_user.role == "super_admin":
        if requested_college_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="College ID parameter is required for Super Admin operation.",
            )
        return requested_college_id

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role not authorized for college tenant operation.",
        )


def verify_csrf_protection(
    request: Request,
    x_csrf_token: Optional[str] = Header(None, alias="X-CSRF-Token"),
) -> None:
    """
    CSRF Protection Dependency for state-changing requests authenticated via cookies.
    """
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
        if session_cookie and session_cookie.strip():
            csrf_cookie = request.cookies.get("csrf_token")
            if not csrf_cookie or not csrf_cookie.strip():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF protection violation: Missing or empty csrf_token cookie.",
                )
            if not x_csrf_token or not x_csrf_token.strip():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF protection violation: Missing or empty X-CSRF-Token request header.",
                )
            if not secrets.compare_digest(csrf_cookie.strip(), x_csrf_token.strip()):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF protection violation: X-CSRF-Token does not match session csrf_token.",
                )
            if not verify_session_csrf_token(x_csrf_token.strip(), csrf_cookie.strip(), session_cookie.strip()):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF protection violation: Invalid or forged session-bound CSRF token.",
                )


# ==============================================================================
# Object-Level Authorization Helpers
# ==============================================================================

def verify_batch_access(
    db: Session,
    batch_id: UUID,
    current_user: AuthenticatedUser,
) -> Batch:
    """
    Verifies that the current user has authorization to access the specified batch:
    - super_admin: platform-wide access
    - college_admin: batch must belong to their college
    - trainer: trainer must be assigned to this batch
    - student: student must be enrolled in this batch
    """
    batch = db.execute(select(Batch).where(Batch.id == batch_id)).scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    if current_user.role == "super_admin":
        return batch

    if current_user.role == "college_admin":
        if batch.college_id != current_user.college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: Batch belongs to another college institution.",
            )
        return batch

    if current_user.role == "trainer":
        check_sql = text("SELECT 1 FROM batch_trainers WHERE batch_id = :b AND trainer_id = :t LIMIT 1")
        is_assigned = db.execute(check_sql, {"b": batch_id, "t": current_user.id}).scalar()
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: Trainer is not assigned to this batch cohort.",
            )
        return batch

    if current_user.role == "student":
        check_sql = text("SELECT 1 FROM batch_students WHERE batch_id = :b AND student_id = :s LIMIT 1")
        is_enrolled = db.execute(check_sql, {"b": batch_id, "s": current_user.id}).scalar()
        if not is_enrolled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: Student is not enrolled in this batch cohort.",
            )
        return batch

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for current role.")


def verify_student_access(
    db: Session,
    student_id: UUID,
    current_user: AuthenticatedUser,
) -> Student:
    """
    Verifies that the current user has authorization to access the specified student:
    - super_admin: platform-wide access
    - student: can only access their own student record
    - college_admin: student must belong to their college
    - trainer: student must be in at least one batch assigned to this trainer
    """
    student = db.execute(select(Student).where(Student.id == student_id)).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    if current_user.role == "super_admin":
        return student

    if current_user.role == "student":
        if current_user.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students may only access their own student records.",
            )
        return student

    if current_user.role == "college_admin":
        if student.college_id != current_user.college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: Student belongs to another college institution.",
            )
        return student

    if current_user.role == "trainer":
        check_sql = text("""
            SELECT 1 FROM batch_students bs
            JOIN batch_trainers bt ON bt.batch_id = bs.batch_id
            WHERE bs.student_id = :s AND bt.trainer_id = :t
            LIMIT 1
        """)
        shared = db.execute(check_sql, {"s": student_id, "t": current_user.id}).scalar()
        if not shared:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: Student is not enrolled in any batch assigned to this trainer.",
            )
        return student

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for current role.")


def verify_session_access(
    db: Session,
    session_id: UUID,
    current_user: AuthenticatedUser,
) -> Tuple[TrainingSession, Batch]:
    """
    Verifies access to a training session by verifying access to its parent batch.
    """
    session = db.execute(select(TrainingSession).where(TrainingSession.id == session_id)).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training session not found.")

    batch = verify_batch_access(db, session.batch_id, current_user)
    return session, batch


def verify_assessment_access(
    db: Session,
    assessment_id: UUID,
    current_user: AuthenticatedUser,
) -> Tuple[Assessment, Batch]:
    """
    Verifies access to an assessment by verifying access to its parent batch.
    """
    assessment = db.execute(select(Assessment).where(Assessment.id == assessment_id)).scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    batch = verify_batch_access(db, assessment.batch_id, current_user)
    return assessment, batch


def verify_resource_access(
    db: Session,
    resource_id: UUID,
    current_user: AuthenticatedUser,
) -> Tuple[Resource, Batch]:
    """
    Verifies access to a resource by verifying access to its parent batch.
    """
    resource = db.execute(select(Resource).where(Resource.id == resource_id)).scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found.")

    batch = verify_batch_access(db, resource.batch_id, current_user)
    return resource, batch
