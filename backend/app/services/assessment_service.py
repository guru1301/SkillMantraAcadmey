"""
Assessment Business Service: Examination management, question evaluation, and scoring.
"""
from datetime import datetime, timezone
from decimal import Decimal
import json
from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import delete, func, select, text
from sqlalchemy.orm import Session

from backend.app.db.models import Assessment, AssessmentSubmission, BatchStudent, Batch
from backend.app.schemas.assessment import (
    AssessmentCreate,
    AssessmentUpdate,
    parse_selected_option_index,
)
from backend.app.services.proctoring_service import (
    TERMINAL_SUBMISSION_STATUSES,
    can_student_read_questions,
    get_server_violations_count,
    is_assessment_deadline_passed,
    sanitize_assessment_questions,
    validate_student_exam_access,
)


def get_assessments_for_batch(
    db: Session,
    batch_id: UUID,
    student_id: Optional[UUID] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieves assessments for a batch. If student_id is provided, includes submission status and scores.
    """
    params: Dict[str, Any] = {"batch_id": batch_id}
    student_join = ""
    student_select = "NULL as submission_id, NULL as score, NULL as submission_status, NULL as submitted_at, NULL as is_passed, FALSE as submitted"
    published_filter = ""

    if student_id:
        student_join = "LEFT JOIN assessment_submissions sub ON sub.assessment_id = a.id AND sub.student_id = :student_id"
        student_select = """
          sub.id as submission_id,
          sub.score,
          sub.status as submission_status,
          sub.submitted_at,
          CASE WHEN sub.status IN ('submitted', 'evaluated') THEN (sub.score >= a.passing_marks) ELSE FALSE END as is_passed,
          (sub.status IN ('submitted', 'evaluated', 'pending_review')) as submitted
        """
        published_filter = "AND a.status = 'published'"
        params["student_id"] = student_id

    sql = f"""
        SELECT 
          a.id,
          a.batch_id,
          b.code as batch_code,
          p.name as program_name,
          a.title,
          a.description,
          a.type,
          a.total_marks,
          a.passing_marks,
          a.duration_minutes,
          a.start_time,
          COALESCE(a.deadline, a.due_date) as end_time,
          NULL::text as instructions,
          a.status,
          (a.status = 'published') as is_published,
          COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(a.questions) = 'array' THEN a.questions ELSE '[]'::jsonb END), 0) as questions_count,
          {student_select}
        FROM assessments a
        JOIN batches b ON b.id = a.batch_id
        JOIN programs p ON p.id = b.program_id
        {student_join}
        WHERE a.batch_id = :batch_id
        {published_filter}
        ORDER BY a.created_at DESC
    """
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]


def get_student_available_assessments(db: Session, student_id: UUID) -> List[Dict[str, Any]]:
    """
    Retrieves all assessments across all batches the student is actively enrolled in.
    """
    sql = text("""
        SELECT 
          a.id,
          a.batch_id,
          b.code as batch_code,
          p.name as program_name,
          a.title,
          a.description,
          a.type,
          a.total_marks,
          a.passing_marks,
          a.duration_minutes,
          a.start_time,
          COALESCE(a.deadline, a.due_date) as end_time,
          NULL::text as instructions,
          a.status,
          COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(a.questions) = 'array' THEN a.questions ELSE '[]'::jsonb END), 0) as questions_count,
          sub.id as submission_id,
          sub.score,
          sub.status as submission_status,
          sub.submitted_at,
          CASE WHEN sub.status IN ('submitted', 'evaluated') THEN (sub.score >= a.passing_marks) ELSE FALSE END as is_passed,
          (sub.status IN ('submitted', 'evaluated', 'pending_review')) as submitted
        FROM assessments a
        JOIN batches b ON b.id = a.batch_id
        JOIN programs p ON p.id = b.program_id
        JOIN batch_students bs ON bs.batch_id = b.id
        LEFT JOIN assessment_submissions sub ON sub.assessment_id = a.id AND sub.student_id = :student_id
        WHERE bs.student_id = :student_id AND a.status = 'published'
        ORDER BY a.created_at DESC
    """)
    rows = db.execute(sql, {"student_id": student_id}).mappings().all()
    return [dict(r) for r in rows]


def get_assessment_by_id(
    db: Session,
    assessment_id: UUID,
    mask_correct_answers: bool = False,
    student_id: Optional[UUID] = None,
) -> Optional[Dict[str, Any]]:
    """
    Retrieves a single assessment. For students, blocks unpublished assessments with 403
    and returns sanitized questions only when the exam window and active /start attempt are valid.
    """
    assessment = db.execute(select(Assessment).where(Assessment.id == assessment_id)).scalar_one_or_none()
    if not assessment:
        return None

    if student_id is not None and getattr(assessment, "status", None) != "published":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Assessment is not published.",
        )

    raw_questions = assessment.questions if isinstance(assessment.questions, list) else []
    sub: Optional[AssessmentSubmission] = None

    if student_id:
        sub = db.execute(
            select(AssessmentSubmission).where(
                AssessmentSubmission.assessment_id == assessment_id,
                AssessmentSubmission.student_id == student_id,
            )
        ).scalar_one_or_none()

        if can_student_read_questions(assessment, sub):
            questions_to_return = sanitize_assessment_questions(raw_questions)
        else:
            questions_to_return = []
    elif mask_correct_answers:
        questions_to_return = sanitize_assessment_questions(raw_questions)
    else:
        questions_to_return = raw_questions

    result: Dict[str, Any] = {
        "id": assessment.id,
        "batch_id": assessment.batch_id,
        "title": assessment.title,
        "description": assessment.description,
        "type": assessment.type,
        "total_marks": assessment.total_marks,
        "passing_marks": assessment.passing_marks,
        "duration_minutes": assessment.duration_minutes,
        "start_time": assessment.start_time,
        "end_time": assessment.deadline or assessment.due_date,
        "is_published": assessment.status == "published",
        "questions": questions_to_return,
        "questions_count": len(raw_questions),
        "instructions": assessment.description,
        "status": assessment.status,
        "created_by": assessment.trainer_id,
        "created_at": assessment.created_at,
        "updated_at": assessment.updated_at,
    }

    if sub:
        result.update({
            "submission_status": sub.status,
            "submitted": sub.status in TERMINAL_SUBMISSION_STATUSES,
            "score": sub.score,
            "answers": sub.answers or {},
            "violations_count": sub.violations_count or 0,
            "started_at": sub.started_at,
            "submitted_at": sub.submitted_at,
            "version": getattr(sub, "version", 1) or 1,
        })

    return result


def create_assessment(
    db: Session,
    data: AssessmentCreate,
    creator_id: Optional[UUID] = None,
) -> Assessment:
    """
    Creates a new assessment or exam.
    """
    deadline_val = data.deadline or getattr(data, "end_time", None) or getattr(data, "due_date", None)
    status_val = data.status or ("published" if getattr(data, "is_published", False) else "published")
    assessment = Assessment(
        batch_id=data.batch_id,
        trainer_id=creator_id,
        title=data.title.strip(),
        topic=data.topic.strip() if data.topic else None,
        description=data.description.strip() if data.description else None,
        type=data.type,
        total_marks=data.total_marks,
        passing_marks=data.passing_marks,
        duration_minutes=data.duration_minutes or 30,
        start_time=data.start_time,
        deadline=deadline_val,
        due_date=deadline_val,
        shuffle_questions=data.shuffle_questions if data.shuffle_questions is not None else True,
        anti_cheat_enabled=data.anti_cheat_enabled if data.anti_cheat_enabled is not None else True,
        questions=data.questions or [],
        status=status_val,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


def get_trainer_assessments_list(
    db: Session,
    trainer_id: UUID,
    batch_id: Optional[UUID] = None,
) -> List[Dict[str, Any]]:
    params: Dict[str, Any] = {"trainer_id": trainer_id}
    batch_filter = ""
    if batch_id:
        batch_filter = "AND a.batch_id = :batch_id"
        params["batch_id"] = batch_id

    sql = text(f"""
        SELECT 
          a.id,
          a.batch_id,
          b.code as batch_code,
          c.name as college_name,
          p.name as program_name,
          a.title,
          a.type,
          a.topic,
          a.description,
          a.duration_minutes,
          a.total_marks,
          a.passing_marks,
          a.start_time::text as start_time,
          COALESCE(a.deadline, a.due_date)::text as deadline,
          a.shuffle_questions,
          a.anti_cheat_enabled,
          a.status,
          CASE WHEN jsonb_typeof(a.questions) = 'array' THEN jsonb_array_length(a.questions) ELSE 0 END as questions_count,
          COUNT(sub.id)::int as total_submissions,
          COUNT(CASE WHEN sub.status = 'evaluated' THEN 1 END)::int as evaluated_submissions,
          ROUND(AVG(sub.score))::int as average_score,
          a.created_at::text as created_at
        FROM assessments a
        JOIN batches b ON b.id = a.batch_id
        JOIN batch_trainers bt ON bt.batch_id = b.id AND bt.trainer_id = :trainer_id
        JOIN colleges c ON c.id = b.college_id
        JOIN programs p ON p.id = b.program_id
        LEFT JOIN assessment_submissions sub ON sub.assessment_id = a.id
        WHERE 1=1 {batch_filter}
        GROUP BY a.id, b.code, c.name, p.name
        ORDER BY a.created_at DESC
    """)
    rows = db.execute(sql, params).mappings().all()
    return [dict(r) for r in rows]


def get_trainer_assessment_details(
    db: Session,
    assessment_id: UUID,
) -> Optional[Dict[str, Any]]:
    sql = text("""
        SELECT 
           a.id,
           a.batch_id,
           b.code as batch_code,
           c.name as college_name,
           p.name as program_name,
           a.title,
           a.type,
           a.topic,
           a.description,
           a.duration_minutes,
           a.total_marks,
           a.passing_marks,
           a.start_time::text as start_time,
           COALESCE(a.deadline, a.due_date)::text as deadline,
           a.shuffle_questions,
           a.anti_cheat_enabled,
           a.status,
           jsonb_array_length(COALESCE(a.questions, '[]'::jsonb)) as questions_count,
           COUNT(sub.id)::int as total_submissions,
           COUNT(CASE WHEN sub.status = 'evaluated' THEN 1 END)::int as evaluated_submissions,
           ROUND(AVG(sub.score))::int as average_score,
           a.created_at::text as created_at,
           a.questions
        FROM assessments a
        JOIN batches b ON b.id = a.batch_id
        JOIN colleges c ON c.id = b.college_id
        JOIN programs p ON p.id = b.program_id
        LEFT JOIN assessment_submissions sub ON sub.assessment_id = a.id
        WHERE a.id = :assessment_id
        GROUP BY a.id, b.code, c.name, p.name
    """)
    row = db.execute(sql, {"assessment_id": assessment_id}).mappings().first()
    if not row:
        return None

    raw_questions = row["questions"] if isinstance(row["questions"], list) else []
    batch_id = row["batch_id"]

    subs_sql = text("""
        SELECT 
           st.id as student_id,
           st.roll_number,
           st.full_name,
           st.department,
           COALESCE(sub.status, 'not_started') as status,
           sub.score,
           sub.submitted_at::text as submitted_at,
           COALESCE(sub.violations_count, 0) as violations_count
        FROM batch_students bs
        JOIN students st ON st.id = bs.student_id
        LEFT JOIN assessment_submissions sub ON sub.assessment_id = :assessment_id AND sub.student_id = st.id
        WHERE bs.batch_id = :batch_id
        ORDER BY st.roll_number ASC
    """)
    submissions = [dict(s) for s in db.execute(subs_sql, {"assessment_id": assessment_id, "batch_id": batch_id}).mappings().all()]

    assessment_data = dict(row)
    assessment_data.pop("questions", None)

    return {
        "assessment": assessment_data,
        "questions": raw_questions,
        "submissions": submissions,
    }


def update_assessment(
    db: Session,
    assessment_id: UUID,
    data: AssessmentUpdate,
) -> Optional[Assessment]:
    """
    Updates an assessment.
    """
    assessment = db.execute(select(Assessment).where(Assessment.id == assessment_id)).scalar_one_or_none()
    if not assessment:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    if "end_time" in update_dict:
        et = update_dict.pop("end_time")
        if et and "deadline" not in update_dict:
            update_dict["deadline"] = et
            update_dict["due_date"] = et
    if "is_published" in update_dict:
        is_pub = update_dict.pop("is_published")
        if "status" not in update_dict:
            update_dict["status"] = "published" if is_pub else "draft"
    update_dict.pop("instructions", None)
    update_dict.pop("created_by", None)

    for k, v in update_dict.items():
        if hasattr(assessment, k):
            if isinstance(v, str):
                setattr(assessment, k, v.strip())
            else:
                setattr(assessment, k, v)

    assessment.updated_at = func.now()
    db.commit()
    db.refresh(assessment)
    return assessment


def submit_assessment_attempt(
    db: Session,
    assessment_id: UUID,
    student_id: UUID,
    answers: Dict[str, Any],
    violations_count: int = 0,
) -> Dict[str, Any]:
    """
    Evaluates student exam answers under the shared server-side state machine.
    Requires a published assessment inside its active window and an active
    'in_progress' /start submission locked via SELECT ... FOR UPDATE.
    """
    del violations_count  # Strictly ignore client-supplied violation counts.

    # 1. Verify assessment exists
    assessment = db.execute(select(Assessment).where(Assessment.id == assessment_id)).scalar_one_or_none()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found.",
        )

    # 2. Verify student is enrolled in the assessment's batch
    enrollment = db.execute(
        select(BatchStudent).where(
            BatchStudent.batch_id == assessment.batch_id,
            BatchStudent.student_id == student_id,
        )
    ).scalar_one_or_none()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Student is not enrolled in the cohort batch for this assessment.",
        )

    # 3. Lock existing /start submission row (SELECT ... FOR UPDATE) and validate rule set
    existing_sub = db.execute(
        select(AssessmentSubmission)
        .where(
            AssessmentSubmission.assessment_id == assessment_id,
            AssessmentSubmission.student_id == student_id,
        )
        .with_for_update()
    ).scalar_one_or_none()

    now = datetime.now(timezone.utc)
    try:
        validate_student_exam_access(
            assessment,
            existing_sub,
            require_in_progress=True,
            now=now,
        )
    except HTTPException:
        db.rollback()
        raise

    # 4. Validate and coerce all answer option indices cleanly (422 on bad input)
    if not isinstance(answers, dict):
        db.rollback()
        raise HTTPException(
            status_code=422,
            detail="Answers payload must be a JSON object mapping question IDs to option indices.",
        )

    parsed_answers: Dict[str, Optional[int]] = {}
    try:
        for raw_qid, raw_val in answers.items():
            q_key = str(raw_qid)
            parsed_answers[q_key] = parse_selected_option_index(raw_val, q_key)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    questions = assessment.questions if isinstance(assessment.questions, list) else []
    answers_released = is_assessment_deadline_passed(assessment, now=now)

    earned_points = 0
    max_possible_points = 0
    review_items: List[Dict[str, Any]] = []

    for q in questions:
        q_id = str(q.get("id"))
        q_points = int(q.get("points") or 1)
        max_possible_points += q_points

        selected_index = parsed_answers.get(q_id)
        try:
            correct_index = int(q.get("correctOptionIndex", 0))
        except (TypeError, ValueError):
            correct_index = 0

        is_correct = selected_index == correct_index
        if is_correct:
            earned_points += q_points

        review_item: Dict[str, Any] = {
            "id": q_id,
            "question": q.get("question", ""),
            "options": q.get("options", []),
            "selectedOptionIndex": selected_index,
            "points": q_points,
        }
        if answers_released:
            review_item["correctOptionIndex"] = correct_index
            review_item["isCorrect"] = is_correct
            review_item["explanation"] = q.get("explanation")
        review_items.append(review_item)

    # Calculate percentage and scaled score out of assessment.total_marks
    percentage = (
        round((earned_points / max_possible_points) * 100) if max_possible_points > 0 else 0
    )
    total_marks_val = float(assessment.total_marks or 100.0)
    scaled_score = round((percentage / 100.0) * total_marks_val)
    passing_marks_val = float(assessment.passing_marks or 40.0)

    # Authoritative server-side violation count from VIOLATION_EVENT_TYPES only
    final_violations_count = get_server_violations_count(db, assessment_id, student_id)
    needs_review = final_violations_count >= 3
    submission_status = "pending_review" if needs_review else "evaluated"
    is_passed = False if needs_review else (scaled_score >= passing_marks_val)

    if needs_review:
        feedback_text = (
            f"Attempt flagged for manual review ({final_violations_count} integrity violations recorded)."
        )
    elif is_passed:
        feedback_text = f"Passed with {percentage}% score."
    else:
        feedback_text = f"Score: {percentage}%. Needs review."

    # 5. Guarded persistence: only transition an in_progress row; never overwrite evaluated/submitted/pending_review
    upsert_sql = text("""
        INSERT INTO assessment_submissions (
          assessment_id, student_id, status, score,
          answers, violations_count, submitted_at, feedback, version
        )
        VALUES (
          :assessment_id, :student_id, :status, :score,
          CAST(:answers AS jsonb), :violations_count, NOW(), :feedback, 1
        )
        ON CONFLICT (assessment_id, student_id)
        DO UPDATE SET
          status = EXCLUDED.status,
          score = EXCLUDED.score,
          answers = EXCLUDED.answers,
          violations_count = EXCLUDED.violations_count,
          submitted_at = NOW(),
          feedback = EXCLUDED.feedback,
          version = assessment_submissions.version + 1
        WHERE assessment_submissions.status = 'in_progress'
        RETURNING id
    """)

    upsert_res = db.execute(
        upsert_sql,
        {
            "assessment_id": assessment_id,
            "student_id": student_id,
            "status": submission_status,
            "score": scaled_score,
            "answers": json.dumps(parsed_answers),
            "violations_count": final_violations_count,
            "feedback": feedback_text,
        },
    )
    if upsert_res.first() is None:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Examination has already been submitted and cannot be overwritten.",
        )

    db.commit()

    return {
        "success": True,
        "status": submission_status,
        "score": scaled_score,
        "totalMarks": assessment.total_marks,
        "percentage": percentage,
        "isPassed": is_passed,
        "violations_count": final_violations_count,
        "answers_released": answers_released,
        "review": review_items,
    }


def delete_assessment(db: Session, assessment_id: UUID) -> bool:
    """
    Deletes an assessment and cascades to delete any submissions.
    """
    assessment = db.execute(select(Assessment).where(Assessment.id == assessment_id)).scalar_one_or_none()
    if not assessment:
        return False
    db.execute(delete(AssessmentSubmission).where(AssessmentSubmission.assessment_id == assessment_id))
    db.delete(assessment)
    db.commit()
    return True

