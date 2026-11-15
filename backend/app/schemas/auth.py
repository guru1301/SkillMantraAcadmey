"""
Authentication Request & Response Schemas.
"""
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from backend.app.core.password_policy import validate_password


class LoginRequest(BaseModel):
    email: str = Field(..., description="Email address or student roll number")
    password: str = Field(..., min_length=1, description="Account password")
    role_hint: Optional[str] = Field(None, description="Optional role disambiguation hint: super_admin | college_admin | trainer | student")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current account password")
    new_password: str = Field(..., min_length=10, max_length=128, description="New strong password (min 10 chars)")
    confirm_password: Optional[str] = Field(None, description="Optional confirm password matching new_password")

    @field_validator("new_password")
    @classmethod
    def validate_new_password_policy(cls, v: str) -> str:
        validate_password(v)
        return v

    @model_validator(mode="after")
    def verify_passwords_match(self):
        if self.confirm_password is not None and self.confirm_password != self.new_password:
            raise ValueError("New password and confirm password do not match.")
        return self


class ChangePasswordResponse(BaseModel):
    success: bool = True
    message: str
    redirect_to: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: UUID
    email: Optional[str] = None
    full_name: str
    role: str
    status: str = "active"
    college_id: Optional[UUID] = None
    college_name: Optional[str] = None
    session_id: Optional[UUID] = None
    phone: Optional[str] = None
    roll_number: Optional[str] = None
    department: Optional[str] = None
    must_change_password: bool = False

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    success: bool = True
    user_id: UUID
    email: str
    full_name: str
    role: str
    college_id: Optional[UUID] = None
    college_name: Optional[str] = None
    redirect_to: str
    csrf_token: Optional[str] = None
    must_change_password: bool = False
    user: Optional[UserProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class SessionStatusResponse(BaseModel):
    valid: bool = True
    authenticated: bool = True
    user_id: Optional[UUID] = None
    role: Optional[str] = None
    email: Optional[str] = None
    college_id: Optional[UUID] = None
    expires_at: Optional[str] = None
    must_change_password: bool = False


