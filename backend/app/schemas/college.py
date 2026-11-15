"""
College Schemas for Super Admin & College Portal.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CollegeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    pincode: Optional[str] = Field(None, max_length=20)
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    logo_url: Optional[str] = None
    status: str = Field(default="active", pattern="^(active|inactive)$")


class CollegeCreate(CollegeBase):
    pass


class CollegeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    pincode: Optional[str] = Field(None, max_length=20)
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    logo_url: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive)$")


class CollegeStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|inactive)$")


class CollegeResponse(CollegeBase):
    id: UUID
    code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CollegeWithCountsResponse(CollegeResponse):
    active_batches_count: int = 0
    enrolled_students_count: int = 0


class CollegeStatsResponse(BaseModel):
    programsCount: int
    activeBatchesCount: int
    totalBatchesCount: int
    enrolledStudentsCount: int
    assignedTrainersCount: int

