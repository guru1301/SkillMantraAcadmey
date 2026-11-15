"""
Certificate API Endpoints: Evaluation of certificate criteria, official issuance,
cryptographic verification, and authentic PDF streaming.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.api.deps import (
    AuthenticatedUser,
    get_verified_active_user,
    get_db,
    require_roles,
    require_student,
    verify_batch_access,
    verify_student_access,
)
from backend.app.core.security import get_trusted_client_ip
from backend.app.services.rate_limit_service import (
    is_distributed_rate_limited,
    record_distributed_attempt,
)
from backend.app.db.models.certificate import Certificate
from backend.app.schemas.certificate import (
    CertificateEligibilityItem,
    CertificateEligibilityResponse,
    CertificateIssueResponse,
    CertificateVerifyResponse,
)
from backend.app.services.certificate_service import (
    calculate_student_certificate_eligibility,
    generate_certificate_pdf,
    get_certificate_by_id,
    get_certificate_by_verification_code,
    issue_or_get_certificate,
)

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.get(
    "/me/eligibility",
    response_model=CertificateEligibilityResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Certificate Eligibility for Authenticated Student",
)
def get_my_certificate_eligibility(
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
) -> CertificateEligibilityResponse:
    """
    Computes certificate eligibility for all enrolled batches of the logged-in student.
    Criteria: 80% attendance rate, cohort training completion, and feedback submission.
    """
    certs = calculate_student_certificate_eligibility(db, current_user.id)
    return CertificateEligibilityResponse(
        studentId=current_user.id,
        certificates=[CertificateEligibilityItem(**c) for c in certs],
    )


@router.get(
    "/student/{student_id}/eligibility",
    response_model=CertificateEligibilityResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Student Certificate Eligibility by ID",
)
def get_student_certificate_eligibility(
    student_id: UUID,
    current_user: AuthenticatedUser = Depends(get_verified_active_user),
    db: Session = Depends(get_db),
) -> CertificateEligibilityResponse:
    """
    Computes certificate eligibility for a student.
    Enforces authorization:
    - Students may only view their own certificate eligibility.
    - College Admins may only view students of their own institution.
    - Trainers may only view students enrolled in their assigned cohorts.
    - Super Admins have platform-wide access.
    """
    verify_student_access(db, student_id, current_user)

    certs = calculate_student_certificate_eligibility(db, student_id)
    return CertificateEligibilityResponse(
        studentId=student_id,
        certificates=[CertificateEligibilityItem(**c) for c in certs],
    )


@router.post(
    "/batch/{batch_id}/issue",
    response_model=CertificateIssueResponse,
    status_code=status.HTTP_200_OK,
    summary="Issue Official Certificate for Enrolled Student",
)
def issue_certificate_endpoint(
    batch_id: UUID,
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
) -> CertificateIssueResponse:
    """
    Registers an official certificate for the authenticated student upon meeting all criteria.
    Idempotent: if already issued, returns existing registration.
    """
    cert = issue_or_get_certificate(db, student_id=current_user.id, batch_id=batch_id)
    issued_date = cert.issued_at.strftime("%B %d, %Y") if cert.issued_at else "Verified"
    return CertificateIssueResponse(
        success=True,
        certificateId=cert.id,
        certificateNumber=cert.certificate_number,
        verificationCode=cert.verification_code,
        issuedAt=issued_date,
        downloadUrl=f"/api/v1/certificates/{cert.id}/pdf",
    )


@router.get(
    "/{certificate_id}/pdf",
    status_code=status.HTTP_200_OK,
    summary="Download Official Certificate PDF",
)
def download_certificate_pdf(
    certificate_id: UUID,
    current_user: AuthenticatedUser = Depends(require_roles("super_admin", "college_admin", "trainer", "student")),
    db: Session = Depends(get_db),
):
    """
    Generates and streams the official PDF certificate for an issued credential.
    Authorized for the owning student, associated college admin, assigned batch trainer, or super admin.
    """
    cert = get_certificate_by_id(db, certificate_id)
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found.")

    # Authorization
    if current_user.role == "student":
        if cert.student_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")
    elif current_user.role == "college_admin":
        if not current_user.college_id or cert.college_id != current_user.college_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")
    elif current_user.role == "trainer":
        verify_batch_access(db, cert.batch_id, current_user)
    elif current_user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    issued_str = cert.issued_at.strftime("%B %d, %Y") if cert.issued_at else "Official Issue"
    pdf_bytes = generate_certificate_pdf(
        student_name=cert.student_name,
        student_roll=cert.student_roll,
        college_name=cert.college_name,
        program_name=cert.program_name,
        certificate_number=cert.certificate_number,
        verification_code=cert.verification_code,
        issued_date_str=issued_str,
        attendance_rate=cert.attendance_rate,
    )

    clean_roll = cert.student_roll.replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Certificate_{clean_roll}.pdf"',
            "Content-Type": "application/pdf",
        },
    )


@router.get(
    "/batch/{batch_id}/download",
    status_code=status.HTTP_200_OK,
    summary="Download Official Student Certificate PDF",
)
def download_my_batch_certificate_pdf(
    batch_id: UUID,
    current_user: AuthenticatedUser = Depends(require_student),
    db: Session = Depends(get_db),
):
    """
    Directly streams an ALREADY-ISSUED certificate PDF for the authenticated student.
    Does NOT issue or mutate certificate records (GET is idempotent and read-only, P2-10).
    Returns 404 if the certificate has not yet been issued via POST /batch/{batch_id}/issue.
    """
    cert = db.execute(
        select(Certificate).where(
            Certificate.student_id == current_user.id,
            Certificate.batch_id == batch_id,
            Certificate.status == "active",
        )
    ).scalar_one_or_none()

    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate has not been issued for this batch. Please issue your certificate before downloading.",
        )

    issued_str = cert.issued_at.strftime("%B %d, %Y") if cert.issued_at else "Official Issue"
    pdf_bytes = generate_certificate_pdf(
        student_name=cert.student_name,
        student_roll=cert.student_roll,
        college_name=cert.college_name,
        program_name=cert.program_name,
        certificate_number=cert.certificate_number,
        verification_code=cert.verification_code,
        issued_date_str=issued_str,
        attendance_rate=cert.attendance_rate,
    )

    clean_roll = cert.student_roll.replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Certificate_{clean_roll}.pdf"',
            "Content-Type": "application/pdf",
        },
    )


@router.get(
    "/verify/{verification_code}",
    response_model=CertificateVerifyResponse,
    status_code=status.HTTP_200_OK,
    summary="Public Credential Verification",
)
def verify_certificate_public(
    verification_code: str,
    request: Request = None,
    db: Session = Depends(get_db),
) -> CertificateVerifyResponse:
    """
    Publicly verifies authentic certificates issued by Skill Mantra Academy.
    No authentication required, enabling verification by prospective employers and universities.
    Enforces rate limiting (30/min per IP).
    """
    if request is not None:
        client_ip = get_trusted_client_ip(request)
        is_limited, _ = is_distributed_rate_limited(
            db,
            scope="cert_verify_ip",
            key=client_ip,
            max_requests=30,
            window_seconds=60,
        )
        if is_limited:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many certificate verification requests from this IP address. Please try again later.",
            )
        record_distributed_attempt(db, scope="cert_verify_ip", key=client_ip, window_seconds=60)

    cert = get_certificate_by_verification_code(db, verification_code)
    if not cert or cert.status != "active":
        return CertificateVerifyResponse(
            valid=False,
            status="invalid_or_revoked",
        )

    issued_str = cert.issued_at.strftime("%B %d, %Y") if cert.issued_at else None
    return CertificateVerifyResponse(
        valid=True,
        certificateNumber=cert.certificate_number,
        verificationCode=cert.verification_code,
        studentName=cert.student_name,
        studentRoll=cert.student_roll,
        collegeName=cert.college_name,
        programName=cert.program_name,
        issuedAt=issued_str,
        attendanceRate=cert.attendance_rate,
        status=cert.status,
    )
