"""
Resource Schemas for Batch Courseware & Documents.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ResourceBase(BaseModel):
    batch_id: UUID
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    type: str = Field(..., pattern="^(google_drive|document|video|link)$")
    url: str = Field(..., min_length=5)


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    type: Optional[str] = Field(None, pattern="^(google_drive|document|video|link)$")
    url: Optional[str] = Field(None, min_length=5)


class ResourceResponse(ResourceBase):
    id: UUID
    name: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

