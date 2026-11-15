"""
Program Schemas for Super Admin & College Portal.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ProgramBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    duration_days: int = Field(default=30, ge=0)
    modules: Optional[List[Dict[str, Any]]] = None
    progress_weights: Optional[Dict[str, Any]] = None
    status: str = Field(default="active", pattern="^(active|inactive)$")


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    duration_days: Optional[int] = Field(None, ge=0)
    modules: Optional[List[Dict[str, Any]]] = None
    progress_weights: Optional[Dict[str, Any]] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive)$")


class ProgramResponse(ProgramBase):
    id: UUID
    code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProgramWithCountsResponse(ProgramResponse):
    batches_count: int = 0

