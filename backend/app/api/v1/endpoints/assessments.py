"""
Assessment API Endpoints: Quiz creation, question configuration, and student submission scoring.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import (
    AuthenticatedUser,
    get_verified_active_user,
    get_db,
    require_staff,
    require_student,
    require_trainer_or_super_admin,
    verify_assessment_access,
    verify_batch_access,
    verify_student_access,
)
from backend.app.schemas.common import MessageResponse
from backend.app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    AssessmentStudentView,
    AssessmentSubmissionRequest,
    AssessmentSubmissionResponse,
    AssessmentUpdate,
)
from backend.app.schemas.proctoring import (
    ExamProctoringSummaryResponse,
    ExamSaveProgressRequest,
    ExamSaveProgressResponse,
    ExamSecurityEventCreate,
    ExamSecurityEventResponse,
    ExamStartResponse,
)
from backend.app.services.assessment_service import (
    create_assessment,
    delete_assessment,
    get_assessment_by_id,
    get_assessments_for_batch,
    get_student_available_assessments,
    get_trainer_assessment_details,
    get_trainer_assessments_list,
    submit_assessment_attempt,
    update_assessment,
)
from backend.app.services.proctoring_service import (
    get_exam_proctoring_logs,
    record_security_event,
    save_exam_progress,
    start_exam_session,
)

router = APIRouter(prefix="/assessments", tags=["Assessments & Examinations"])


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="List Assessments for a Batch",
)
def list_assessments(
    batch_id: UUID = Query(..., description="Batch ID"),
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves assessments for a cohort batch.
    Enforces authorization on the batch:
    - Students must be enrolled in the batch.
    - Trainers must be assigned to the batch.
    - College Admins must own the batch.
    """
    verify_batch_access(db, batch_id, current_user)
    student_id = current_user.id if current_user.role == "student" else None
    return get_assessments_for_batch(db, batch_id, student_id=student_id)


@router.get(
    "/student/available",
    status_code=status.HTTP_200_OK,
    summary="Get Available Assessments for Current Student",
)
def get_available_student_assessments(
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
):
    """
    Lists all published quizzes, assignments, and practical tests across the student's enrolled batches.
    """
    return get_student_available_assessments(db, current_user.id)


def _assert_assessment_editor(current_user: AuthenticatedUser) -> None:
    """Restricts assessment mutations strictly to Super Admins and batch-assigned Trainers."""
    if current_user.role not in ("super_admin", "trainer"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Administrators and assigned Trainers may create, modify, or delete assessments.",
        )


@router.post(
    "",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Assessment (Assigned Trainer / Super Admin)",
)
def create_new_assessment(
    payload: AssessmentCreate,
    current_user: AuthenticatedUser = Depends(require_trainer_or_super_admin),
    db: Session = Depends(get_db),
) -> AssessmentResponse:
    """
    Creates an assessment with questions, options, point weights, and scheduling.
    Enforces trainer assignment or Super Admin privileges on the target batch.
    """
    _assert_assessment_editor(current_user)
    verify_batch_access(db, payload.batch_id, current_user)
    assessment = create_assessment(db, payload, creator_id=current_user.id)
    return AssessmentResponse.model_validate(assessment)


@router.get(
    "/trainer/all",
    status_code=status.HTTP_200_OK,
    summary="Get All Assessments for Current Trainer",
)
def get_my_trainer_assessments(
    batch_id: Optional[UUID] = Query(None, description="Filter by Batch ID"),
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
):
    """
    Retrieves all assessments across batches assigned to this trainer (or filtered by batch_id).
    """
    return get_trainer_assessments_list(db, current_user.id, batch_id=batch_id)


@router.get(
    "/{assessment_id}/trainer-details",
    status_code=status.HTTP_200_OK,
    summary="Get Full Assessment Details with Student Submissions (Staff)",
)
def get_assessment_trainer_details(
    assessment_id: UUID,
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
):
    """
    Retrieves full details of an assessment including questions and individual student submissions.
    """
    verify_assessment_access(db, assessment_id, current_user)
    details = get_trainer_assessment_details(db, assessment_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")
    return details


@router.get(
    "/{assessment_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Assessment Details",
)
def get_assessment(
    assessment_id: UUID,
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves assessment instructions and questions.
    Enforces authorization:
    - Students must be enrolled in the cohort.
    - For students attempting the test, correct answer keys and explanations are masked.
    """
    verify_assessment_access(db, assessment_id, current_user)
    mask_answers = current_user.role == "student"
    student_id = current_user.id if current_user.role == "student" else None
    assessment = get_assessment_by_id(
        db, assessment_id, mask_correct_answers=mask_answers, student_id=student_id
    )
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")
    return assessment


@router.put(
    "/{assessment_id}",
    response_model=AssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Assessment (Assigned Trainer / Super Admin)",
)
def edit_assessment(
    assessment_id: UUID,
    payload: AssessmentUpdate,
    current_user: AuthenticatedUser = Depends(require_trainer_or_super_admin),
    db: Session = Depends(get_db),
) -> AssessmentResponse:
    """
    Updates assessment questions, time limits, or publishing status.
    Enforces trainer assignment or Super Admin privileges on the assessment's batch.
    """
    _assert_assessment_editor(current_user)
    verify_assessment_access(db, assessment_id, current_user)
    updated = update_assessment(db, assessment_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")
    return AssessmentResponse.model_validate(updated)


@router.post(
    "/submit",
    response_model=AssessmentSubmissionResponse,
    response_model_exclude_none=True,
    status_code=status.HTTP_200_OK,
    summary="Submit Assessment Answers and Calculate Score (Student)",
)
def submit_assessment(
    payload: AssessmentSubmissionRequest,
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
) -> AssessmentSubmissionResponse:
    """
    Evaluates exam answers against master answer key, calculates scaled scores,
    and returns review results (answer keys withheld until after assessment deadline).
    Enforces that student is enrolled in the assessment's cohort.
    """
    result = submit_assessment_attempt(
        db=db,
        assessment_id=payload.assessment_id,
        student_id=current_user.id,
        answers=payload.answers,
    )
    return AssessmentSubmissionResponse(**result)


@router.delete(
    "/{assessment_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Assessment (Assigned Trainer / Super Admin)",
)
def delete_existing_assessment(
    assessment_id: UUID,
    current_user: AuthenticatedUser = Depends(require_trainer_or_super_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Deletes an assessment and its submissions.
    Super Admin / Assigned Trainer only.
    """
    _assert_assessment_editor(current_user)
    verify_assessment_access(db, assessment_id, current_user)
    success = delete_assessment(db, assessment_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")
    return MessageResponse(success=True, message="Assessment deleted successfully.")


@router.post(
    "/{assessment_id}/start",
    response_model=ExamStartResponse,
    status_code=status.HTTP_200_OK,
    summary="Initialize or Resume Secure Examination Attempt (Student)",
)
def start_exam(
    assessment_id: UUID,
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
) -> ExamStartResponse:
    """
    Initializes a secure exam terminal attempt or restores an existing in-progress attempt.
    """
    res = start_exam_session(db, current_user.id, assessment_id)
    return ExamStartResponse(**res)


@router.post(
    "/{assessment_id}/save-progress",
    response_model=ExamSaveProgressResponse,
    status_code=status.HTTP_200_OK,
    summary="Auto-Save In-Progress Examination Answers (Student)",
)
def save_progress(
    assessment_id: UUID,
    payload: ExamSaveProgressRequest,
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
) -> ExamSaveProgressResponse:
    """
    Auto-saves intermediate responses to guard against browser crashes, accidental reloads, or network loss.
    """
    payload.assessment_id = assessment_id
    res = save_exam_progress(db, current_user.id, payload)
    return ExamSaveProgressResponse(**res)


@router.post(
    "/{assessment_id}/security-event",
    response_model=ExamSecurityEventResponse,
    status_code=status.HTTP_200_OK,
    summary="Log Examination Security/Proctoring Event (Student)",
)
def log_security_event(
    assessment_id: UUID,
    payload: ExamSecurityEventCreate,
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
) -> ExamSecurityEventResponse:
    """
    Captures integrity events (TAB_HIDDEN, WINDOW_BLUR, FULLSCREEN_EXIT, etc.),
    tracks durations, increments attempt violations, and applies the configurable warning policy.
    """
    payload.assessment_id = assessment_id
    res = record_security_event(db, current_user.id, payload)
    return ExamSecurityEventResponse(**res)


@router.get(
    "/{assessment_id}/proctoring-logs",
    response_model=ExamProctoringSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Inspect Proctoring Audit Logs (Staff)",
)
def inspect_proctoring_logs(
    assessment_id: UUID,
    student_id: Optional[UUID] = Query(None, description="Optional filter by Student ID"),
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
) -> ExamProctoringSummaryResponse:
    """
    Provides trainers and administrators with a chronological audit trail of all student integrity events.
    """
    verify_assessment_access(db, assessment_id, current_user)
    if student_id:
        verify_student_access(db, student_id, current_user)
    res = get_exam_proctoring_logs(db, assessment_id, student_id=student_id)
    return ExamProctoringSummaryResponse(**res)


