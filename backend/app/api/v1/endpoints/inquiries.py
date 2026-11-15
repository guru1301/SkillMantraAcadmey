"""
Contact & Inquiry API Endpoints: Public lead capture and administrative triage.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from backend.app.api.deps import (
    AuthenticatedUser,
    get_db,
    require_super_admin,
)
from backend.app.core.security import get_trusted_client_ip
from backend.app.services.rate_limit_service import (
    is_distributed_rate_limited,
    record_distributed_attempt,
)
from backend.app.schemas.common import MessageResponse
from backend.app.schemas.inquiry import (
    ContactInquiryCreate,
    ContactInquiryResponse,
    ContactInquiryStatusUpdate,
)
from backend.app.services.inquiry_service import (
    create_contact_inquiry,
    list_contact_inquiries,
    update_inquiry_status,
)

router = APIRouter(prefix="/inquiries", tags=["Contact Inquiries"])


@router.post(
    "",
    response_model=ContactInquiryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Institutional Contact Inquiry (Public)",
)
def submit_inquiry(
    request: Request,
    payload: ContactInquiryCreate,
    db: Session = Depends(get_db),
) -> ContactInquiryResponse:
    """
    Public entrypoint for institutional, corporate, and campus training inquiries.
    Enforces IP-based sliding window rate limiting to prevent spam flooding.
    """
    client_ip = get_trusted_client_ip(request)
    is_limited, _ = is_distributed_rate_limited(
        db,
        scope="inquiry_ip",
        key=client_ip,
        max_requests=5,
        window_seconds=600,
    )
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many inquiries submitted from this IP address. Please wait before submitting again.",
        )

    record_distributed_attempt(db, scope="inquiry_ip", key=client_ip, window_seconds=600)
    inquiry = create_contact_inquiry(db, payload)
    return ContactInquiryResponse.model_validate(inquiry)


@router.get(
    "",
    response_model=List[ContactInquiryResponse],
    status_code=status.HTTP_200_OK,
    summary="List Inquiries (Super Admin)",
)
def get_inquiries(
    status: Optional[str] = Query(None, description="Filter by status (new/contacted/resolved/archived)"),
    search: Optional[str] = Query(None, description="Search by name, organization, or email"),
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> List[ContactInquiryResponse]:
    """
    Retrieves incoming institutional leads for administrative review.
    """
    inquiries = list_contact_inquiries(db, status_filter=status, search=search)
    return [ContactInquiryResponse.model_validate(i) for i in inquiries]


@router.patch(
    "/{inquiry_id}/status",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Inquiry Triage Status (Super Admin)",
)
def change_inquiry_status(
    inquiry_id: UUID,
    payload: ContactInquiryStatusUpdate,
    current_user: AuthenticatedUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Updates lead workflow state (new -> contacted -> resolved -> archived).
    """
    success = update_inquiry_status(db, inquiry_id, payload.status)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found.")
    return MessageResponse(success=True, message=f"Inquiry status updated to '{payload.status}'.")

