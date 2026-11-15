"""
Schemas for Secure Examination Mode: Fullscreen integrity, event logging, and progress recovery.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ExamSecurityEventCreate(BaseModel):
    assessment_id: UUID
    event_type: str = Field(
        ...,
        pattern="^(TAB_HIDDEN|WINDOW_BLUR|FULLSCREEN_EXIT|PAGE_HIDDEN|CONNECTION_LOST|CONNECTION_RESTORED|EXAM_RESUMED)$",
        description="Standardized integrity event classification",
    )
    sequence_number: int = Field(default=1, ge=1)
    duration_seconds: float = Field(default=0.0, ge=0.0)
    event_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    acknowledged: bool = True
    idempotency_key: Optional[str] = Field(
        default=None, max_length=128, description="Client-generated unique event key for retry deduplication"
    )


class ExamSecurityEventResponse(BaseModel):
    id: UUID
    assessment_id: UUID
    student_id: UUID
    event_type: str
    sequence_number: int
    duration_seconds: float
    violations_count: int
    security_level: str  # "normal" | "warning_1" | "warning_2" | "flagged"
    policy_warning: Optional[str] = None
    created_at: datetime
    idempotency_key: Optional[str] = None
    is_duplicate: bool = False

    model_config = ConfigDict(from_attributes=True)


class ExamSaveProgressRequest(BaseModel):
    assessment_id: UUID
    answers: Dict[str, Any]
    violations_count: Optional[int] = 0
    current_question_index: Optional[int] = None
    expected_version: int = Field(
        ..., ge=1, description="Client-known attempt revision for optimistic concurrency control"
    )


class ExamSaveProgressResponse(BaseModel):
    success: bool
    saved_answers_count: int
    server_timestamp: datetime
    status: str = "in_progress"
    version: int = 1
    answers: Optional[Dict[str, Any]] = None
    conflict: bool = False
    effective_deadline: Optional[datetime] = None
    seconds_remaining: Optional[int] = None


class ExamStartRequest(BaseModel):
    assessment_id: UUID


class ExamStartResponse(BaseModel):
    success: bool
    status: str
    started_at: datetime
    server_timestamp: datetime
    restored_answers: Dict[str, Any] = {}
    violations_count: int = 0
    anti_cheat_enabled: bool = True
    duration_minutes: int = 30
    version: int = 1
    effective_deadline: Optional[datetime] = None
    seconds_remaining: Optional[int] = None
    questions: List[Dict[str, Any]] = Field(default_factory=list)
    questions_count: int = 0


class ExamProctoringLogItem(BaseModel):
    id: UUID
    student_id: UUID
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    event_type: str
    sequence_number: int
    duration_seconds: float
    event_metadata: Dict[str, Any] = {}
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExamProctoringSummaryResponse(BaseModel):
    assessment_id: UUID
    total_events: int
    violations_count: int
    security_status: str  # "clean" | "warning" | "flagged_for_review"
    logs: List[ExamProctoringLogItem] = []

