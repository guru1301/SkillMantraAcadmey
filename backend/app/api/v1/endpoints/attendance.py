"""
Attendance API Endpoints: Bulk attendance marking and student attendance histories.
"""
from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import (
    AuthenticatedUser,
    get_verified_active_user,
    get_db,
    require_staff,
    require_student,
    require_super_admin,
    verify_batch_access,
    verify_session_access,
    verify_student_access,
)
from backend.app.schemas.attendance import (
    BulkAttendanceMarkRequest,
    PlatformAttendanceStatsResponse,
    SessionRosterItem,
    StudentAttendanceSummaryResponse,
)
from backend.app.schemas.common import MessageResponse
from backend.app.services.session_attendance_service import (
    get_platform_attendance_stats,
    get_session_roster,
    get_student_attendance_summary,
    get_trainer_batch_live_roster,
    record_bulk_attendance,
    save_live_batch_attendance,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get(
    "/live-roster",
    status_code=status.HTTP_200_OK,
    summary="Get Live Attendance Roster for Date and Batch",
)
def get_live_roster(
    batch_id: UUID = Query(..., description="Batch ID"),
    date: str = Query(..., description="Date YYYY-MM-DD"),
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
):
    """
    Retrieves batch details, session info, and student attendance roster for live marking.
    Raises 403 when caller is an unassigned trainer or a college_admin outside their college.
    """
    verify_batch_access(db, batch_id, current_user)
    is_super_admin = current_user.role == "super_admin"
    return get_trainer_batch_live_roster(
        db,
        current_user.id,
        batch_id,
        date,
        is_super_admin=is_super_admin,
        caller_role=current_user.role,
        caller_college_id=current_user.college_id,
    )


@router.post(
    "/live-save",
    status_code=status.HTTP_200_OK,
    summary="Save Live Batch Attendance Records",
)
def save_live_roster_attendance(
    payload: Dict[str, Any] = Body(...),
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
):
    """
    Saves or updates training session and student attendance marks in a validated transaction.
    """
    raw_batch_id = payload.get("batchId")
    if not raw_batch_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="batchId is required.")
    try:
        batch_id = raw_batch_id if isinstance(raw_batch_id, UUID) else UUID(str(raw_batch_id))
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid batchId UUID.")

    verify_batch_access(db, batch_id, current_user)

    date_val = str(payload.get("date") or "").strip()
    if not date_val:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="date is required.")
    title_val = str(payload.get("title", f"Session on {date_val}"))
    topic_val = payload.get("topic")
    records_val = payload.get("records", [])

    is_super_admin = current_user.role == "super_admin"
    return save_live_batch_attendance(
        db=db,
        trainer_id=current_user.id,
        batch_id=batch_id,
        date_str=date_val,
        title=title_val,
        topic=topic_val,
        records=records_val,
        is_super_admin=is_super_admin,
        caller_role=current_user.role,
        caller_college_id=current_user.college_id,
    )


@router.post(
    "/mark",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Record Bulk Session Attendance (Staff / Trainer)",
)
def mark_session_attendance(
    payload: BulkAttendanceMarkRequest,
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Submits attendance records for students in a session and transitions session to 'completed'.
    Enforces authorization:
    - User must have access to manage the session's cohort batch (College Admin scoped to college, Trainer assigned to batch).
    - Students are strictly prohibited.
    - Integrity guard: Each submitted student must be enrolled in the session's batch.
    - Only super_admin may edit attendance older than 7 days.
    """
    # Verify session authorization
    verify_session_access(db, payload.session_id, current_user)

    marked_count = record_bulk_attendance(
        db=db,
        session_id=payload.session_id,
        records=payload.records,
        marker_id=current_user.id,
        marker_role=current_user.role,
    )
    return MessageResponse(
        success=True,
        message=f"Successfully recorded attendance for {marked_count} students.",
    )


@router.get(
    "/me/summary",
    response_model=StudentAttendanceSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current Student Attendance Summary",
)
def get_my_attendance_summary(
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
) -> StudentAttendanceSummaryResponse:
    """
    Calculates attendance percentage, recorded counts, and full session history for the logged-in student.
    """
    summary = get_student_attendance_summary(db, current_user.id)
    return StudentAttendanceSummaryResponse(**summary)


@router.get(
    "/student/{student_id}/summary",
    response_model=StudentAttendanceSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Student Attendance Summary by ID",
)
def get_student_summary(
    student_id: UUID,
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> StudentAttendanceSummaryResponse:
    """
    Retrieves student attendance breakdown.
    Enforces authorization:
    - Students may only inspect their own attendance history.
    - College Admins may only inspect students belonging to their college.
    - Trainers may only inspect students enrolled in their assigned cohorts.
    - Super Admins have platform-wide access.
    """
    verify_student_access(db, student_id, current_user)

    summary = get_student_attendance_summary(db, student_id)
    return StudentAttendanceSummaryResponse(**summary)


@router.get(
    "/sessions/{session_id}/roster",
    response_model=List[SessionRosterItem],
    status_code=status.HTTP_200_OK,
    summary="Get Attendance Roster for a Session",
)
def get_session_attendance_roster(
    session_id: UUID,
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
) -> List[SessionRosterItem]:
    """
    Retrieves student roster for a specific training session with attendance marks.
    Enforces authorization on the parent batch.
    """
    verify_session_access(db, session_id, current_user)
    roster = get_session_roster(db, session_id)
    return [SessionRosterItem(**r) for r in roster]


@router.get(
    "/stats",
    response_model=PlatformAttendanceStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Platform Attendance Statistics",
)
def get_attendance_platform_stats(
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> PlatformAttendanceStatsResponse:
    """
    Retrieves platform-wide attendance rates and counts. Super Admin only.
    """
    stats = get_platform_attendance_stats(db)
    return PlatformAttendanceStatsResponse(**stats)

