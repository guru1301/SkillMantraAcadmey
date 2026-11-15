"""
Proctoring Business Service: Centralized security event classification,
session integrity policy, auto-saving, and recovery tracking.
"""
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import json
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import desc, func, inspect as sa_inspect, select, text, update
from sqlalchemy.orm import Session

from backend.app.db.models.assessment import Assessment
from backend.app.db.models.assessment_submission import AssessmentSubmission
from backend.app.db.models.batch import BatchStudent
from backend.app.db.models.exam_proctoring_event import ExamProctoringEvent
from backend.app.db.models.student import Student
from backend.app.schemas.proctoring import (
    ExamSaveProgressRequest,
    ExamSecurityEventCreate,
)

# Integrity violation events that count toward policy warnings
VIOLATION_EVENT_TYPES = {
    "TAB_HIDDEN",
    "WINDOW_BLUR",
    "FULLSCREEN_EXIT",
    "PAGE_HIDDEN",
}

TERMINAL_SUBMISSION_STATUSES = ("submitted", "evaluated", "pending_review")
SUBMISSION_LATENCY_GRACE_SECONDS = 20


def _to_utc(value: Any) -> Optional[datetime]:
    """Coerces a datetime or ISO-8601 string into timezone-aware UTC datetime."""
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def sanitize_assessment_questions(raw_questions: Any) -> List[Dict[str, Any]]:
    """Strips answer keys and explanations from questions before sending to students."""
    if not isinstance(raw_questions, list):
        return []
    sanitized: List[Dict[str, Any]] = []
    for q in raw_questions:
        if not isinstance(q, dict):
            continue
        item = dict(q)
        item.pop("correctOptionIndex", None)
        item.pop("explanation", None)
        sanitized.append(item)
    return sanitized


def is_assessment_deadline_passed(
    assessment: Assessment,
    now: Optional[datetime] = None,
) -> bool:
    """Returns True only when an explicit assessment deadline exists and current time is past it."""
    current_now = now or datetime.now(timezone.utc)
    window_deadline = _to_utc(
        getattr(assessment, "deadline", None) or getattr(assessment, "due_date", None)
    )
    return window_deadline is not None and current_now > window_deadline


def get_server_violations_count(
    db: Session,
    assessment_id: UUID,
    student_id: UUID,
) -> int:
    """Computes authoritative violation count strictly from VIOLATION_EVENT_TYPES rows."""
    stmt = (
        select(func.count(ExamProctoringEvent.id))
        .where(
            ExamProctoringEvent.assessment_id == assessment_id,
            ExamProctoringEvent.student_id == student_id,
            ExamProctoringEvent.event_type.in_(VIOLATION_EVENT_TYPES),
        )
    )
    raw = db.execute(stmt).scalar()
    try:
        return int(raw) if raw is not None else 0
    except (TypeError, ValueError):
        return 0


def _verify_student_enrolled_in_assessment(
    db: Session, student_id: UUID, assessment_id: UUID
) -> Assessment:
    """Verifies that the assessment exists and the student is actively enrolled in its cohort."""
    assessment = db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    ).scalar_one_or_none()

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found.",
        )

    enrollment = db.execute(
        select(BatchStudent).where(
            BatchStudent.batch_id == assessment.batch_id,
            BatchStudent.student_id == student_id,
        )
    ).scalar_one_or_none()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not enrolled in the cohort assigned to this examination.",
        )

    return assessment


def get_attempt_timing(
    assessment: Assessment,
    submission: Optional[AssessmentSubmission] = None,
    now: Optional[datetime] = None,
) -> Tuple[bool, Optional[datetime], int]:
    """
    Calculates server-authoritative deadline and remaining time for an exam attempt.
    Returns: (is_expired, effective_deadline, seconds_remaining)
    """
    current_now = now or datetime.now(timezone.utc)
    candidates: List[datetime] = []

    # 1. Assessment window deadline
    window_deadline = _to_utc(
        getattr(assessment, "deadline", None) or getattr(assessment, "due_date", None)
    )
    if window_deadline is not None:
        candidates.append(window_deadline)

    # 2. Timed attempt duration limit from started_at
    if submission and hasattr(submission, "started_at"):
        s_at = _to_utc(getattr(submission, "started_at", None))
        duration_minutes = getattr(assessment, "duration_minutes", None)
        if s_at is not None and duration_minutes is not None:
            try:
                attempt_limit = s_at + timedelta(minutes=int(duration_minutes))
                candidates.append(attempt_limit)
            except (ValueError, TypeError):
                pass

    try:
        default_seconds = int(getattr(assessment, "duration_minutes", 30) or 30) * 60
    except (ValueError, TypeError):
        default_seconds = 1800

    if not candidates:
        return False, None, default_seconds

    effective_deadline = min(candidates)
    grace_threshold = effective_deadline + timedelta(seconds=SUBMISSION_LATENCY_GRACE_SECONDS)
    is_expired = current_now > grace_threshold
    seconds_remaining = max(0, int((effective_deadline - current_now).total_seconds()))

    return is_expired, effective_deadline, seconds_remaining


def _validate_assessment_published_and_started(
    assessment: Assessment,
    now: Optional[datetime] = None,
) -> datetime:
    """Enforces published status and start_time gate for students."""
    current_now = now or datetime.now(timezone.utc)
    if getattr(assessment, "status", None) != "published":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Assessment is not published.",
        )

    start_dt = _to_utc(getattr(assessment, "start_time", None))
    if start_dt is not None and current_now < start_dt:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This examination has not yet opened. Please return during the scheduled window.",
        )
    return current_now


def validate_student_exam_access(
    assessment: Assessment,
    submission: Optional[AssessmentSubmission] = None,
    *,
    require_in_progress: bool = False,
    now: Optional[datetime] = None,
) -> Tuple[Optional[datetime], int]:
    """
    Single authoritative rule set validating whether a student may read questions,
    start, save progress, or submit an assessment attempt.
    """
    current_now = _validate_assessment_published_and_started(assessment, now=now)

    if require_in_progress:
        if submission is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Examination session has not been started. Call /start first.",
            )
        sub_status = getattr(submission, "status", None)
        if sub_status in TERMINAL_SUBMISSION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Examination has already been submitted and cannot be modified.",
            )
        if sub_status != "in_progress":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No active in-progress examination attempt found.",
            )

    is_expired, eff_deadline, secs_remaining = get_attempt_timing(
        assessment, submission, now=current_now
    )
    if is_expired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Examination submission deadline has expired.",
        )

    return eff_deadline, secs_remaining


def can_student_read_questions(
    assessment: Assessment,
    submission: Optional[AssessmentSubmission],
    now: Optional[datetime] = None,
) -> bool:
    """Returns True iff the student satisfies the full exam window and active /start session rule."""
    try:
        validate_student_exam_access(
            assessment,
            submission,
            require_in_progress=True,
            now=now,
        )
        return True
    except HTTPException:
        return False


def start_exam_session(
    db: Session, student_id: UUID, assessment_id: UUID
) -> Dict[str, Any]:
    """
    Initializes or resumes an examination session.
    Persists an 'in_progress' attempt record in assessment_submissions and returns
    sanitized questions + any previously saved answers for interruption recovery.
    """
    assessment = _verify_student_enrolled_in_assessment(db, student_id, assessment_id)
    now = _validate_assessment_published_and_started(assessment)
    raw_questions = assessment.questions if isinstance(assessment.questions, list) else []
    questions_count = len(raw_questions)

    # Check existing submission
    submission = db.execute(
        select(AssessmentSubmission).where(
            AssessmentSubmission.assessment_id == assessment_id,
            AssessmentSubmission.student_id == student_id,
        )
    ).scalar_one_or_none()

    if submission:
        current_version = getattr(submission, "version", 1) or 1

        if submission.status in TERMINAL_SUBMISSION_STATUSES:
            _, eff_deadline, _ = get_attempt_timing(assessment, submission, now=now)
            return {
                "success": True,
                "status": submission.status,
                "started_at": submission.started_at or submission.submitted_at or now,
                "server_timestamp": now,
                "restored_answers": submission.answers or {},
                "violations_count": submission.violations_count or 0,
                "anti_cheat_enabled": assessment.anti_cheat_enabled,
                "duration_minutes": assessment.duration_minutes,
                "version": current_version,
                "effective_deadline": eff_deadline,
                "seconds_remaining": 0,
                "questions": [],
                "questions_count": questions_count,
            }

        eff_deadline, secs_remaining = validate_student_exam_access(
            assessment, submission, require_in_progress=True, now=now
        )

        # Existing active in_progress attempt - resume with sanitized questions
        return {
            "success": True,
            "status": "in_progress",
            "started_at": submission.started_at or now,
            "server_timestamp": now,
            "restored_answers": submission.answers or {},
            "violations_count": submission.violations_count or 0,
            "anti_cheat_enabled": assessment.anti_cheat_enabled,
            "duration_minutes": assessment.duration_minutes,
            "version": current_version,
            "effective_deadline": eff_deadline,
            "seconds_remaining": secs_remaining,
            "questions": sanitize_assessment_questions(raw_questions),
            "questions_count": questions_count,
        }

    # Verify assessment window is still open before creating a new attempt
    validate_student_exam_access(assessment, None, require_in_progress=False, now=now)

    # Create new in_progress attempt (handle concurrent double-/start cleanly)
    new_submission = AssessmentSubmission(
        assessment_id=assessment_id,
        student_id=student_id,
        status="in_progress",
        started_at=now,
        answers={},
        violations_count=0,
        version=1,
    )
    db.add(new_submission)
    try:
        db.commit()
        db.refresh(new_submission)
        active_submission = new_submission
    except Exception:
        db.rollback()
        existing_after_race = db.execute(
            select(AssessmentSubmission).where(
                AssessmentSubmission.assessment_id == assessment_id,
                AssessmentSubmission.student_id == student_id,
            )
        ).scalar_one_or_none()
        if not existing_after_race:
            raise
        if existing_after_race.status in TERMINAL_SUBMISSION_STATUSES:
            _, eff_deadline, _ = get_attempt_timing(assessment, existing_after_race, now=now)
            return {
                "success": True,
                "status": existing_after_race.status,
                "started_at": existing_after_race.started_at or existing_after_race.submitted_at or now,
                "server_timestamp": now,
                "restored_answers": existing_after_race.answers or {},
                "violations_count": existing_after_race.violations_count or 0,
                "anti_cheat_enabled": assessment.anti_cheat_enabled,
                "duration_minutes": assessment.duration_minutes,
                "version": getattr(existing_after_race, "version", 1) or 1,
                "effective_deadline": eff_deadline,
                "seconds_remaining": 0,
                "questions": [],
                "questions_count": questions_count,
            }
        validate_student_exam_access(assessment, existing_after_race, require_in_progress=True, now=now)
        active_submission = existing_after_race

    _, eff_deadline, secs_remaining = get_attempt_timing(assessment, active_submission, now=now)

    return {
        "success": True,
        "status": "in_progress",
        "started_at": active_submission.started_at or now,
        "server_timestamp": now,
        "restored_answers": active_submission.answers or {},
        "violations_count": active_submission.violations_count or 0,
        "anti_cheat_enabled": assessment.anti_cheat_enabled,
        "duration_minutes": assessment.duration_minutes,
        "version": getattr(active_submission, "version", 1) or 1,
        "effective_deadline": eff_deadline,
        "seconds_remaining": secs_remaining,
        "questions": sanitize_assessment_questions(raw_questions),
        "questions_count": questions_count,
    }


def _build_save_conflict_response(
    now: datetime,
    status_val: str,
    version_val: int,
    answers_val: Dict[str, Any],
    eff_deadline: Optional[datetime],
    secs_remaining: int,
) -> Dict[str, Any]:
    return {
        "success": False,
        "conflict": True,
        "saved_answers_count": len(answers_val or {}),
        "server_timestamp": now,
        "status": status_val,
        "version": version_val,
        "answers": answers_val or {},
        "effective_deadline": eff_deadline,
        "seconds_remaining": secs_remaining,
    }


def save_exam_progress(
    db: Session, student_id: UUID, data: ExamSaveProgressRequest
) -> Dict[str, Any]:
    """
    Auto-saves in-progress answers with mandatory optimistic concurrency version control.
    Enforces the shared student exam eligibility rule and atomic WHERE version = :expected.
    Ignores client-supplied violations_count.
    """
    if getattr(data, "expected_version", None) is None:
        raise HTTPException(
            status_code=422,
            detail="expected_version is required for saving examination progress.",
        )

    assessment = _verify_student_enrolled_in_assessment(db, student_id, data.assessment_id)
    now = datetime.now(timezone.utc)

    submission = db.execute(
        select(AssessmentSubmission).where(
            AssessmentSubmission.assessment_id == data.assessment_id,
            AssessmentSubmission.student_id == student_id,
        )
    ).scalar_one_or_none()

    # 1. Validate assessment is published and started before allowing saves
    _validate_assessment_published_and_started(assessment, now=now)

    # 2. Require an active /start submission row (never create a submission row in /save-progress)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Examination session has not been started. Call /start first.",
        )

    # 3. Return structured conflict if attempt is already submitted/evaluated/pending_review
    if submission.status in TERMINAL_SUBMISSION_STATUSES:
        _, eff_deadline, _ = get_attempt_timing(assessment, submission, now=now)
        return _build_save_conflict_response(
            now=now,
            status_val=submission.status,
            version_val=getattr(submission, "version", 1) or 1,
            answers_val=submission.answers or {},
            eff_deadline=eff_deadline,
            secs_remaining=0,
        )

    # 4. Enforce in_progress state and effective server deadline
    eff_deadline, secs_remaining = validate_student_exam_access(
        assessment, submission, require_in_progress=True, now=now
    )

    current_version = getattr(submission, "version", 1) or 1

    # 5. Fast-path OCC mismatch detection
    if data.expected_version != current_version:
        return _build_save_conflict_response(
            now=now,
            status_val=submission.status,
            version_val=current_version,
            answers_val=submission.answers or {},
            eff_deadline=eff_deadline,
            secs_remaining=secs_remaining,
        )

    next_version = data.expected_version + 1
    try:
        # Conditional atomic SQL UPDATE guarded by expected_version and active status
        update_stmt = (
            update(AssessmentSubmission)
            .where(
                AssessmentSubmission.id == submission.id,
                AssessmentSubmission.version == data.expected_version,
                AssessmentSubmission.status == "in_progress",
            )
            .values(
                answers=data.answers,
                version=next_version,
            )
        )
        update_result = db.execute(update_stmt)
        rowcount = getattr(update_result, "rowcount", None)
        if isinstance(rowcount, int) and rowcount == 0:
            db.rollback()
            refreshed = db.execute(
                select(AssessmentSubmission).where(AssessmentSubmission.id == submission.id)
            ).scalar_one_or_none()
            curr_v = (refreshed.version if refreshed else current_version) or 1
            curr_ans = (refreshed.answers if refreshed else submission.answers) or {}
            curr_st = refreshed.status if refreshed else submission.status
            return _build_save_conflict_response(
                now=now,
                status_val=curr_st,
                version_val=curr_v,
                answers_val=curr_ans,
                eff_deadline=eff_deadline,
                secs_remaining=0 if curr_st in TERMINAL_SUBMISSION_STATUSES else secs_remaining,
            )

        db.commit()

        # Sync ORM state without re-emitting an unguarded ORM flush
        try:
            mapped_state = sa_inspect(submission, raiseerr=False)
        except Exception:
            mapped_state = None
        if mapped_state is not None and getattr(mapped_state, "session", None) is not None:
            db.refresh(submission)
        else:
            submission.answers = data.answers
            submission.version = next_version

    except Exception:
        db.rollback()
        refreshed = db.execute(
            select(AssessmentSubmission).where(AssessmentSubmission.id == submission.id)
        ).scalar_one_or_none()
        curr_v = (refreshed.version if refreshed else current_version) or 1
        curr_ans = (refreshed.answers if refreshed else submission.answers) or {}
        curr_st = refreshed.status if refreshed else "in_progress"
        return _build_save_conflict_response(
            now=now,
            status_val=curr_st,
            version_val=curr_v,
            answers_val=curr_ans,
            eff_deadline=eff_deadline,
            secs_remaining=secs_remaining,
        )

    return {
        "success": True,
        "conflict": False,
        "saved_answers_count": len(data.answers or {}),
        "server_timestamp": now,
        "status": "in_progress",
        "version": next_version,
        "answers": data.answers,
        "effective_deadline": eff_deadline,
        "seconds_remaining": secs_remaining,
    }


def record_security_event(
    db: Session, student_id: UUID, data: ExamSecurityEventCreate
) -> Dict[str, Any]:
    """
    Records an integrity event with idempotency protection.
    A retried event carrying the same client-generated idempotency_key is returned safely
    without double-incrementing violation penalty counts.
    """
    assessment = _verify_student_enrolled_in_assessment(db, student_id, data.assessment_id)
    now = datetime.now(timezone.utc)

    # 1. Idempotency Check: prevent duplicate event processing on network retries
    if data.idempotency_key:
        existing_event = db.execute(
            select(ExamProctoringEvent).where(
                ExamProctoringEvent.assessment_id == data.assessment_id,
                ExamProctoringEvent.student_id == student_id,
                ExamProctoringEvent.idempotency_key == data.idempotency_key,
            )
        ).scalar_one_or_none()

        if existing_event:
            # Fetch current attempt violations
            current_sub = db.execute(
                select(AssessmentSubmission).where(
                    AssessmentSubmission.assessment_id == data.assessment_id,
                    AssessmentSubmission.student_id == student_id,
                )
            ).scalar_one_or_none()
            v_count = current_sub.violations_count if current_sub and current_sub.violations_count else 0

            return {
                "id": existing_event.id,
                "assessment_id": existing_event.assessment_id,
                "student_id": existing_event.student_id,
                "event_type": existing_event.event_type,
                "sequence_number": existing_event.sequence_number,
                "duration_seconds": float(existing_event.duration_seconds),
                "violations_count": v_count,
                "security_level": "normal" if v_count == 0 else ("warning_1" if v_count == 1 else ("warning_2" if v_count == 2 else "flagged")),
                "policy_warning": None,
                "created_at": existing_event.created_at,
                "idempotency_key": existing_event.idempotency_key,
                "is_duplicate": True,
            }

    is_violation = data.event_type in VIOLATION_EVENT_TYPES and assessment.anti_cheat_enabled

    # 2. Fetch current submission attempt
    submission = db.execute(
        select(AssessmentSubmission).where(
            AssessmentSubmission.assessment_id == data.assessment_id,
            AssessmentSubmission.student_id == student_id,
        )
    ).scalar_one_or_none()

    current_violations = submission.violations_count if submission and submission.violations_count else 0
    if is_violation:
        current_violations += 1
        if submission:
            submission.violations_count = current_violations

    # 3. Persist proctoring event log with idempotency_key
    event = ExamProctoringEvent(
        assessment_id=data.assessment_id,
        student_id=student_id,
        event_type=data.event_type,
        sequence_number=data.sequence_number,
        duration_seconds=Decimal(str(round(data.duration_seconds, 2))),
        event_metadata=data.event_metadata or {},
        acknowledged=data.acknowledged,
        idempotency_key=data.idempotency_key,
        created_at=now,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # 4. Dynamic Warning Policy Evaluation
    policy_warning: Optional[str] = None
    if current_violations == 0:
        security_level = "normal"
    elif current_violations == 1:
        security_level = "warning_1"
        policy_warning = (
            "First incident recorded: Leaving the examination screen or switching tabs is strictly prohibited."
        )
    elif current_violations == 2:
        security_level = "warning_2"
        policy_warning = (
            f"Second incident recorded ({round(data.duration_seconds, 1)}s away): Repeated focus changes will be flagged for instructor disciplinary review."
        )
    else:
        security_level = "flagged"
        policy_warning = (
            f"Maximum warnings reached ({current_violations} incidents recorded): This attempt has been officially flagged for instructor and administrator review."
        )

    return {
        "id": event.id,
        "assessment_id": event.assessment_id,
        "student_id": event.student_id,
        "event_type": event.event_type,
        "sequence_number": event.sequence_number,
        "duration_seconds": float(event.duration_seconds),
        "violations_count": current_violations,
        "security_level": security_level,
        "policy_warning": policy_warning,
        "created_at": event.created_at,
        "idempotency_key": event.idempotency_key,
        "is_duplicate": False,
    }


def get_exam_proctoring_logs(
    db: Session,
    assessment_id: UUID,
    student_id: Optional[UUID] = None,
) -> Dict[str, Any]:
    """
    Retrieves chronological proctoring audit log for trainers and administrators.
    """
    query = (
        select(
            ExamProctoringEvent,
            Student.full_name.label("student_name"),
            Student.roll_number.label("roll_number"),
        )
        .join(Student, Student.id == ExamProctoringEvent.student_id)
        .where(ExamProctoringEvent.assessment_id == assessment_id)
    )

    if student_id:
        query = query.where(ExamProctoringEvent.student_id == student_id)

    query = query.order_by(desc(ExamProctoringEvent.created_at))
    rows = db.execute(query).all()

    logs = []
    total_violations = 0
    for event, student_name, roll_number in rows:
        if event.event_type in VIOLATION_EVENT_TYPES:
            total_violations += 1
        logs.append({
            "id": event.id,
            "student_id": event.student_id,
            "student_name": student_name,
            "roll_number": roll_number,
            "event_type": event.event_type,
            "sequence_number": event.sequence_number,
            "duration_seconds": float(event.duration_seconds),
            "event_metadata": event.event_metadata or {},
            "created_at": event.created_at,
        })

    status_str = "clean"
    if total_violations >= 3:
        status_str = "flagged_for_review"
    elif total_violations > 0:
        status_str = "warning"

    return {
        "assessment_id": assessment_id,
        "total_events": len(logs),
        "violations_count": total_violations,
        "security_status": status_str,
        "logs": logs,
    }

