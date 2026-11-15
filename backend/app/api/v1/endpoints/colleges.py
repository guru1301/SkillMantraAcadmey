"""
College API Endpoints: Institution CRUD, status management, and portal overviews.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import (
    AuthenticatedUser,
    enforce_tenant_college_id,
    get_db,
    require_admin_or_college,
    require_college_admin,
    require_super_admin,
)
from backend.app.schemas.college import (
    CollegeCreate,
    CollegeResponse,
    CollegeStatsResponse,
    CollegeStatusUpdate,
    CollegeUpdate,
    CollegeWithCountsResponse,
)
from backend.app.schemas.common import MessageResponse
from backend.app.services.college_service import (
    create_college,
    get_college_by_id,
    get_college_portal_data,
    get_college_stats,
    get_colleges_list,
    get_distinct_cities,
    set_college_status,
    update_college,
)

router = APIRouter(prefix="/colleges", tags=["Colleges"])


@router.get(
    "",
    response_model=List[CollegeWithCountsResponse],
    status_code=status.HTTP_200_OK,
    summary="List Colleges (Super Admin)",
)
def list_colleges(
    search: Optional[str] = Query(None, description="Search by name or city"),
    status: Optional[str] = Query(None, description="Filter by status (active/inactive)"),
    city: Optional[str] = Query(None, description="Filter by city"),
    limit: Optional[int] = Query(None, ge=1, le=500, description="Maximum colleges to return"),
    offset: Optional[int] = Query(None, ge=0, description="Offset for pagination"),
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> List[CollegeWithCountsResponse]:
    """
    Retrieves all colleges with active batch and student counts. Super Admin only.
    """
    colleges = get_colleges_list(
        db,
        search=search,
        status_filter=status,
        city_filter=city,
        limit=limit,
        offset=offset,
    )
    return [CollegeWithCountsResponse(**c) for c in colleges]


@router.post(
    "",
    response_model=CollegeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New College (Super Admin)",
)
def create_new_college(
    payload: CollegeCreate,
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> CollegeResponse:
    """
    Onboards a new college institution. Super Admin only.
    """
    college = create_college(db, payload)
    return CollegeResponse.model_validate(college)


@router.get(
    "/portal-overview",
    status_code=status.HTTP_200_OK,
    summary="College Portal Overview for Authenticated College Admin",
)
def get_my_college_portal_overview(
    current_user: AuthenticatedUser = Depends(require_college_admin),
    db: Session = Depends(get_db),
):
    """
    Retrieves comprehensive scoped dashboard overview for the authenticated college admin.
    """
    return get_college_portal_data(db, current_user.college_id)


@router.get(
    "/cities",
    response_model=List[str],
    status_code=status.HTTP_200_OK,
    summary="Get Distinct College Cities",
)
def get_college_cities(
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> List[str]:
    """
    Retrieves all unique cities from the colleges directory. Super Admin only.
    """
    return get_distinct_cities(db)


@router.get(
    "/{college_id}",
    response_model=CollegeWithCountsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get College Details",
)
def get_college_details(
    college_id: UUID,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> CollegeWithCountsResponse:
    """
    Retrieves details for a specific college. Enforces tenant isolation for College Admins.
    """
    effective_college_id = enforce_tenant_college_id(current_user, college_id)
    college = get_college_by_id(db, effective_college_id)
    if not college:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="College not found.")
    return CollegeWithCountsResponse(**college)


@router.put(
    "/{college_id}",
    response_model=CollegeResponse,
    status_code=status.HTTP_200_OK,
    summary="Update College Profile",
)
def update_college_profile(
    college_id: UUID,
    payload: CollegeUpdate,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> CollegeResponse:
    """
    Updates college metadata. Enforces tenant isolation for College Admins.
    """
    effective_college_id = enforce_tenant_college_id(current_user, college_id)
    # College admin cannot modify or include institution status in profile updates
    if current_user.role == "college_admin" and (
        "status" in payload.model_fields_set or payload.status is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="College administrators cannot modify institution status.",
        )

    updated = update_college(db, effective_college_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="College not found.")
    return CollegeResponse.model_validate(updated)


@router.patch(
    "/{college_id}/status",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate / Deactivate College (Super Admin)",
)
def change_college_status(
    college_id: UUID,
    payload: CollegeStatusUpdate,
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Toggles college active/inactive status. Super Admin only.
    """
    success = set_college_status(db, college_id, payload.status)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="College not found.")
    return MessageResponse(success=True, message=f"College status updated to '{payload.status}'.")


@router.get(
    "/{college_id}/stats",
    response_model=CollegeStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get College Statistics",
)
def get_stats(
    college_id: UUID,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
) -> CollegeStatsResponse:
    """
    Retrieves statistical metrics for a specific college.
    """
    effective_college_id = enforce_tenant_college_id(current_user, college_id)
    stats_data = get_college_stats(db, effective_college_id)
    return CollegeStatsResponse(**stats_data)


@router.get(
    "/{college_id}/portal-overview",
    status_code=status.HTTP_200_OK,
    summary="Get College Portal Overview by ID (Super Admin / College Admin)",
)
def get_portal_overview_by_id(
    college_id: UUID,
    current_user: AuthenticatedUser = Depends(require_admin_or_college),
    db: Session = Depends(get_db),
):
    """
    Retrieves full portal dataset for a college.
    """
    effective_college_id = enforce_tenant_college_id(current_user, college_id)
    return get_college_portal_data(db, effective_college_id)

