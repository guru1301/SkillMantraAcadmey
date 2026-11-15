"""
Trainer API Endpoints: Trainer registry, batch assignments, and trainer portal data.
"""
from typing import Any, Dict, List, Optional, Union
from uuid import UUID
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session

from backend.app.api.deps import (
    AuthenticatedUser,
    get_verified_active_user,
    get_db,
    require_admin_or_college,
    require_super_admin,
    require_trainer,
    verify_batch_access,
)
from backend.app.schemas.trainer import (
    BatchAssignedTrainerResponse,
    TrainerAdminUpdate,
    TrainerAvailableSummary,
    TrainerBatchAssignmentCreate,
    TrainerCreate,
    TrainerDetailResponse,
    TrainerResponse,
    TrainerSelfUpdate,
    TrainerUpdate,
)
from backend.app.services.trainer_service import (
    assign_trainer_to_batch,
    create_trainer,
    get_available_trainers_for_batch,
    get_trainer_assigned_batches,
    get_trainer_batches_with_rosters,
    get_trainer_by_id,
    get_trainer_recent_sessions,
    get_trainers_list,
    update_trainer,
)

router = APIRouter(prefix="/trainers", tags=["Trainers"])


@router.get(
    "",
    response_model=List[TrainerResponse],
    status_code=status.HTTP_200_OK,
    summary="List Trainers (Super Admin / College Admin)",
)
def list_trainers(
    search: Optional[str] = Query(None, description="Search by name, email, or skills"),
    status: Optional[str] = Query(None, description="Filter by status (active/inactive)"),
    limit: Optional[int] = Query(None, ge=1, le=500, description="Maximum trainers to return"),
    offset: Optional[int] = Query(None, ge=0, description="Offset for pagination"),
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> List[TrainerResponse]:
    """
    Retrieves registered trainers with assigned batch counts.
    Super Admins see all trainers; College Admins see only trainers assigned
    to batches of their own college_id.
    """
    scoped_college_id: Optional[UUID] = None
    if current_user.role == "college_admin":
        if not current_user.college_id:
            raise HTTPException(
                status_code=403,
                detail="College administrator is not bound to a valid college ID.",
            )
        scoped_college_id = current_user.college_id

    trainers = get_trainers_list(
        db,
        search=search,
        status_filter=status,
        limit=limit,
        offset=offset,
        college_id=scoped_college_id,
    )
    return [TrainerResponse(**t) for t in trainers]


@router.post(
    "",
    response_model=TrainerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Trainer (Super Admin Only)",
)
def create_new_trainer(
    payload: TrainerCreate,
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> TrainerResponse:
    """
    Registers a new corporate instructor or trainer in the master directory.
    Super Admin only.
    """
    trainer = create_trainer(db, payload)
    return TrainerResponse(
        id=trainer.id,
        name=trainer.full_name,
        email=trainer.email,
        phone=trainer.phone,
        expertise=trainer.skills.split(", ") if trainer.skills else [],
        bio=trainer.skills,
        status=trainer.status,
        created_at=trainer.created_at,
        updated_at=trainer.updated_at,
        assigned_batches_count=0,
    )


@router.get(
    "/me/batches",
    status_code=status.HTTP_200_OK,
    summary="Get Batches Assigned to Current Trainer",
)
def get_my_batches(
    current_user: AuthenticatedUser = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    """
    Retrieves cohort batches assigned to the currently logged in trainer.
    """
    return get_trainer_assigned_batches(db, current_user.id)


@router.get(
    "/me/batches-with-roster",
    status_code=status.HTTP_200_OK,
    summary="Get Batches with Enrolled Students for Current Trainer",
)
def get_my_batches_with_roster(
    current_user: AuthenticatedUser = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    """
    Retrieves all cohorts assigned to the logged-in trainer along with full student rosters.
    """
    return get_trainer_batches_with_rosters(db, current_user.id)


@router.get(
    "/me/recent-sessions",
    status_code=status.HTTP_200_OK,
    summary="Get Recent Training Sessions for Current Trainer",
)
def get_my_recent_sessions(
    limit: int = Query(10, ge=1, le=50),
    current_user: AuthenticatedUser = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    """
    Retrieves recent completed sessions and attendance summaries.
    """
    return get_trainer_recent_sessions(db, current_user.id, limit=limit)


@router.get(
    "/available",
    response_model=List[Union[TrainerResponse, TrainerAvailableSummary]],
    status_code=status.HTTP_200_OK,
    summary="Get Available Trainers for Batch Assignment",
)
def get_available_trainers(
    batch_id: UUID = Query(..., description="Target Batch ID"),
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> List[Union[TrainerResponse, TrainerAvailableSummary]]:
    """
    Retrieves active trainers not currently assigned to the given batch.
    College Admins receive only id, full_name, and skills (no email/phone).
    """
    verify_batch_access(db, batch_id, current_user)
    is_super_admin = current_user.role == "super_admin"
    trainers = get_available_trainers_for_batch(
        db, batch_id, include_contact_pii=is_super_admin
    )
    if is_super_admin:
        return [TrainerResponse(**t) for t in trainers]
    return [TrainerAvailableSummary(**t) for t in trainers]


@router.get(
    "/{trainer_id}",
    response_model=TrainerDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Trainer Details with Assigned Batches",
)
def get_trainer_details(
    trainer_id: UUID,
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> TrainerDetailResponse:
    """
    Retrieves detailed trainer information including historical and active batch assignments.
    Enforces authorization:
    - Students are not permitted to inspect trainer records directly.
    - Trainers may only inspect their own profile.
    - College Admins may inspect only trainers linked to their college and see only their own college's batches.
    - Super Admins may inspect all trainers.
    """
    if current_user.role not in ("super_admin", "college_admin", "trainer"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Students are not authorized to query trainer records.",
        )
    if current_user.role == "trainer" and current_user.id != trainer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Trainers may only view their own profile.",
        )

    scoped_college_id: Optional[UUID] = None
    if current_user.role == "college_admin":
        if not current_user.college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="College administrator is not bound to a valid college ID.",
            )
        scoped_college_id = current_user.college_id

    trainer = get_trainer_by_id(db, trainer_id, college_id=scoped_college_id)
    if not trainer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer not found.")
    return TrainerDetailResponse(**trainer)


@router.put(
    "/{trainer_id}",
    response_model=TrainerResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Trainer Profile",
)
def update_trainer_details(
    trainer_id: UUID,
    payload: Dict[str, Any] = Body(...),
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> TrainerResponse:
    """
    Updates trainer details and credentials.
    - Super Admins use TrainerAdminUpdate (full record + status management).
    - Trainers updating their own profile use TrainerSelfUpdate (full_name, phone, skills, bio only).
    """
    if current_user.role not in ("super_admin", "trainer"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Only Super Admins and the trainer themselves can update trainer profiles.",
        )
    if current_user.role == "trainer" and current_user.id != trainer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Trainers may only update their own profile.",
        )

    raw_payload = payload.model_dump(exclude_unset=True) if isinstance(payload, BaseModel) else payload
    schema_cls = TrainerSelfUpdate if current_user.role == "trainer" else TrainerAdminUpdate
    try:
        validated_payload = schema_cls.model_validate(raw_payload)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT
            if hasattr(status, "HTTP_422_UNPROCESSABLE_CONTENT")
            else 422,
            detail=jsonable_encoder(exc.errors(include_url=False, include_context=False)),
        )

    updated = update_trainer(db, trainer_id, validated_payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer not found.")
    return TrainerResponse(
        id=updated.id,
        name=updated.full_name,
        email=updated.email,
        phone=updated.phone,
        expertise=updated.skills.split(", ") if updated.skills else [],
        bio=updated.skills,
        status=updated.status,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
        assigned_batches_count=0,
    )


@router.post(
    "/assign-batch",
    status_code=status.HTTP_200_OK,
    summary="Assign Trainer to Batch",
)
def assign_to_batch(
    payload: TrainerBatchAssignmentCreate,
    batch_id: UUID = Query(..., description="Target batch ID"),
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
):
    """
    Assigns a trainer to a batch with specified role and lead designation.
    Enforces college ownership if called by a College Admin.
    """
    # Verify authorization on the target batch
    verify_batch_access(db, batch_id, current_user)

    tenant_college_id = current_user.college_id if current_user.role == "college_admin" else None
    assignment = assign_trainer_to_batch(
        db=db,
        batch_id=batch_id,
        trainer_id=payload.trainer_id,
        role=payload.role,
        is_lead=payload.is_lead,
        tenant_college_id=tenant_college_id,
    )
    return {
        "success": True,
        "assignment_id": assignment.id,
        "batch_id": assignment.batch_id,
        "trainer_id": assignment.trainer_id,
        "role": assignment.role,
        "is_lead": assignment.is_lead,
    }
