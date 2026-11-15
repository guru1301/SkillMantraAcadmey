"""
Pydantic Schemas for Post-Training Student Feedback System.
Enforces strict input validation, score bounds (1-10), and comment hygiene.
"""
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator


class FeedbackUnlockStatusResponse(BaseModel):
    batch_id: UUID
    batch_code: str
    program_name: str
    college_name: str
    college_id: UUID
    training_completed: bool
    status: str  # not_available | locked | unlocked | completed | closed
    is_unlocked: bool
    total_students: int
    submissions_count: int
    pending_count: int
    unlocked_by_user_id: Optional[UUID] = None
    unlocked_by_name: Optional[str] = None
    unlocked_by_role: Optional[str] = None
    unlocked_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, extra="ignore")


class StudentFeedbackCreate(BaseModel):
    rating: int = Field(
        ...,
        ge=1,
        le=10,
        description="Overall training experience rating on a scale of 1 to 10 integer stars.",
    )
    comments: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Written post-training comments (min 10, max 2000 non-whitespace characters).",
    )

    @field_validator("comments")
    @classmethod
    def validate_comments_hygiene(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 10:
            raise ValueError("Feedback comments must be at least 10 non-whitespace characters.")
        if len(trimmed) > 2000:
            raise ValueError("Feedback comments cannot exceed 2000 characters.")
        return trimmed


class StudentFeedbackResponse(BaseModel):
    id: UUID
    batch_id: UUID
    student_id: UUID
    student_name: Optional[str] = None
    student_roll: Optional[str] = None
    rating: int
    comments: str
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True, extra="ignore")


class PendingFeedbackItemResponse(BaseModel):
    batch_id: UUID
    batch_code: str
    program_name: str
    college_name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str
    unlocked_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, extra="ignore")


class BatchFeedbackSummaryResponse(BaseModel):
    batch_id: UUID
    batch_code: str
    program_name: str
    college_name: str
    total_eligible: int
    submitted_count: int
    pending_count: int
    submission_percentage: float
    average_rating: float
    rating_distribution: Dict[int, int]
    submissions: List[StudentFeedbackResponse] = []

    model_config = ConfigDict(from_attributes=True, extra="ignore")

