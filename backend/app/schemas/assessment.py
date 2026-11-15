"""
Assessment, Examination, and Submission Schemas.
"""
from datetime import datetime
from decimal import Decimal
import math
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator


def parse_selected_option_index(val: Any, question_id: str) -> Optional[int]:
    """Safely coerces a submitted option index or raises ValueError for invalid values."""
    if val is None:
        return None
    if isinstance(val, bool):
        raise ValueError(f"Invalid answer index for question '{question_id}'.")
    if isinstance(val, int):
        parsed = val
    elif isinstance(val, float):
        if not math.isfinite(val) or not val.is_integer():
            raise ValueError(f"Invalid answer index for question '{question_id}'.")
        parsed = int(val)
    elif isinstance(val, str):
        stripped = val.strip()
        if not stripped:
            raise ValueError(f"Invalid answer index for question '{question_id}'.")
        try:
            parsed = int(stripped)
        except ValueError as exc:
            raise ValueError(f"Invalid answer index for question '{question_id}'.") from exc
    else:
        raise ValueError(f"Invalid answer index for question '{question_id}'.")

    if parsed < 0:
        raise ValueError(f"Answer index for question '{question_id}' cannot be negative.")
    return parsed


class QuestionOptionItem(BaseModel):
    id: str
    question: str
    options: List[str]
    correctOptionIndex: int
    points: int = 1
    explanation: Optional[str] = None


class AssessmentBase(BaseModel):
    batch_id: UUID
    title: str = Field(..., min_length=2, max_length=255)
    topic: Optional[str] = None
    description: Optional[str] = None
    type: str = Field(default="quiz", pattern="^(quiz|assignment|practical_test)$")
    total_marks: Decimal = Field(default=Decimal("100.00"), ge=0)
    passing_marks: Decimal = Field(default=Decimal("40.00"), ge=0)
    duration_minutes: Optional[int] = Field(None, ge=1)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    deadline: Optional[datetime] = None
    due_date: Optional[datetime] = None
    shuffle_questions: bool = True
    anti_cheat_enabled: bool = True
    is_published: bool = False
    questions: Optional[List[Dict[str, Any]]] = None
    instructions: Optional[str] = None
    status: str = Field(default="draft", pattern="^(draft|published|closed)$")


class AssessmentCreate(AssessmentBase):
    pass


class AssessmentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    topic: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = Field(None, pattern="^(quiz|assignment|practical_test)$")
    total_marks: Optional[Decimal] = Field(None, ge=0)
    passing_marks: Optional[Decimal] = Field(None, ge=0)
    duration_minutes: Optional[int] = Field(None, ge=1)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    deadline: Optional[datetime] = None
    due_date: Optional[datetime] = None
    shuffle_questions: Optional[bool] = None
    anti_cheat_enabled: Optional[bool] = None
    is_published: Optional[bool] = None
    questions: Optional[List[Dict[str, Any]]] = None
    instructions: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(draft|published|closed)$")


class AssessmentResponse(AssessmentBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssessmentStudentView(BaseModel):
    id: UUID
    batch_id: UUID
    batch_code: Optional[str] = None
    program_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    type: str
    total_marks: Decimal
    passing_marks: Decimal
    duration_minutes: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    instructions: Optional[str] = None
    status: str
    questions_count: int = 0
    submitted: bool = False
    submission_id: Optional[UUID] = None
    score: Optional[Decimal] = None
    submission_status: Optional[str] = None
    submitted_at: Optional[datetime] = None
    is_passed: Optional[bool] = None


class AssessmentSubmissionRequest(BaseModel):
    assessment_id: UUID
    answers: Dict[str, Any] = Field(..., description="Mapping of question ID to selected option index")
    violations_count: int = Field(default=0, ge=0)

    @field_validator("answers")
    @classmethod
    def validate_answers(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        for q_id, raw_val in v.items():
            parse_selected_option_index(raw_val, str(q_id))
        return v


class QuestionReviewItem(BaseModel):
    id: str
    question: str
    options: List[str]
    selectedOptionIndex: Optional[int] = None
    correctOptionIndex: Optional[int] = None
    isCorrect: Optional[bool] = None
    points: int = 1
    explanation: Optional[str] = None


class AssessmentSubmissionResponse(BaseModel):
    success: bool = True
    status: str = "evaluated"
    score: int
    totalMarks: Decimal
    percentage: int
    isPassed: bool
    violations_count: int = 0
    answers_released: bool = False
    review: List[QuestionReviewItem] = []

