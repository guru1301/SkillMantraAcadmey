"""
Student API Endpoints: Student registry, bulk onboarding, and student portal access.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import (
    AuthenticatedUser,
    get_verified_active_user,
    get_db,
    require_admin_or_college,
    require_administrative_role,
    require_student,
    verify_batch_access,
    verify_student_access,
)
from backend.app.schemas.common import MessageResponse
from backend.app.schemas.student import (
    BulkStudentActionPayload,
    BulkStudentActionResult,
    BulkStudentEnrollRequest,
    BulkStudentEnrollResponse,
    BulkStudentItem,
    EnrolledStudentResponse,
    RosterImportExecuteRequest,
    RosterImportExecuteResponse,
    RosterImportPreviewRequest,
    RosterImportPreviewResponse,
    StudentCreate,
    StudentResponse,
    SingleStudentCredentialsResponse,
    StudentStatusUpdatePayload,
    StudentUpdate,
)
from backend.app.services.student_service import (
    assign_student_credentials,
    bulk_enroll_students,
    create_student,
    delete_or_archive_student,
    execute_bulk_student_action,
    execute_roster_import_and_provision,
    get_student_batch_full_details,
    get_student_by_id,
    get_student_dashboard_composite,
    get_student_enrolled_batches,
    get_student_sessions_list,
    get_students_list,
    preview_bulk_deletion,
    preview_roster_import,
    reset_student_activation_credential,
    revoke_student_active_sessions,
    revoke_student_credentials,
    update_student,
    update_student_account_status,
)

router = APIRouter(prefix="/students", tags=["Students"])


@router.get(
    "",
    response_model=List[EnrolledStudentResponse],
    status_code=status.HTTP_200_OK,
    summary="List Students",
)
def list_students(
    college_id: Optional[UUID] = Query(None, description="Filter by college ID"),
    batch_id: Optional[UUID] = Query(None, description="Filter by batch ID"),
    search: Optional[str] = Query(None, description="Search by roll number, name, or email"),
    status: Optional[str] = Query(None, description="Filter by status (active/inactive)"),
    limit: int = Query(100, ge=1, le=500, description="Pagination page limit"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: AuthenticatedUser = Depends(require_administrative_role),
    db: Session = Depends(get_db),
) -> List[EnrolledStudentResponse]:
    """
    Retrieves students. Restricted to administrative roles (Super Admin, College Admin, Trainer).
    Enforces multi-tenant college scoping for College Admins and cohort scoping for Trainers.
    Students are strictly forbidden from listing the directory.
    """
    effective_college_id = None
    effective_trainer_id = None

    if current_user.role == "college_admin":
        if college_id and college_id != current_user.college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: Access to another college's students is prohibited.",
            )
        effective_college_id = current_user.college_id
        if batch_id:
            verify_batch_access(db, batch_id, current_user)

    elif current_user.role == "trainer":
        effective_trainer_id = current_user.id
        if batch_id:
            verify_batch_access(db, batch_id, current_user)

    elif current_user.role == "super_admin":
        effective_college_id = college_id

    students = get_students_list(
        db,
        college_id=effective_college_id,
        batch_id=batch_id,
        search=search,
        status_filter=status,
        trainer_id=effective_trainer_id,
        limit=limit,
        offset=offset,
    )
    return [EnrolledStudentResponse(**s) for s in students]


@router.post(
    "",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Individual Student",
)
def register_student(
    payload: StudentCreate,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> StudentResponse:
    """
    Onboards an individual student into the college.
    Enforces college tenant isolation.
    """
    enforced_college_id = None
    if current_user.role == "college_admin":
        if payload.college_id and payload.college_id != current_user.college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: Cannot register student for another college.",
            )
        enforced_college_id = current_user.college_id

    student = create_student(db, payload, enforced_college_id=enforced_college_id)
    return StudentResponse.model_validate(student)


@router.post(
    "/bulk-enroll",
    response_model=BulkStudentEnrollResponse,
    status_code=status.HTTP_200_OK,
    summary="Bulk Import & Enroll Students (CSV/JSON)",
)
def bulk_enroll(
    payload: BulkStudentEnrollRequest,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> BulkStudentEnrollResponse:
    """
    Bulk onboards students from CSV/JSON into a specific batch.
    Enforces college tenant isolation.
    """
    batch = verify_batch_access(db, payload.batch_id, current_user)
    enforced_college_id = batch.college_id

    result = bulk_enroll_students(
        db=db,
        batch_id=payload.batch_id,
        enforced_college_id=enforced_college_id,
        students=payload.students,
    )
    return BulkStudentEnrollResponse(**result)


@router.get(
    "/me/profile",
    status_code=status.HTTP_200_OK,
    summary="Get Authenticated Student Profile & Enrolled Batches",
)
def get_my_profile(
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
):
    """
    Retrieves full profile for the authenticated student.
    """
    student = get_student_by_id(db, current_user.id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")
    return student


@router.get(
    "/me/batches",
    status_code=status.HTTP_200_OK,
    summary="Get Batches for Authenticated Student",
)
def get_my_student_batches(
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
):
    """
    Retrieves all cohorts the current student is enrolled in.
    """
    return get_student_enrolled_batches(db, current_user.id)


@router.get(
    "/me/batches/{batch_id}/details",
    status_code=status.HTTP_200_OK,
    summary="Get Detailed Batch Information for Enrolled Student",
)
def get_my_student_batch_details(
    batch_id: UUID,
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
):
    """
    Retrieves comprehensive batch information, trainers, sessions, resources, and attendance.
    """
    details = get_student_batch_full_details(db, current_user.id, batch_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found or student is not enrolled.")
    return details


@router.get(
    "/me/sessions",
    status_code=status.HTTP_200_OK,
    summary="Get Training Sessions with Attendance Marks for Student",
)
def get_my_student_sessions(
    batch_id: Optional[UUID] = Query(None, description="Filter by Batch ID"),
    filter: Optional[str] = Query(None, description="all | upcoming | past"),
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
):
    """
    Retrieves training sessions across enrolled batches with individual student attendance status.
    """
    return get_student_sessions_list(db, current_user.id, batch_id=batch_id, filter_type=filter)


@router.get(
    "/me/dashboard",
    status_code=status.HTTP_200_OK,
    summary="Get Composite Student Dashboard Data",
)
def get_my_student_dashboard(
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
):
    """
    Retrieves aggregated student dashboard data in a single high-performance payload.
    """
    data = get_student_dashboard_composite(db, current_user.id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")
    return data


@router.get(
    "/{student_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Student Details by ID",
)
def get_student_details(
    student_id: UUID,
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves student profile by ID.
    Enforces ownership and tenant access control:
    - Students may only view their own records.
    - College Admins may only view students of their own institution.
    - Trainers may only view students enrolled in their assigned batches.
    """
    verify_student_access(db, student_id, current_user)
    student = get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")
    return student


@router.put(
    "/{student_id}",
    response_model=StudentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Student Details",
)
def update_student_details(
    student_id: UUID,
    payload: StudentUpdate,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> StudentResponse:
    """
    Updates student demographics and credentials.
    Enforces tenant access control on the target student.
    """
    student = verify_student_access(db, student_id, current_user)
    tenant_college_id = current_user.college_id if current_user.role == "college_admin" else None
    updated = update_student(db, student_id, payload, tenant_college_id=tenant_college_id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")
    return StudentResponse.model_validate(updated)


@router.post(
    "/{student_id}/credentials",
    response_model=SingleStudentCredentialsResponse,
    status_code=status.HTTP_200_OK,
    summary="Assign Credentials to Single Student",
)
def assign_single_credentials(
    student_id: UUID,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
    **kwargs,
) -> SingleStudentCredentialsResponse:
    verify_student_access(db, student_id, current_user)
    success, temp_pw, roll_num = assign_student_credentials(
        db,
        student_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_email=current_user.email,
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")
    return SingleStudentCredentialsResponse(
        success=True,
        student_id=student_id,
        roll_number=roll_num or "",
        temporary_password=temp_pw,
        message="Credentials assigned successfully.",
    )


@router.delete(
    "/{student_id}/credentials",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke Credentials from Single Student",
)
def revoke_single_credentials(
    student_id: UUID,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> MessageResponse:
    verify_student_access(db, student_id, current_user)
    success = revoke_student_credentials(
        db,
        student_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_email=current_user.email,
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")
    return MessageResponse(success=True, message="Credentials revoked successfully.")


@router.post(
    "/roster-preview",
    response_model=RosterImportPreviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate & Preview Student Roster Before Import",
)
def preview_roster(
    payload: RosterImportPreviewRequest,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> RosterImportPreviewResponse:
    """
    Validates uploaded student roster against existing records and constraints.
    Enforces multi-tenant college scoping for College Admins.
    """
    enforced_college_id = current_user.college_id if current_user.role == "college_admin" else payload.college_id
    return preview_roster_import(
        db=db,
        batch_id=payload.batch_id,
        students=payload.students,
        enforced_college_id=enforced_college_id,
    )


@router.post(
    "/roster-import",
    response_model=RosterImportExecuteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Execute Roster Import & Automatic Student Account Provisioning",
)
def execute_roster_import(
    payload: RosterImportExecuteRequest,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> RosterImportExecuteResponse:
    """
    Executes student roster onboarding and automatic login account provisioning:
    - Automatically creates student profiles and assigns to batch.
    - Provisions login accounts in 'pending_activation' with single-use activation credentials.
    - Stores only hashed credentials in database.
    - Returns one-time activation report for institutional distribution.
    - Enforces tenant isolation for College Admins.
    """
    enforced_college_id = current_user.college_id if current_user.role == "college_admin" else payload.college_id
    return execute_roster_import_and_provision(
        db=db,
        batch_id=payload.batch_id,
        students=payload.students,
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_email=current_user.email,
        enforced_college_id=enforced_college_id,
    )


@router.patch(
    "/{student_id}/status",
    response_model=StudentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Individual Student Account Status (Active/Inactive/Archived)",
)
def update_student_status(
    student_id: UUID,
    payload: StudentStatusUpdatePayload,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> StudentResponse:
    """
    Toggles student status. If deactivated or archived, revokes all active sessions.
    """
    tenant_college_id = current_user.college_id if current_user.role == "college_admin" else None
    student = update_student_account_status(
        db=db,
        student_id=student_id,
        new_status=payload.status,
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_email=current_user.email,
        reason=payload.reason,
        tenant_college_id=tenant_college_id,
    )
    return StudentResponse.model_validate(student)


@router.post(
    "/{student_id}/reset-activation",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Re-issue Activation Credential for Student",
)
def reset_activation(
    student_id: UUID,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Re-issues a single-use activation credential for a student and sets account to 'pending_activation'.
    Revokes any active sessions and returns the new temporary credential for distribution.
    """
    tenant_college_id = current_user.college_id if current_user.role == "college_admin" else None
    success, code = reset_student_activation_credential(
        db=db,
        student_id=student_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_email=current_user.email,
        tenant_college_id=tenant_college_id,
    )
    return MessageResponse(
        success=True,
        message=f"Activation credential generated: {code}. Student must activate at /login with roll number and date of birth.",
    )


@router.post(
    "/{student_id}/revoke-sessions",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke All Active Sessions for Target Student",
)
def revoke_sessions(
    student_id: UUID,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Immediately revokes all active session tokens for the target student in user_sessions.
    """
    tenant_college_id = current_user.college_id if current_user.role == "college_admin" else None
    count = revoke_student_active_sessions(
        db=db,
        student_id=student_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_email=current_user.email,
        tenant_college_id=tenant_college_id,
    )
    return MessageResponse(success=True, message=f"Successfully revoked {count} active session(s).")


@router.delete(
    "/{student_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Safeguarded Student Account Deletion or Archival",
)
def delete_student(
    student_id: UUID,
    mode: str = Query("archive", pattern="^(archive|permanent)$", description="'archive' (safe retention) or 'permanent' (only permitted if zero academic records)"),
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Deletes or archives a student record:
    - If historical records exist (attendance, submissions, certificates), permanent deletion is blocked
      and safe archival is executed to maintain academic audit integrity.
    - If student has zero academic records, permanent deletion is permitted.
    """
    # College admin cannot permanently delete; only super_admin can request permanent deletion
    if mode == "permanent" and current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permanent deletion of student records is restricted to Super Administrators. Use safe archival.",
        )

    tenant_college_id = current_user.college_id if current_user.role == "college_admin" else None
    res = delete_or_archive_student(
        db=db,
        student_id=student_id,
        mode=mode,
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_email=current_user.email,
        tenant_college_id=tenant_college_id,
    )
    return MessageResponse(success=True, message=res["message"])


@router.post(
    "/bulk-deletion-preview",
    status_code=status.HTTP_200_OK,
    summary="Impact Analysis for Bulk Student Deletion",
)
def preview_bulk_delete(
    student_ids: List[UUID],
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
):
    """
    Analyzes the impact of deleting selected students:
    - Identifies which students have historical academic records (attendance, exams, certificates).
    - Suggests safe archival vs permanent deletion.
    """
    tenant_college_id = current_user.college_id if current_user.role == "college_admin" else None
    return preview_bulk_deletion(db=db, student_ids=student_ids, tenant_college_id=tenant_college_id)


@router.post(
    "/bulk-action",
    response_model=BulkStudentActionResult,
    status_code=status.HTTP_200_OK,
    summary="Execute Collective Bulk Action Across Students",
)
def bulk_student_action(
    payload: BulkStudentActionPayload,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> BulkStudentActionResult:
    """
    Executes collective bulk actions:
    - Bulk Deactivate
    - Bulk Reactivate
    - Bulk Revoke Sessions
    - Bulk Reset Activation Credentials
    - Bulk Delete / Archive (respecting academic data safeguards)
    """
    if payload.action == "delete" and payload.mode == "permanent" and current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permanent bulk deletion is restricted to Super Administrators. Use safe archival.",
        )

    tenant_college_id = current_user.college_id if current_user.role == "college_admin" else None
    return execute_bulk_student_action(
        db=db,
        payload=payload,
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_email=current_user.email,
        tenant_college_id=tenant_college_id,
    )


