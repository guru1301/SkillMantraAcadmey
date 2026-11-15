"""
Contact and Inquiry Schemas.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactInquiryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    designation: Optional[str] = Field(None, max_length=255)
    organization: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=50)
    requirement_type: str = Field(..., min_length=2, max_length=100)
    area_of_interest: Optional[str] = Field(None, max_length=100)
    message: Optional[str] = None


class ContactInquiryStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(new|contacted|resolved|archived)$")


class ContactInquiryResponse(ContactInquiryCreate):
    id: UUID
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

