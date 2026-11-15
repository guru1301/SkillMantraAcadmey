"""
Resource API Endpoints: Batch learning materials and file links.
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
    require_student,
    verify_batch_access,
    verify_resource_access,
)
from backend.app.schemas.resource import (
    ResourceCreate,
    ResourceResponse,
    ResourceUpdate,
)
from backend.app.services.resource_service import (
    create_resource,
    list_resources_for_batch,
    list_resources_for_student,
    update_resource,
)

router = APIRouter(prefix="/resources", tags=["Resources"])


@router.get(
    "",
    response_model=List[ResourceResponse],
    status_code=status.HTTP_200_OK,
    summary="List Resources for a Batch",
)
def get_batch_resources(
    batch_id: UUID = Query(..., description="Batch ID"),
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> List[ResourceResponse]:
    """
    Retrieves all learning materials, documents, and videos posted for a batch.
    Enforces authorization on the batch.
    """
    verify_batch_access(db, batch_id, current_user)
    resources = list_resources_for_batch(db, batch_id)
    return [ResourceResponse.model_validate(r) for r in resources]


@router.post(
    "",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Resource to Batch",
)
def add_resource(
    payload: ResourceCreate,
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
) -> ResourceResponse:
    """
    Publishes a new courseware document or resource link.
    Enforces authorization on the target batch.
    """
    verify_batch_access(db, payload.batch_id, current_user)
    resource = create_resource(db, payload, creator_id=current_user.id)
    return ResourceResponse.model_validate(resource)


@router.put(
    "/{resource_id}",
    response_model=ResourceResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Resource",
)
def edit_resource(
    resource_id: UUID,
    payload: ResourceUpdate,
    current_user: AuthenticatedUser = Depends(require_staff),
    db: Session = Depends(get_db),
) -> ResourceResponse:
    """
    Updates resource information.
    Enforces authorization on the parent batch.
    """
    verify_resource_access(db, resource_id, current_user)
    updated = update_resource(db, resource_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found.")
    return ResourceResponse.model_validate(updated)


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Get Resources for Current Student",
)
def get_my_resources(
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
):
    """
    Retrieves all course resources across all batches the current student is enrolled in.
    """
    return list_resources_for_student(db, current_user.id)
