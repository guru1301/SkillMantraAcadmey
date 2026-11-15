"""
Student Schemas for Onboarding, Bulk Import, Activation, and Account Management.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from backend.app.core.password_policy import validate_password


class StudentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    roll_number: str = Field(..., min_length=1, max_length=100)
    dob: Optional[str] = Field(None, max_length=20, description="Date of birth in YYYY-MM-DD or DD-MM-YYYY format")
    gender: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)
    college_id: Optional[UUID] = None
    status: str = Field(default="active", pattern="^(active|inactive|pending_activation|archived)$")


class StudentCreate(StudentBase):
    password: Optional[str] = Field(None, min_length=10)

    @field_validator("password")
    @classmethod
    def validate_student_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            validate_password(v)
        return v


class StudentUpdate(BaseModel):
    """Profile fields editable via PUT /students/{id}. Status and password changes must use dedicated endpoints."""
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=2, max_length=255)
    dob: Optional[str] = Field(None, max_length=20)
    gender: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)


class StudentResponse(StudentBase):
    id: UUID
    college_id: Optional[UUID] = None
    must_change_password: bool = False
    activated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudentCredentialItem(BaseModel):
    student_id: UUID
    roll_number: str
    full_name: str
    temporary_password: str


class BatchCredentialsAssignResponse(BaseModel):
    success: bool = True
    count: int
    credentials: List[StudentCredentialItem]
    message: str = "Credentials assigned successfully."


class SingleStudentCredentialsResponse(BaseModel):
    success: bool = True
    student_id: UUID
    roll_number: str
    temporary_password: str
    message: str = "Credentials assigned successfully."


class BulkStudentItem(BaseModel):
    rollNumber: str = Field(..., min_length=1)
    fullName: str = Field(..., min_length=2)
    dob: Optional[str] = None
    gender: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    yearOrSemester: Optional[str] = None


class BulkStudentEnrollRequest(BaseModel):
    batch_id: UUID
    students: List[BulkStudentItem]


class BulkEnrollConflictItem(BaseModel):
    studentId: str
    rollNumber: str
    existingFullName: str
    submittedFullName: str
    note: str = "Existing student record preserved; full_name not overwritten."


class BulkStudentEnrollResponse(BaseModel):
    success: bool = True
    totalProcessed: int
    newlyEnrolled: int
    conflicts: List[BulkEnrollConflictItem] = Field(default_factory=list)


class EnrolledStudentResponse(BaseModel):
    id: UUID
    roll_number: str
    full_name: str
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year_or_semester: Optional[str] = None
    college_id: Optional[UUID] = None
    college_name: Optional[str] = None
    batch_codes: Optional[str] = None
    enrollment_status: Optional[str] = None
    enrolled_at: Optional[Any] = None
    has_credentials: bool = False
    must_change_password: bool = False
    status: str = "active"
    student_status: str = "active"
    activated_at: Optional[Any] = None
    archived_at: Optional[Any] = None
    created_at: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True, extra="ignore")


class RosterImportPreviewItem(BaseModel):
    rowIndex: int
    rollNumber: str
    fullName: str
    dob: Optional[str] = None
    gender: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    yearOrSemester: Optional[str] = None
    status: str  # "new", "existing", "duplicate_in_file", "conflict_college", "invalid"
    message: str


class RosterImportPreviewRequest(BaseModel):
    batch_id: UUID
    college_id: Optional[UUID] = None
    students: List[BulkStudentItem]


class RosterImportPreviewResponse(BaseModel):
    totalRows: int
    validNewCount: int
    existingCount: int
    duplicateCount: int
    conflictCount: int
    invalidCount: int
    previewRows: List[RosterImportPreviewItem]


class ActivationCredentialItem(BaseModel):
    rollNumber: str
    fullName: str
    department: Optional[str] = None
    activationCode: str


class RosterImportExecuteRequest(BaseModel):
    batch_id: UUID
    college_id: Optional[UUID] = None
    students: List[BulkStudentItem]


class RosterImportExecuteResponse(BaseModel):
    success: bool = True
    totalUploaded: int
    accountsProvisioned: int
    existingEnrolled: int
    skippedCount: int
    duplicateCount: int
    failedCount: int
    activationCredentials: List[ActivationCredentialItem] = []
    errors: List[str] = []


class StudentActivationRequest(BaseModel):
    roll_number: str = Field(..., min_length=1)
    dob: str = Field(..., min_length=4, description="Date of birth provided during onboarding")
    activation_code: str = Field(..., min_length=4, description="Single-use activation credential")
    new_password: str = Field(..., min_length=10, description="New secret password (min 10 chars)")
    college_code: Optional[str] = Field(None, description="Optional college code for disambiguation")
    email: Optional[str] = Field(None, description="Optional email for disambiguation")

    @model_validator(mode="after")
    def validate_student_activation_password(self) -> "StudentActivationRequest":
        validate_password(
            self.new_password,
            context={"roll_number": self.roll_number, "dob": self.dob},
        )
        return self


class StudentActivationResponse(BaseModel):
    success: bool = True
    message: str
    rollNumber: str


class StudentStatusUpdatePayload(BaseModel):
    status: str = Field(..., pattern="^(active|inactive|pending_activation|archived)$")
    reason: Optional[str] = None


class BulkStudentActionPayload(BaseModel):
    student_ids: List[UUID] = Field(..., min_length=1)
    action: str = Field(..., pattern="^(deactivate|reactivate|revoke_sessions|reset_activation|delete|archive)$")
    mode: Optional[str] = Field("archive", pattern="^(archive|permanent)$")
    reason: Optional[str] = None


class BulkStudentActionResult(BaseModel):
    success: bool = True
    totalSelected: int
    processedCount: int
    skippedCount: int
    failedCount: int
    results: List[Dict[str, Any]]
    activationCredentials: Optional[List[ActivationCredentialItem]] = None
