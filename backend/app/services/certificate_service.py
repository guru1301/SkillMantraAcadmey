"""
Certificate Business Service: Eligibility computation, official credential issuance,
cryptographic verification, and authentic ReportLab PDF generation.
"""
from datetime import datetime, timezone
import io
import secrets
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from backend.app.db.models.certificate import Certificate
from backend.app.db.models.student import Student
from backend.app.db.models.batch import Batch
from backend.app.db.models.program import Program
from backend.app.db.models.college import College


def calculate_student_certificate_eligibility(
    db: Session,
    student_id: UUID,
) -> List[Dict[str, Any]]:
    """
    Computes certificate eligibility for each batch the student is enrolled in:
    Requirement 1: Minimum 80% attendance across effective educational sessions.
                   Unmarked completed sessions are included in the denominator to prevent inflation.
    Requirement 2: All scheduled training sessions in the batch are completed.
    Requirement 3: Mandatory post-training student feedback submitted.
    Reconciles already-issued registered certificates from the certificates table.
    """
    sql = text("""
        SELECT 
          b.id as batch_id,
          b.code as batch_code,
          p.name as program_name,
          c.name as college_name,
          COUNT(DISTINCT ts.id)::int as total_sessions,
          COUNT(DISTINCT CASE WHEN ts.status = 'completed' THEN ts.id END)::int as completed_sessions,
          COUNT(DISTINCT sa.id)::int as recorded_sessions,
          COUNT(DISTINCT CASE WHEN sa.status IN ('present', 'late') THEN sa.id END)::int as attended_sessions,
          (COUNT(DISTINCT sf.id) > 0) as feedback_submitted,
          cert.id as certificate_id,
          cert.certificate_number,
          cert.verification_code
        FROM batch_students bs
        JOIN batches b ON b.id = bs.batch_id
        JOIN colleges c ON c.id = b.college_id
        JOIN programs p ON p.id = b.program_id
        LEFT JOIN training_sessions ts ON ts.batch_id = b.id
        LEFT JOIN session_attendance sa ON sa.session_id = ts.id AND sa.student_id = CAST(:student_id AS UUID)
        LEFT JOIN student_feedbacks sf ON sf.batch_id = b.id AND sf.student_id = CAST(:student_id AS UUID)
        LEFT JOIN certificates cert ON cert.student_id = CAST(:student_id AS UUID) AND cert.batch_id = b.id AND cert.status = 'active'
        WHERE bs.student_id = CAST(:student_id AS UUID)
        GROUP BY b.id, b.code, p.name, c.name, cert.id, cert.certificate_number, cert.verification_code
        ORDER BY b.start_date DESC
    """)

    student_uuid = student_id if isinstance(student_id, UUID) else UUID(str(student_id))
    rows = db.execute(sql, {"student_id": str(student_uuid)}).mappings().all()
    results = []

    for r in rows:
        recorded = r["recorded_sessions"] or 0
        attended = r["attended_sessions"] or 0
        total_sessions = r["total_sessions"] or 0
        completed_sessions = r["completed_sessions"] or 0

        effective_denominator = max(recorded, completed_sessions)
        attendance_rate = (
            round((attended / effective_denominator) * 100.0, 1) if effective_denominator > 0 else 0.0
        )
        attendance_met = attendance_rate >= 80.0
        all_sessions_finished = total_sessions > 0 and completed_sessions == total_sessions
        feedback_submitted = bool(r.get("feedback_submitted", False))
        is_eligible = bool(attendance_met and all_sessions_finished and feedback_submitted)

        pending_requirement = None
        if not attendance_met:
            pending_requirement = f"Minimum 80% attendance required (current attendance: {attendance_rate}%)."
        elif not all_sessions_finished:
            pending_requirement = "All scheduled training sessions must be completed."
        elif not feedback_submitted:
            pending_requirement = "Please submit your post-training feedback to unlock your certificate."

        has_cert = r.get("certificate_id") is not None

        results.append({
            "batchId": r["batch_id"],
            "batchCode": r["batch_code"],
            "programName": r["program_name"],
            "collegeName": r["college_name"],
            "attendanceRate": attendance_rate,
            "attendanceRequired": 80.0,
            "attendanceMet": attendance_met,
            "sessionsCompleted": completed_sessions,
            "totalSessions": total_sessions,
            "allSessionsFinished": all_sessions_finished,
            "feedbackSubmitted": feedback_submitted,
            "feedbackRequired": True,
            "pendingRequirement": pending_requirement,
            "isEligible": is_eligible,
            "issued": has_cert,
            "certificateId": r.get("certificate_id"),
            "certificateNumber": r.get("certificate_number"),
            "verificationCode": r.get("verification_code"),
        })

    return results


def issue_or_get_certificate(
    db: Session,
    student_id: UUID,
    batch_id: UUID,
) -> Certificate:
    """
    Issues an official, verifiable certificate for a student in a batch.
    Validates all criteria: attendance >= 80%, cohort sessions completed, feedback submitted.
    Idempotent: if certificate already exists, returns the existing record.
    """
    # 1. Check existing certificate
    existing = db.execute(
        select(Certificate).where(
            Certificate.student_id == student_id,
            Certificate.batch_id == batch_id,
            Certificate.status == "active",
        )
    ).scalar_one_or_none()
    if existing:
        return existing

    # 2. Check eligibility criteria
    eligibility_list = calculate_student_certificate_eligibility(db, student_id)
    matched = next((c for c in eligibility_list if str(c["batchId"]) == str(batch_id)), None)

    if not matched:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student enrollment in this batch was not found.",
        )

    if not matched["isEligible"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=matched["pendingRequirement"] or "Student has not completed all certificate requirements.",
        )

    # 3. Retrieve student and batch entity details
    student = db.execute(select(Student).where(Student.id == student_id)).scalar_one_or_none()
    batch = db.execute(select(Batch).where(Batch.id == batch_id)).scalar_one_or_none()
    if not student or not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student or Batch record missing.")

    college = db.execute(select(College).where(College.id == batch.college_id)).scalar_one_or_none()
    program = db.execute(select(Program).where(Program.id == batch.program_id)).scalar_one_or_none()

    college_name = college.name if college else "SkillThinker Institution"
    program_name = program.name if program else "Campus Training Program"

    # 4. Generate unique certificate number & verification code
    year = datetime.now(timezone.utc).year
    random_suffix = secrets.token_hex(4).upper()
    cert_number = f"SMA-{year}-{random_suffix}"
    verification_code = secrets.token_urlsafe(16)

    # 5. Persist Certificate atomically with ON CONFLICT DO NOTHING (P2-10 & P4-08)
    bind = db.get_bind() if hasattr(db, "get_bind") else None
    dialect = bind.dialect.name if bind else "postgresql"
    now = datetime.now(timezone.utc)
    cert_id = uuid4()

    cert_data = {
        "id": cert_id,
        "certificate_number": cert_number,
        "student_id": student.id,
        "batch_id": batch.id,
        "program_id": batch.program_id,
        "college_id": batch.college_id,
        "student_name": student.full_name,
        "student_roll": student.roll_number,
        "college_name": college_name,
        "program_name": program_name,
        "attendance_rate": matched["attendanceRate"],
        "verification_code": verification_code,
        "status": "active",
        "issued_at": now,
        "created_at": now,
        "updated_at": now,
    }

    if dialect == "sqlite":
        from sqlalchemy.dialects.sqlite import insert as sqlite_insert
        stmt = sqlite_insert(Certificate).values(**cert_data).on_conflict_do_nothing(
            index_elements=["student_id", "batch_id"]
        )
    else:
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        stmt = pg_insert(Certificate).values(**cert_data).on_conflict_do_nothing(
            index_elements=["student_id", "batch_id"]
        )

    db.execute(stmt)
    db.commit()

    # Re-fetch the newly inserted or previously existing certificate
    issued_cert = db.execute(
        select(Certificate).where(
            Certificate.student_id == student_id,
            Certificate.batch_id == batch_id,
            Certificate.status == "active",
        )
    ).scalar_one()
    return issued_cert


def get_certificate_by_id(db: Session, cert_id: UUID) -> Optional[Certificate]:
    return db.execute(select(Certificate).where(Certificate.id == cert_id)).scalar_one_or_none()


def get_certificate_by_verification_code(db: Session, code: str) -> Optional[Certificate]:
    clean_code = code.strip()
    return db.execute(select(Certificate).where(Certificate.verification_code == clean_code)).scalar_one_or_none()


def generate_certificate_pdf(
    student_name: str,
    student_roll: str,
    college_name: str,
    program_name: str,
    certificate_number: str,
    verification_code: str,
    issued_date_str: str,
    attendance_rate: float,
) -> bytes:
    """
    Generates an official vector PDF certificate of completion in A4 Landscape
    with SkillThinker branding, navy & gold border styling, and high-resolution QR code.
    """
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors
    from reportlab.graphics.shapes import Drawing
    from reportlab.graphics.barcode.qr import QrCodeWidget

    buffer = io.BytesIO()
    page_w, page_h = landscape(A4)
    c = canvas.Canvas(buffer, pagesize=landscape(A4))

    # 1. Background & Decorative Borders
    c.setFillColor(colors.HexColor("#FDFDFD"))
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    # Outer deep navy border
    c.setStrokeColor(colors.HexColor("#062F68"))
    c.setLineWidth(6)
    c.rect(20, 20, page_w - 40, page_h - 40)

    # Inner gold accent border
    c.setStrokeColor(colors.HexColor("#FCAF0A"))
    c.setLineWidth(2)
    c.rect(28, 28, page_w - 56, page_h - 56)

    # 2. Branding Header
    c.setFillColor(colors.HexColor("#062F68"))
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(page_w / 2.0, page_h - 75, "SKILLTHINKER")

    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica", 11)
    c.drawCentredString(page_w / 2.0, page_h - 95, "CENTRE FOR ENTERPRISE & TECHNICAL EXCELLENCE")

    # Divider bar
    c.setStrokeColor(colors.HexColor("#0A3A7A"))
    c.setLineWidth(1)
    c.line(page_w / 2.0 - 150, page_h - 110, page_w / 2.0 + 150, page_h - 110)

    # 3. Certificate Title
    c.setFillColor(colors.HexColor("#0A3A7A"))
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(page_w / 2.0, page_h - 145, "CERTIFICATE OF COMPLETION")

    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(page_w / 2.0, page_h - 175, "This is proudly presented to")

    # 4. Student Name
    c.setFillColor(colors.HexColor("#062F68"))
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(page_w / 2.0, page_h - 220, student_name.upper())

    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(
        page_w / 2.0,
        page_h - 245,
        f"Roll Number: {student_roll}   |   {college_name}",
    )

    # 5. Course Details
    c.setFillColor(colors.HexColor("#334155"))
    c.setFont("Helvetica", 13)
    text_line1 = "for successfully completing the rigorous campus training program in"
    c.drawCentredString(page_w / 2.0, page_h - 280, text_line1)

    c.setFillColor(colors.HexColor("#0A3A7A"))
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(page_w / 2.0, page_h - 310, program_name)

    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica", 11)
    text_line2 = f"with an official attendance achievement of {attendance_rate:.1f}% across all practical and technical modules."
    c.drawCentredString(page_w / 2.0, page_h - 335, text_line2)

    # 6. QR Code for Instant Public Verification
    verify_url = f"https://skillthinker.com/verify/{verification_code}"
    qr = QrCodeWidget(verify_url)
    qr.barWidth = 70
    qr.barHeight = 70
    qr.qrVersion = 1
    d = Drawing(70, 70)
    d.add(qr)
    d.drawOn(c, 60, 55)

    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica", 8)
    c.drawString(60, 42, "Scan to verify authentic credential")

    # 7. Credential Metadata (Center Bottom)
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(page_w / 2.0, 75, f"Certificate No: {certificate_number}")
    c.drawCentredString(page_w / 2.0, 58, f"Issued Date: {issued_date_str}")
    c.setFont("Helvetica-Oblique", 8)
    c.drawCentredString(page_w / 2.0, 42, f"Verification Code: {verification_code}")

    # 8. Signatures / Seals (Right Bottom)
    c.setStrokeColor(colors.HexColor("#94A3B8"))
    c.setLineWidth(1)
    c.line(page_w - 220, 90, page_w - 60, 90)

    c.setFillColor(colors.HexColor("#062F68"))
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(page_w - 140, 75, "Authorized Signatory")
    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica", 9)
    c.drawCentredString(page_w - 140, 60, "Director of Academic Training")

    c.showPage()
    c.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
