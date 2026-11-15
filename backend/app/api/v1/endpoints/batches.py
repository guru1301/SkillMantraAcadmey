"""
Batch API Endpoints: Cohort scheduling, roster statistics, and lifecycle tracking.
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
    require_super_admin,
    verify_batch_access,
)
from backend.app.schemas.batch import (
    BatchCreate,
    BatchDetailResponse,
    BatchResponse,
    BatchStatsResponse,
    BatchStatusUpdate,
    BatchUpdate,
)
from backend.app.schemas.common import MessageResponse
from backend.app.schemas.trainer import BatchAssignedTrainerResponse
from backend.app.schemas.student import (
    BatchCredentialsAssignResponse,
    StudentCredentialItem,
)
from backend.app.services.batch_service import (
    assign_batch_student_credentials,
    create_batch,
    get_batch_by_id,
    get_batch_stats,
    get_batch_trainers,
    get_batches_list,
    remove_student_from_batch,
    remove_trainer_from_batch,
    revoke_batch_student_credentials,
    set_batch_lead_trainer,
    set_batch_status,
    update_batch,
)

router = APIRouter(prefix="/batches", tags=["Batches"])


@router.get(
    "",
    response_model=List[BatchDetailResponse],
    status_code=status.HTTP_200_OK,
    summary="List Batches",
)
def list_batches(
    college_id: Optional[UUID] = Query(None, description="Filter by college ID"),
    program_id: Optional[UUID] = Query(None, description="Filter by program ID"),
    status: Optional[str] = Query(None, description="Filter by status (planned/active/completed/cancelled)"),
    search: Optional[str] = Query(None, description="Search by code, college, or program"),
    limit: Optional[int] = Query(None, ge=1, le=500, description="Maximum batches to return"),
    offset: Optional[int] = Query(None, ge=0, description="Offset for pagination"),
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> List[BatchDetailResponse]:
    """
    Retrieves batches matching filters.
    Enforces tenant isolation:
    - College Admin: strictly scoped to own college (cannot view other colleges).
    - Trainer: strictly scoped to batches assigned to this trainer.
    - Student: strictly scoped to batches the student is enrolled in.
    - Super Admin: platform-wide access.
    """
    effective_college_id = None
    effective_trainer_id = None
    effective_student_id = None

    if current_user.role == "college_admin":
        if college_id and college_id != current_user.college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: Access to another college's batches is prohibited.",
            )
        effective_college_id = current_user.college_id

    elif current_user.role == "trainer":
        effective_trainer_id = current_user.id

    elif current_user.role == "student":
        effective_student_id = current_user.id

    elif current_user.role == "super_admin":
        effective_college_id = college_id

    batches = get_batches_list(
        db,
        college_id=effective_college_id,
        program_id=program_id,
        status_filter=status,
        search=search,
        trainer_id=effective_trainer_id,
        student_id=effective_student_id,
        limit=limit,
        offset=offset,
    )
    return [BatchDetailResponse(**b) for b in batches]


@router.post(
    "",
    response_model=BatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Batch (Super Admin / College Admin)",
)
def create_new_batch(
    payload: BatchCreate,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> BatchResponse:
    """
    Provisions a new cohort batch.
    For college_admin, college_id is strictly derived from the authenticated session.
    """
    enforced_college_id = None
    if current_user.role == "college_admin":
        if payload.college_id and payload.college_id != current_user.college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: Cannot create batches for another college institution.",
            )
        enforced_college_id = current_user.college_id

    batch = create_batch(
        db=db,
        data=payload,
        creator_id=current_user.id,
        enforced_college_id=enforced_college_id,
    )
    return BatchResponse.model_validate(batch)


@router.get(
    "/{batch_id}",
    response_model=BatchDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Batch Details",
)
def get_batch_details(
    batch_id: UUID,
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> BatchDetailResponse:
    """
    Retrieves detailed cohort information.
    Enforces authorization:
    - College Admin must own the batch.
    - Trainer must be assigned to the batch.
    - Student must be enrolled in the batch.
    """
    verify_batch_access(db, batch_id, current_user)
    batch = get_batch_by_id(db, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    return BatchDetailResponse(**batch)


def _assert_batch_status_permission(current_user: AuthenticatedUser, requested_status: str) -> None:
    """Enforces that college_admin may only move batch status to 'active'."""
    if current_user.role == "college_admin" and requested_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Administrators may set batch status to 'completed', 'cancelled', or 'planned'.",
        )


def _assert_super_admin(current_user: AuthenticatedUser) -> None:
    """Defense-in-depth guard ensuring direct handler calls enforce Super Admin role."""
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Super Administrator privileges required.",
        )


@router.put(
    "/{batch_id}",
    response_model=BatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Batch",
)
def update_batch_details(
    batch_id: UUID,
    payload: BatchUpdate,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> BatchResponse:
    """
    Updates batch scheduling and parameters.
    Enforces college ownership and restricts status updates to 'active' for College Admins.
    """
    if "status" in payload.model_fields_set and payload.status is not None:
        _assert_batch_status_permission(current_user, payload.status)
    verify_batch_access(db, batch_id, current_user)
    tenant_college_id = current_user.college_id if current_user.role == "college_admin" else None
    updated = update_batch(db, batch_id, payload, tenant_college_id=tenant_college_id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    return BatchResponse.model_validate(updated)


@router.patch(
    "/{batch_id}/status",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Batch Status",
)
def change_batch_status(
    batch_id: UUID,
    payload: BatchStatusUpdate,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Updates cohort progression status.
    Only Super Admins may set 'completed', 'cancelled', or 'planned'; College Admins may move to 'active' only.
    """
    _assert_batch_status_permission(current_user, payload.status)
    verify_batch_access(db, batch_id, current_user)
    tenant_college_id = current_user.college_id if current_user.role == "college_admin" else None
    success = set_batch_status(db, batch_id, payload.status, tenant_college_id=tenant_college_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    return MessageResponse(success=True, message=f"Batch status updated to '{payload.status}'.")


@router.get(
    "/{batch_id}/stats",
    response_model=BatchStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Batch Statistics",
)
def get_stats(
    batch_id: UUID,
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> BatchStatsResponse:
    """
    Retrieves operational metrics for a batch.
    Enforces access verification on the batch.
    """
    verify_batch_access(db, batch_id, current_user)
    stats = get_batch_stats(db, batch_id)
    return BatchStatsResponse(**stats)


@router.get(
    "/{batch_id}/trainers",
    response_model=List[BatchAssignedTrainerResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Trainers Assigned to a Batch",
)
def get_trainers_for_batch(
    batch_id: UUID,
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> List[BatchAssignedTrainerResponse]:
    verify_batch_access(db, batch_id, current_user)
    trainers = get_batch_trainers(db, batch_id)
    return [BatchAssignedTrainerResponse(**t) for t in trainers]


@router.patch(
    "/{batch_id}/trainers/{trainer_id}/lead",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Set Lead Trainer for a Batch",
)
def set_lead_trainer(
    batch_id: UUID,
    trainer_id: UUID,
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    _assert_super_admin(current_user)
    verify_batch_access(db, batch_id, current_user)
    success = set_batch_lead_trainer(db, batch_id, trainer_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer assignment not found.")
    return MessageResponse(success=True, message="Lead trainer set successfully.")


@router.delete(
    "/{batch_id}/trainers/{trainer_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove Trainer from Batch",
)
def remove_trainer_from_batch_route(
    batch_id: UUID,
    trainer_id: UUID,
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    _assert_super_admin(current_user)
    verify_batch_access(db, batch_id, current_user)
    success = remove_trainer_from_batch(db, batch_id, trainer_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer assignment not found.")
    return MessageResponse(success=True, message="Trainer removed from batch successfully.")


@router.delete(
    "/{batch_id}/students/{student_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove Student from Batch",
)
def remove_student_from_batch_route(
    batch_id: UUID,
    student_id: UUID,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> MessageResponse:
    verify_batch_access(db, batch_id, current_user)
    success = remove_student_from_batch(db, batch_id, student_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student enrollment record not found.")
    return MessageResponse(success=True, message="Student removed from batch successfully.")


@router.post(
    "/{batch_id}/credentials",
    response_model=BatchCredentialsAssignResponse,
    status_code=status.HTTP_200_OK,
    summary="Assign Credentials to Batch Students",
)
def assign_credentials(
    batch_id: UUID,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
    **kwargs,
) -> BatchCredentialsAssignResponse:
    verify_batch_access(db, batch_id, current_user)
    credentials_data = assign_batch_student_credentials(
        db,
        batch_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_email=current_user.email,
    )
    items = [StudentCredentialItem(**c) for c in credentials_data]
    return BatchCredentialsAssignResponse(
        success=True,
        count=len(items),
        credentials=items,
        message=f"Assigned credentials to {len(items)} students.",
    )


@router.delete(
    "/{batch_id}/credentials",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke Credentials from Batch Students",
)
def revoke_credentials(
    batch_id: UUID,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> MessageResponse:
    verify_batch_access(db, batch_id, current_user)
    count = revoke_batch_student_credentials(
        db,
        batch_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_email=current_user.email,
    )
    return MessageResponse(success=True, message=f"Revoked credentials from {count} students.")

