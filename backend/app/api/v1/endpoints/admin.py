"""
Super Admin API Endpoints: Platform dashboard metrics, aggregate analytics,
and enterprise administrative user management.
"""
from datetime import datetime, timezone
import secrets
from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from backend.app.core.password_policy import validate_password
from sqlalchemy import func, select, text, update
from sqlalchemy.orm import Session

from backend.app.api.deps import (
    AuthenticatedUser,
    get_db,
    require_super_admin,
)
from backend.app.core.security import generate_temporary_password, hash_password
from backend.app.db.models import (
    AdminUser,
    College,
    CollegeUser,
    Program,
    Batch,
    Student,
    Trainer,
    ContactInquiry,
    SessionAttendance,
    Resource,
    UserSession,
)
from backend.app.schemas.common import MessageResponse
from backend.app.services.auth_service import revoke_all_user_sessions

router = APIRouter(prefix="/admin", tags=["Super Admin"])


# Schemas for Admin User Management
class AdminUserItem(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    status: str
    college_id: Optional[UUID] = None
    college_name: Optional[str] = None
    last_login_at: Optional[str] = None
    created_at: str


class AdminUserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    role: str = Field(..., description="Role: 'super_admin' or 'college_admin'")
    college_id: Optional[UUID] = Field(None, description="Required for college_admin role")
    password: Optional[str] = Field(None, min_length=10, description="Initial password. If omitted, generated securely.")

    @field_validator("password")
    @classmethod
    def validate_admin_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            validate_password(v)
        return v


class AdminUserStatusUpdate(BaseModel):
    status: str = Field(..., description="'active' or 'inactive'")


class AdminUserResetPassword(BaseModel):
    password: Optional[str] = Field(None, min_length=10)

    @field_validator("password")
    @classmethod
    def validate_reset_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            validate_password(v)
        return v


class AdminUserCredentialResponse(BaseModel):
    success: bool = True
    message: str
    temporary_password: Optional[str] = None


@router.get(
    "/dashboard",
    status_code=status.HTTP_200_OK,
    summary="Super Admin Aggregate Platform Dashboard",
)
def get_admin_dashboard(
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Computes global platform-wide statistics across all colleges, programs, cohorts, and users.
    Consolidated into a single roundtrip SQL query for maximum performance.
    """
    sql = text("""
        SELECT
          (SELECT COUNT(*)::int FROM colleges) as total_colleges,
          (SELECT COUNT(*)::int FROM colleges WHERE status = 'active') as active_colleges,
          (SELECT COUNT(*)::int FROM programs) as total_programs,
          (SELECT COUNT(*)::int FROM programs WHERE status = 'active') as active_programs,
          (SELECT COUNT(*)::int FROM batches) as total_batches,
          (SELECT COUNT(*)::int FROM batches WHERE status = 'active') as active_batches,
          (SELECT COUNT(*)::int FROM students) as total_students,
          (SELECT COUNT(*)::int FROM students WHERE status = 'active') as active_students,
          (SELECT COUNT(*)::int FROM trainers) as total_trainers,
          (SELECT COUNT(*)::int FROM trainers WHERE status = 'active') as active_trainers,
          (SELECT COUNT(*)::int FROM contact_inquiries WHERE status = 'new') as new_inquiries,
          (SELECT COUNT(*)::int FROM session_attendance) as total_att,
          (SELECT COUNT(*)::int FROM session_attendance WHERE status IN ('present', 'late')) as attended_att
    """)
    res = db.execute(sql).mappings().first()
    if not res:
        res = {}

    total_att = res.get("total_att", 0)
    attended_att = res.get("attended_att", 0)
    overall_attendance_rate = (
        round((attended_att / total_att) * 100.0, 1) if total_att > 0 else 0.0
    )

    return {
        "colleges": {
            "total": res.get("total_colleges", 0),
            "active": res.get("active_colleges", 0),
        },
        "programs": {
            "total": res.get("total_programs", 0),
            "active": res.get("active_programs", 0),
        },
        "batches": {
            "total": res.get("total_batches", 0),
            "active": res.get("active_batches", 0),
        },
        "students": {
            "total": res.get("total_students", 0),
            "active": res.get("active_students", 0),
        },
        "trainers": {
            "total": res.get("total_trainers", 0),
            "active": res.get("active_trainers", 0),
        },
        "inquiries": {
            "new": res.get("new_inquiries", 0),
        },
        "overallAttendanceRate": overall_attendance_rate,
    }


@router.get(
    "/overview-stats",
    status_code=status.HTTP_200_OK,
    summary="Platform Overview Stats",
)
def get_platform_overview_stats_endpoint(
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Consolidated platform module statistics for admin dashboard and reports.
    Executed in a single roundtrip query.
    """
    sql = text("""
        SELECT
          (SELECT COUNT(*)::int FROM colleges WHERE status = 'active') as total_colleges,
          (SELECT COUNT(*)::int FROM programs WHERE status = 'active') as total_programs,
          (SELECT COUNT(*)::int FROM batches) as total_batches,
          (SELECT COUNT(*)::int FROM batches WHERE status = 'active') as active_batches,
          (SELECT COUNT(*)::int FROM students) as total_students,
          (SELECT COUNT(*)::int FROM resources) as total_resources,
          (SELECT COUNT(*)::int FROM trainers WHERE status = 'active') as total_trainers
    """)
    res = db.execute(sql).mappings().first() or {}

    return {
        "totalColleges": res.get("total_colleges", 0),
        "totalPrograms": res.get("total_programs", 0),
        "totalBatches": res.get("total_batches", 0),
        "activeBatches": res.get("active_batches", 0),
        "totalStudents": res.get("total_students", 0),
        "totalResources": res.get("total_resources", 0),
        "totalTrainers": res.get("total_trainers", 0),
    }


@router.get(
    "/stats",
    status_code=status.HTTP_200_OK,
    summary="Admin User and System Stats",
)
def get_admin_user_stats(
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Retrieves admin user counts and operational status in a single query.
    """
    sql = text("""
        SELECT
          (SELECT COUNT(*)::int FROM admin_users) as total_admins,
          (SELECT COUNT(*)::int FROM admin_users WHERE status = 'active') as active_admins
    """)
    res = db.execute(sql).mappings().first() or {}

    return {
        "totalAdmins": res.get("total_admins", 0),
        "activeAdmins": res.get("active_admins", 0),
        "dbConnected": True,
        "systemStatus": "Operational",
    }


# Enterprise User Management Endpoints
@router.get(
    "/users",
    response_model=List[AdminUserItem],
    status_code=status.HTTP_200_OK,
    summary="List Administrative Users (Super Admin & College Admin)",
)
def list_admin_users(
    role: Optional[str] = Query(None, description="Filter by 'super_admin' or 'college_admin'"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> List[AdminUserItem]:
    """
    Retrieves all administrative and institutional user accounts across the platform.
    """
    sql = text("""
        SELECT 
          id, email, full_name, 'super_admin' AS role, status,
          NULL::uuid AS college_id, NULL::text AS college_name,
          last_login_at::text as last_login_at, created_at::text as created_at
        FROM admin_users
        
        UNION ALL
        
        SELECT 
          cu.id, cu.email, cu.full_name, 'college_admin' AS role, cu.status,
          cu.college_id, c.name AS college_name,
          cu.last_login_at::text as last_login_at, cu.created_at::text as created_at
        FROM college_users cu
        LEFT JOIN colleges c ON c.id = cu.college_id
        
        ORDER BY created_at DESC
    """)
    rows = db.execute(sql).mappings().all()

    items = []
    for r in rows:
        r_role = r["role"]
        if role and r_role != role:
            continue
        if search:
            q = search.lower().strip()
            if q not in (r["email"] or "").lower() and q not in (r["full_name"] or "").lower():
                continue
        items.append(AdminUserItem(**dict(r)))
    return items


@router.post(
    "/users",
    response_model=AdminUserCredentialResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Administrative User Account",
)
def create_admin_user_endpoint(
    payload: AdminUserCreate,
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> AdminUserCredentialResponse:
    """
    Provisions a new Super Admin or College Admin user account with bcrypt password hashing.
    """
    clean_email = payload.email.strip().lower()

    # Check email uniqueness across all platform user tables
    from backend.app.services.auth_service import check_email_unique_globally
    check_email_unique_globally(db, clean_email)

    temp_pw = payload.password.strip() if payload.password and payload.password.strip() else generate_temporary_password()
    pw_hash = hash_password(temp_pw)

    if payload.role == "super_admin":
        new_admin = AdminUser(
            email=clean_email,
            full_name=payload.full_name.strip(),
            password_hash=pw_hash,
            status="active",
            must_change_password=True,
        )
        db.add(new_admin)
    elif payload.role == "college_admin":
        if not payload.college_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="college_id is required for college_admin role.")
        # Verify college exists
        college = db.execute(select(College).where(College.id == payload.college_id)).scalar_one_or_none()
        if not college:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified college institution not found.")

        new_cu = CollegeUser(
            college_id=payload.college_id,
            email=clean_email,
            full_name=payload.full_name.strip(),
            password_hash=pw_hash,
            status="active",
            must_change_password=True,
        )
        db.add(new_cu)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role '{payload.role}'. Must be 'super_admin' or 'college_admin'.")

    db.commit()
    msg = "User created successfully."
    generated_pw = temp_pw if not payload.password else None
    return AdminUserCredentialResponse(success=True, message=msg, temporary_password=generated_pw)


@router.patch(
    "/users/{user_id}/status",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate or Deactivate User Account",
)
def update_user_status_endpoint(
    user_id: UUID,
    payload: AdminUserStatusUpdate,
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Toggles user status. If deactivated, immediately revokes all active sessions.
    """
    new_status = payload.status.lower().strip()
    if new_status not in ("active", "inactive"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be 'active' or 'inactive'.")

    if user_id == current_user.id and new_status == "inactive":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own current administrator account.")

    # Try admin_users
    admin = db.execute(select(AdminUser).where(AdminUser.id == user_id)).scalar_one_or_none()
    if admin:
        admin.status = new_status
        admin.updated_at = func.now()
        target_role = "super_admin"
    else:
        # Try college_users
        cu = db.execute(select(CollegeUser).where(CollegeUser.id == user_id)).scalar_one_or_none()
        if cu:
            cu.status = new_status
            cu.updated_at = func.now()
            target_role = "college_admin"
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    if new_status == "inactive":
        # Revoke all active sessions immediately
        revoke_all_user_sessions(db, user_id, target_role)

    db.commit()
    return MessageResponse(success=True, message=f"Account status updated to '{new_status}'.")


@router.post(
    "/users/{user_id}/reset-password",
    response_model=AdminUserCredentialResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset User Password",
)
def reset_user_password_endpoint(
    user_id: UUID,
    payload: AdminUserResetPassword,
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> AdminUserCredentialResponse:
    """
    Resets account password and invalidates all active sessions for that user.
    """
    temp_pw = payload.password.strip() if payload.password and payload.password.strip() else generate_temporary_password()
    pw_hash = hash_password(temp_pw)

    admin = db.execute(select(AdminUser).where(AdminUser.id == user_id)).scalar_one_or_none()
    if admin:
        admin.password_hash = pw_hash
        admin.must_change_password = True
        admin.updated_at = func.now()
        target_role = "super_admin"
    else:
        cu = db.execute(select(CollegeUser).where(CollegeUser.id == user_id)).scalar_one_or_none()
        if cu:
            cu.password_hash = pw_hash
            cu.must_change_password = True
            cu.updated_at = func.now()
            target_role = "college_admin"
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    # Revoke all active sessions
    revoke_all_user_sessions(db, user_id, target_role)
    db.commit()

    msg = "Password reset successfully."
    generated_pw = temp_pw if not payload.password else None
    return AdminUserCredentialResponse(success=True, message=msg, temporary_password=generated_pw)


@router.post(
    "/maintenance/cleanup-sessions",
    summary="Cleanup Expired User Sessions",
    dependencies=[Depends(require_super_admin)],
)
def cleanup_sessions_endpoint(
    max_age_days: int = 30,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(require_super_admin),
) -> Dict[str, Any]:
    """
    Super-admin maintenance endpoint to purge expired and revoked user sessions older than max_age_days.
    """
    from backend.app.services.auth_service import cleanup_expired_sessions
    purged = cleanup_expired_sessions(db, max_age_days=max_age_days)
    return {"success": True, "purged_sessions": purged}
