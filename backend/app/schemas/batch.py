"""
Batch Schemas for Management across Admin, College, and Trainer scopes.
"""
from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator


class BatchBase(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    batch_code: Optional[str] = Field(None, max_length=50)
    college_id: Optional[UUID] = None
    program_id: UUID
    start_date: date
    end_date: date
    target_strength: int = Field(default=60, ge=0)
    status: str = Field(default="planned", pattern="^(planned|active|completed|cancelled)$")

    @model_validator(mode="after")
    def validate_date_range(self) -> "BatchBase":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be greater than or equal to start_date.")
        return self


class BatchCreate(BatchBase):
    pass


class BatchUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    batch_code: Optional[str] = Field(None, max_length=50)
    program_id: Optional[UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_strength: Optional[int] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern="^(planned|active|completed|cancelled)$")

    @model_validator(mode="after")
    def validate_date_range(self) -> "BatchUpdate":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be greater than or equal to start_date.")
        return self


class BatchStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(planned|active|completed|cancelled)$")


class BatchResponse(BaseModel):
    id: UUID
    college_id: UUID
    program_id: UUID
    code: Optional[str] = None
    batch_code: Optional[str] = None
    name: Optional[str] = None
    start_date: date
    end_date: date
    target_strength: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BatchDetailResponse(BatchResponse):
    college_name: Optional[str] = None
    college_city: Optional[str] = None
    program_name: Optional[str] = None
    actual_students_count: int = 0
    trainers_count: int = 0
    assigned_trainers: Optional[str] = None
    sessions_count: int = 0


class BatchStatsResponse(BaseModel):
    targetStrength: int
    actualStudents: int
    assignedTrainers: int
    totalSessions: int
    attendancePercentage: float
    assessmentsCount: int

