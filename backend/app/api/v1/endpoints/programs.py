"""
Program API Endpoints: Curriculum catalog and course management.
"""
from typing import List, Optional, Tuple
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import (
    AuthenticatedUser,
    get_verified_active_user,
    get_db,
    require_super_admin,
)
from backend.app.schemas.common import MessageResponse
from backend.app.schemas.program import (
    ProgramCreate,
    ProgramResponse,
    ProgramUpdate,
    ProgramWithCountsResponse,
)
from backend.app.services.program_service import (
    create_program,
    delete_program,
    get_program_by_id,
    get_programs_list,
    is_trainer_linked_to_college,
    update_program,
)

http_status = status
router = APIRouter(prefix="/programs", tags=["Programs"])


def _resolve_program_scope(
    db: Session,
    current_user: AuthenticatedUser,
    requested_college_id: Optional[UUID] = None,
) -> Tuple[Optional[UUID], Optional[UUID], Optional[UUID]]:
    """
    Resolves (college_id, trainer_id, student_id) scope for program queries:
    - super_admin: global visibility, optional requested_college_id filter
    - college_admin: own college_id only; 403 if mismatched college_id is requested
    - trainer: scoped strictly to own assigned batches; 403 if requesting an unlinked college_id
    - student: scoped strictly to own college_id and enrolled batches; 403 if requesting another college_id
    """
    if current_user.role == "super_admin":
        return requested_college_id, None, None

    if current_user.role == "college_admin":
        if not current_user.college_id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="College administrator is not bound to a valid college ID.",
            )
        if requested_college_id is not None and requested_college_id != current_user.college_id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: Access to another college's programs is prohibited.",
            )
        return current_user.college_id, None, None

    if current_user.role == "trainer":
        if requested_college_id is not None and not is_trainer_linked_to_college(db, current_user.id, requested_college_id):
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: Trainer is not assigned to the requested college.",
            )
        return None, current_user.id, None

    if current_user.role == "student":
        if not current_user.college_id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Student account is not bound to a valid college ID.",
            )
        if requested_college_id is not None and requested_college_id != current_user.college_id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: Access to another college's programs is prohibited.",
            )
        return current_user.college_id, None, current_user.id

    raise HTTPException(
        status_code=http_status.HTTP_403_FORBIDDEN,
        detail=f"Role '{current_user.role}' is not authorized to view programs.",
    )


@router.get(
    "",
    response_model=List[ProgramWithCountsResponse],
    status_code=status.HTTP_200_OK,
    summary="List Programs",
)
def list_programs(
    status: Optional[str] = Query(None, description="Filter by status (active/inactive)"),
    college_id: Optional[UUID] = Query(None, description="Filter by assigned college"),
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> List[ProgramWithCountsResponse]:
    """
    Retrieves training programs with batch counts scoped to the caller's role and tenant.
    """
    scoped_college_id, scoped_trainer_id, scoped_student_id = _resolve_program_scope(
        db, current_user, requested_college_id=college_id
    )
    programs = get_programs_list(
        db,
        status_filter=status,
        college_id=scoped_college_id,
        trainer_id=scoped_trainer_id,
        student_id=scoped_student_id,
    )
    return [ProgramWithCountsResponse(**p) for p in programs]


@router.post(
    "",
    response_model=ProgramResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Program (Super Admin)",
)
def create_new_program(
    payload: ProgramCreate,
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ProgramResponse:
    """
    Registers a new training curriculum program. Super Admin only.
    """
    program = create_program(db, payload)
    return ProgramResponse.model_validate(program)


@router.get(
    "/{program_id}",
    response_model=ProgramWithCountsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Program Details",
)
def get_program_details(
    program_id: UUID,
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> ProgramWithCountsResponse:
    """
    Retrieves detailed program curriculum data with batches_count scoped to the caller's role/tenant.
    """
    scoped_college_id, scoped_trainer_id, scoped_student_id = _resolve_program_scope(db, current_user)
    program = get_program_by_id(
        db,
        program_id,
        college_id=scoped_college_id,
        trainer_id=scoped_trainer_id,
        student_id=scoped_student_id,
    )
    if not program:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Program not found.")
    return ProgramWithCountsResponse(**program)


@router.put(
    "/{program_id}",
    response_model=ProgramResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Program Curriculum (Super Admin)",
)
def update_program_details(
    program_id: UUID,
    payload: ProgramUpdate,
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ProgramResponse:
    """
    Updates program details and curriculum syllabus. Super Admin only.
    """
    updated = update_program(db, program_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found.")
    return ProgramResponse.model_validate(updated)


@router.delete(
    "/{program_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Program (Super Admin)",
)
def delete_existing_program(
    program_id: UUID,
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Deletes a program from the catalog. Fails if active batches are associated.
    Super Admin only.
    """
    success, error = delete_program(db, program_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error or "Failed to delete program.")
    return MessageResponse(success=True, message="Program deleted successfully.")

