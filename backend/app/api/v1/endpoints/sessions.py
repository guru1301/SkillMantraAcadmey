"""
Training Session API Endpoints: Live session scheduling and management.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import (
    AuthenticatedUser,
    get_verified_active_user,
    get_db,
    require_staff,
    verify_batch_access,
    verify_session_access,
)
from backend.app.schemas.session import (
    TrainingSessionCreate,
    TrainingSessionDetailResponse,
    TrainingSessionResponse,
    TrainingSessionUpdate,
)
from backend.app.services.session_attendance_service import (
    create_training_session,
    get_batch_calendar_sessions,
    list_sessions_for_batch,
    update_training_session,
)

router = APIRouter(prefix="/sessions", tags=["Training Sessions"])


@router.get(
    "",
    response_model=List[TrainingSessionDetailResponse],
    status_code=status.HTTP_200_OK,
    summary="List Training Sessions for a Batch",
)
def get_sessions(
    batch_id: UUID = Query(..., description="Batch ID"),
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> List[TrainingSessionDetailResponse]:
    """
    Retrieves all scheduled, completed, and cancelled sessions for a batch.
    Enforces authorization on the target batch.
    """
    verify_batch_access(db, batch_id, current_user)
    sessions = list_sessions_for_batch(db, batch_id)
    return [TrainingSessionDetailResponse(**s) for s in sessions]


@router.post(
    "",
    response_model=TrainingSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule New Training Session",
)
def schedule_session(
    payload: TrainingSessionCreate,
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
) -> TrainingSessionResponse:
    """
    Schedules a new live class or training session.
    Enforces authorization on the target batch.
    """
    verify_batch_access(db, payload.batch_id, current_user)

    if current_user.role == "trainer" and not payload.trainer_id:
        payload.trainer_id = current_user.id

    session = create_training_session(db, payload)
    return TrainingSessionResponse.model_validate(session)


@router.put(
    "/{session_id}",
    response_model=TrainingSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Training Session",
)
def update_session(
    session_id: UUID,
    payload: TrainingSessionUpdate,
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
) -> TrainingSessionResponse:
    """
    Updates meeting links, date/time, or completion status of a session.
    Enforces authorization on the parent batch.
    """
    verify_session_access(db, session_id, current_user)
    updated = update_training_session(db, session_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training session not found.")
    return TrainingSessionResponse.model_validate(updated)


@router.get(
    "/batch/{batch_id}/calendar",
    status_code=status.HTTP_200_OK,
    summary="Get Batch Calendar Sessions with Attendance Rate",
)
def get_calendar_sessions(
    batch_id: UUID,
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves all calendar sessions for a batch with attendance statistics.
    """
    verify_batch_access(db, batch_id, current_user)
    return get_batch_calendar_sessions(db, batch_id)
