"""
Trainer Schemas for Admin, College Portal, and Trainer Portal.
"""
from datetime import datetime
from typing import List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from backend.app.core.password_policy import validate_password


class TrainerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    expertise: Optional[List[str]] = None
    bio: Optional[str] = None
    status: str = Field(default="active", pattern="^(active|inactive)$")


class TrainerCreate(TrainerBase):
    password: Optional[str] = Field(None, min_length=10)

    @field_validator("password")
    @classmethod
    def validate_trainer_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            validate_password(v)
        return v


class TrainerSelfUpdate(BaseModel):
    """Restricted schema for trainer self-service profile updates only."""
    model_config = ConfigDict(extra="forbid")

    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    skills: Optional[Union[str, List[str]]] = None
    bio: Optional[str] = None


class TrainerAdminUpdate(BaseModel):
    """Administrative schema allowing full trainer record and status management."""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    expertise: Optional[List[str]] = None
    skills: Optional[Union[str, List[str]]] = None
    bio: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive)$")
    password: Optional[str] = Field(None, min_length=10)

    @field_validator("password")
    @classmethod
    def validate_admin_trainer_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            validate_password(v)
        return v


TrainerUpdate = TrainerAdminUpdate


class TrainerResponse(TrainerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    assigned_batches_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class AssignedBatchItem(BaseModel):
    batch_id: UUID
    batch_code: str
    college_name: str
    program_name: str
    start_date: str
    end_date: str
    batch_status: str
    is_lead: bool = False
    role: str = "trainer"
    assigned_at: Optional[str] = None


class TrainerDetailResponse(TrainerResponse):
    assigned_batches: List[AssignedBatchItem] = []


class TrainerAvailableSummary(BaseModel):
    id: UUID
    full_name: str
    skills: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TrainerBatchAssignmentCreate(BaseModel):
    trainer_id: UUID
    role: str = Field(default="trainer", max_length=50)
    is_lead: bool = False


class BatchAssignedTrainerResponse(BaseModel):
    assignment_id: UUID
    trainer_id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    expertise: Optional[List[str]] = None
    trainer_status: str
    is_lead: bool
    role: str
    assigned_at: datetime

