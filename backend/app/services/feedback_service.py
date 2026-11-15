"""
Feedback Business Service: Manages manual feedback unlocks, student submissions,
strict RBAC access guards, submission progress, and aggregation metrics.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import text, select, func
from sqlalchemy.orm import Session

from backend.app.api.deps import AuthenticatedUser
from backend.app.db.models import (
    Batch,
    BatchStudent,
    BatchTrainer,
    College,
    Program,
    Student,
    TrainingSession,
    AdminUser,
    Trainer,
    CollegeUser,
    BatchFeedbackUnlock,
    StudentFeedback,
)
from backend.app.schemas.feedback import StudentFeedbackCreate


def verify_batch_feedback_access(
    db: Session,
    batch_id: UUID,
    current_user: AuthenticatedUser,
) -> Batch:
    """
    Authorizes user access to batch feedback operations:
    - super_admin: Global access across all colleges.
    - college_admin: Access restricted to cohorts belonging to their college.
    - trainer: Access restricted to cohorts actively assigned to them in batch_trainers.
    - student: Access restricted to cohorts where they are enrolled.
    """
    batch = db.execute(
        select(Batch).where(Batch.id == batch_id)
    ).scalar_one_or_none()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found.",
        )

    if current_user.role == "super_admin":
        return batch

    if current_user.role == "college_admin":
        if batch.college_id != current_user.college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: Access denied to other college's batch feedback.",
            )
        return batch

    if current_user.role == "trainer":
        is_assigned = db.execute(
            select(BatchTrainer.id).where(
                BatchTrainer.batch_id == batch_id,
                BatchTrainer.trainer_id == current_user.id,
            )
        ).scalar_one_or_none()
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Trainer is not assigned to this batch.",
            )
        return batch

    if current_user.role == "student":
        is_enrolled = db.execute(
            select(BatchStudent.id).where(
                BatchStudent.batch_id == batch_id,
                BatchStudent.student_id == current_user.id,
            )
        ).scalar_one_or_none()
        if not is_enrolled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Student is not enrolled in this batch.",
            )
        return batch

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Access forbidden for role '{current_user.role}'.",
    )


def check_batch_training_completed(db: Session, batch_id: UUID) -> bool:
    """
    Authoritative training completion validation:
    A batch is considered completed if:
    1. Batch status is explicitly 'completed', OR
    2. All scheduled training sessions in the batch are marked 'completed' (total > 0).
    """
    batch = db.execute(select(Batch).where(Batch.id == batch_id)).scalar_one_or_none()
    if not batch:
        return False

    if batch.status == "completed":
        return True

    sessions = db.execute(
        select(TrainingSession.status).where(TrainingSession.batch_id == batch_id)
    ).scalars().all()

    if not sessions:
        return False

    return all(s == "completed" for s in sessions)


def get_batch_feedback_status(
    db: Session,
    batch_id: UUID,
    current_user: AuthenticatedUser,
) -> Dict[str, Any]:
    """
    Retrieves current feedback unlock status and submission counters for a batch.
    """
    batch = verify_batch_feedback_access(db, batch_id, current_user)

    college = db.execute(select(College).where(College.id == batch.college_id)).scalar_one_or_none()
    program = db.execute(select(Program).where(Program.id == batch.program_id)).scalar_one_or_none()

    is_completed = check_batch_training_completed(db, batch_id)

    unlock_record = db.execute(
        select(BatchFeedbackUnlock).where(BatchFeedbackUnlock.batch_id == batch_id)
    ).scalar_one_or_none()

    # Calculate status
    if not is_completed:
        computed_status = "not_available"
        is_unlocked = False
    elif not unlock_record:
        computed_status = "locked"
        is_unlocked = False
    else:
        computed_status = unlock_record.status
        is_unlocked = (unlock_record.status == "unlocked")

    # Student counts
    total_enrolled = db.execute(
        select(func.count(BatchStudent.id)).where(BatchStudent.batch_id == batch_id)
    ).scalar() or 0

    submissions_count = db.execute(
        select(func.count(StudentFeedback.id)).where(StudentFeedback.batch_id == batch_id)
    ).scalar() or 0

    pending_count = max(0, total_enrolled - submissions_count)

    unlocked_by_name = None
    if unlock_record:
        # Resolve name of unlocking user
        if unlock_record.unlocked_by_role == "super_admin":
            u = db.execute(select(AdminUser).where(AdminUser.id == unlock_record.unlocked_by_user_id)).scalar_one_or_none()
            unlocked_by_name = u.full_name if u else "Super Administrator"
        elif unlock_record.unlocked_by_role == "trainer":
            t = db.execute(select(Trainer).where(Trainer.id == unlock_record.unlocked_by_user_id)).scalar_one_or_none()
            unlocked_by_name = t.full_name if t else "Assigned Trainer"
        elif unlock_record.unlocked_by_role == "college_admin":
            c = db.execute(select(CollegeUser).where(CollegeUser.id == unlock_record.unlocked_by_user_id)).scalar_one_or_none()
            unlocked_by_name = c.full_name if c else "College Administrator"

    return {
        "batch_id": batch.id,
        "batch_code": batch.code,
        "program_name": program.name if program else "Training Program",
        "college_name": college.name if college else "College Institution",
        "college_id": batch.college_id,
        "training_completed": is_completed,
        "status": computed_status,
        "is_unlocked": is_unlocked,
        "total_students": total_enrolled,
        "submissions_count": submissions_count,
        "pending_count": pending_count,
        "unlocked_by_user_id": unlock_record.unlocked_by_user_id if unlock_record else None,
        "unlocked_by_name": unlocked_by_name,
        "unlocked_by_role": unlock_record.unlocked_by_role if unlock_record else None,
        "unlocked_at": unlock_record.unlocked_at if unlock_record else None,
    }


def unlock_batch_feedback(
    db: Session,
    batch_id: UUID,
    current_user: AuthenticatedUser,
) -> Dict[str, Any]:
    """
    Manually unlocks student feedback for a completed batch:
    - Super Admin: Can unlock any completed batch.
    - Assigned Trainer: Can unlock completed batches assigned to them.
    - College Admin / Student: Forbidden.
    """
    if current_user.role not in ("super_admin", "trainer"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{current_user.role}' is not authorized to unlock student feedback.",
        )

    batch = verify_batch_feedback_access(db, batch_id, current_user)

    # 1. Validate Training Completion Precondition
    is_completed = check_batch_training_completed(db, batch_id)
    if not is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot unlock feedback: Training is not yet completed. The batch status must be 'completed' or all training sessions must be completed.",
        )

    # 2. Check existing unlock record (Idempotent state management)
    existing_unlock = db.execute(
        select(BatchFeedbackUnlock).where(BatchFeedbackUnlock.batch_id == batch_id)
    ).scalar_one_or_none()

    if existing_unlock:
        if existing_unlock.status == "unlocked":
            # Idempotent: return existing status
            return get_batch_feedback_status(db, batch_id, current_user)

        # Transition to unlocked if previously closed/locked
        existing_unlock.status = "unlocked"
        existing_unlock.unlocked_by_user_id = current_user.id
        existing_unlock.unlocked_by_role = current_user.role
        existing_unlock.unlocked_at = datetime.now(timezone.utc)
        db.commit()
    else:
        new_unlock = BatchFeedbackUnlock(
            batch_id=batch_id,
            status="unlocked",
            unlocked_by_user_id=current_user.id,
            unlocked_by_role=current_user.role,
            unlocked_at=datetime.now(timezone.utc),
        )
        db.add(new_unlock)
        db.commit()

    return get_batch_feedback_status(db, batch_id, current_user)


def get_batch_feedback_report(
    db: Session,
    batch_id: UUID,
    current_user: AuthenticatedUser,
) -> Dict[str, Any]:
    """
    Retrieves full feedback analytics and student submissions for authorized staff:
    - Super Admin: global access.
    - College Admin: own college cohorts.
    - Assigned Trainer: assigned cohorts.
    - Students: forbidden.
    """
    if current_user.role == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students do not have permission to view batch feedback reports.",
        )

    batch = verify_batch_feedback_access(db, batch_id, current_user)
    college = db.execute(select(College).where(College.id == batch.college_id)).scalar_one_or_none()
    program = db.execute(select(Program).where(Program.id == batch.program_id)).scalar_one_or_none()

    total_enrolled = db.execute(
        select(func.count(BatchStudent.id)).where(BatchStudent.batch_id == batch_id)
    ).scalar() or 0

    sql = text("""
        SELECT 
          sf.id,
          sf.batch_id,
          sf.student_id,
          sf.rating,
          sf.comments,
          sf.submitted_at,
          s.full_name as student_name,
          s.roll_number as student_roll
        FROM student_feedbacks sf
        JOIN students s ON s.id = sf.student_id
        WHERE sf.batch_id = :batch_id
        ORDER BY sf.submitted_at DESC
    """)
    rows = db.execute(sql, {"batch_id": batch_id}).mappings().all()

    submissions = [dict(r) for r in rows]
    submitted_count = len(submissions)
    pending_count = max(0, total_enrolled - submitted_count)

    submission_pct = (
        round((submitted_count / total_enrolled) * 100.0, 1) if total_enrolled > 0 else 0.0
    )
    avg_rating = (
        round(sum(s["rating"] for s in submissions) / submitted_count, 1)
        if submitted_count > 0
        else 0.0
    )

    distribution = {i: 0 for i in range(1, 11)}
    for s in submissions:
        r = s["rating"]
        if 1 <= r <= 10:
            distribution[r] += 1

    return {
        "batch_id": batch.id,
        "batch_code": batch.code,
        "program_name": program.name if program else "Training Program",
        "college_name": college.name if college else "College Institution",
        "total_eligible": total_enrolled,
        "submitted_count": submitted_count,
        "pending_count": pending_count,
        "submission_percentage": submission_pct,
        "average_rating": avg_rating,
        "rating_distribution": distribution,
        "submissions": submissions,
    }


def get_student_pending_feedbacks(
    db: Session,
    student_id: UUID,
) -> List[Dict[str, Any]]:
    """
    Retrieves all unlocked training batches for which the student has NOT yet submitted feedback.
    """
    sql = text("""
        SELECT 
          b.id as batch_id,
          b.code as batch_code,
          p.name as program_name,
          c.name as college_name,
          b.start_date::text as start_date,
          b.end_date::text as end_date,
          b.status,
          bfu.unlocked_at
        FROM batch_students bs
        JOIN batches b ON b.id = bs.batch_id
        JOIN programs p ON p.id = b.program_id
        JOIN colleges c ON c.id = b.college_id
        JOIN batch_feedback_unlocks bfu ON bfu.batch_id = b.id AND bfu.status = 'unlocked'
        LEFT JOIN student_feedbacks sf ON sf.batch_id = b.id AND sf.student_id = :student_id
        WHERE bs.student_id = :student_id
          AND sf.id IS NULL
        ORDER BY bfu.unlocked_at DESC
    """)
    rows = db.execute(sql, {"student_id": student_id}).mappings().all()
    return [dict(r) for r in rows]


def submit_student_feedback(
    db: Session,
    batch_id: UUID,
    student_id: UUID,
    payload: StudentFeedbackCreate,
) -> Dict[str, Any]:
    """
    Submits student feedback for an unlocked batch:
    - Enforces batch enrollment.
    - Enforces batch feedback unlock status.
    - Enforces single submission per student per batch (UNIQUE constraint guard).
    - Stores rating (1-10) and trimmed written comments.
    """
    # 1. Verify student enrollment in batch
    enrollment = db.execute(
        select(BatchStudent.id).where(
            BatchStudent.batch_id == batch_id,
            BatchStudent.student_id == student_id,
        )
    ).scalar_one_or_none()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this batch and cannot submit post-training feedback.",
        )

    # 2. Verify batch feedback is unlocked
    unlock_record = db.execute(
        select(BatchFeedbackUnlock).where(BatchFeedbackUnlock.batch_id == batch_id)
    ).scalar_one_or_none()

    if not unlock_record or unlock_record.status != "unlocked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post-training student feedback is currently locked or not available for this batch.",
        )

    # 3. Prevent duplicate submission
    existing_feedback = db.execute(
        select(StudentFeedback.id).where(
            StudentFeedback.batch_id == batch_id,
            StudentFeedback.student_id == student_id,
        )
    ).scalar_one_or_none()

    if existing_feedback:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already submitted post-training feedback for this batch.",
        )

    # 4. Record feedback in database transaction
    student = db.execute(select(Student).where(Student.id == student_id)).scalar_one_or_none()

    new_feedback = StudentFeedback(
        batch_id=batch_id,
        student_id=student_id,
        rating=payload.rating,
        comments=payload.comments,
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    return {
        "id": new_feedback.id,
        "batch_id": new_feedback.batch_id,
        "student_id": new_feedback.student_id,
        "student_name": student.full_name if student else None,
        "student_roll": student.roll_number if student else None,
        "rating": new_feedback.rating,
        "comments": new_feedback.comments,
        "submitted_at": new_feedback.submitted_at,
    }

