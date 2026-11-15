"""
Training Session Schemas for Batches and Trainer Scheduling.
"""
from datetime import date, time, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class TrainingSessionBase(BaseModel):
    batch_id: UUID
    trainer_id: Optional[UUID] = None
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    topic: Optional[str] = None
    session_date: Optional[date] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: str = Field(default="scheduled", pattern="^(scheduled|completed|cancelled)$")
    meeting_link: Optional[str] = None
    recording_link: Optional[str] = None


class TrainingSessionCreate(TrainingSessionBase):
    pass


class TrainingSessionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    session_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: Optional[str] = Field(None, pattern="^(scheduled|completed|cancelled)$")
    meeting_link: Optional[str] = None
    recording_link: Optional[str] = None
    trainer_id: Optional[UUID] = None


class TrainingSessionResponse(TrainingSessionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TrainingSessionDetailResponse(TrainingSessionResponse):
    batch_code: Optional[str] = None
    trainer_name: Optional[str] = None
    program_name: Optional[str] = None
    college_name: Optional[str] = None
    total_students: int = 0
    present_count: int = 0
    absent_count: int = 0

