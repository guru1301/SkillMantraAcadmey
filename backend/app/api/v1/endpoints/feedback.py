"""
Feedback API Endpoints: Batch feedback unlock lifecycle, reporting, and student feedback submission.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.api.deps import (
    AuthenticatedUser,
    get_verified_active_user,
    get_db,
    require_student,
    require_staff,
)
from backend.app.schemas.feedback import (
    FeedbackUnlockStatusResponse,
    StudentFeedbackCreate,
    StudentFeedbackResponse,
    PendingFeedbackItemResponse,
    BatchFeedbackSummaryResponse,
)
from backend.app.services.feedback_service import (
    get_batch_feedback_status,
    unlock_batch_feedback,
    get_batch_feedback_report,
    get_student_pending_feedbacks,
    submit_student_feedback,
)

router = APIRouter(tags=["Feedback"])


@router.get(
    "/batches/{batch_id}/feedback/status",
    response_model=FeedbackUnlockStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Batch Feedback Unlock Status and Progress",
)
def get_status(
    batch_id: UUID,
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> FeedbackUnlockStatusResponse:
    """
    Returns the feedback unlock status and submission counters for a batch.
    Authorized for Super Admin, College Admin (own college), assigned Trainer, and enrolled Students.
    """
    res = get_batch_feedback_status(db, batch_id, current_user)
    return FeedbackUnlockStatusResponse(**res)


@router.post(
    "/batches/{batch_id}/feedback/unlock",
    response_model=FeedbackUnlockStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Unlock Student Feedback for a Completed Batch",
)
def unlock_feedback(
    batch_id: UUID,
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
) -> FeedbackUnlockStatusResponse:
    """
    Manually unlocks student feedback submission for a completed batch.
    - Super Admin: Authorized for any completed batch.
    - Assigned Trainer: Authorized for their assigned completed batches.
    - College Admin: Forbidden (view-only).
    - Students: Forbidden.
    """
    res = unlock_batch_feedback(db, batch_id, current_user)
    return FeedbackUnlockStatusResponse(**res)


@router.get(
    "/batches/{batch_id}/feedback",
    response_model=BatchFeedbackSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Batch Feedback Overview and Submissions",
)
def get_feedback_report(
    batch_id: UUID,
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
) -> BatchFeedbackSummaryResponse:
    """
    Retrieves aggregated feedback metrics, rating distribution, and written comments.
    Enforces RBAC: Super Admin (all), College Admin (own college), Assigned Trainer (own batches).
    """
    res = get_batch_feedback_report(db, batch_id, current_user)
    return BatchFeedbackSummaryResponse(**res)


@router.get(
    "/student/feedback/pending",
    response_model=List[PendingFeedbackItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Pending Unlocked Feedback Forms for Student",
)
@router.get(
    "/students/me/feedback/pending",
    response_model=List[PendingFeedbackItemResponse],
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def get_pending_feedback_forms(
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
) -> List[PendingFeedbackItemResponse]:
    """
    Lists all unlocked batches where the authenticated student is actively enrolled
    and has not yet submitted feedback.
    """
    forms = get_student_pending_feedbacks(db, current_user.id)
    return [PendingFeedbackItemResponse(**f) for f in forms]


@router.post(
    "/batches/{batch_id}/feedback",
    response_model=StudentFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Student Post-Training Feedback",
)
def post_student_feedback(
    batch_id: UUID,
    payload: StudentFeedbackCreate,
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
) -> StudentFeedbackResponse:
    """
    Submits student feedback (rating 1-10, comments 10-2000 chars) for an unlocked batch.
    Enforces single submission per student per batch.
    """
    res = submit_student_feedback(db, batch_id, current_user.id, payload)
    return StudentFeedbackResponse(**res)

