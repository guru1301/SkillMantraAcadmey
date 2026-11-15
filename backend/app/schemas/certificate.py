"""
Certificate Eligibility Schemas.
"""
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel


class CertificateEligibilityItem(BaseModel):
    batchId: UUID
    batchCode: str
    programName: str
    collegeName: str
    attendanceRate: float
    attendanceRequired: float = 80.0
    attendanceMet: bool
    sessionsCompleted: int
    totalSessions: int
    allSessionsFinished: bool
    feedbackSubmitted: bool = False
    feedbackRequired: bool = True
    pendingRequirement: Optional[str] = None
    isEligible: bool
    issued: bool = False
    certificateNumber: Optional[str] = None


class CertificateEligibilityResponse(BaseModel):
    studentId: UUID
    certificates: List[CertificateEligibilityItem] = []


class CertificateVerifyResponse(BaseModel):
    valid: bool
    certificateNumber: Optional[str] = None
    verificationCode: Optional[str] = None
    studentName: Optional[str] = None
    studentRoll: Optional[str] = None
    collegeName: Optional[str] = None
    programName: Optional[str] = None
    issuedAt: Optional[str] = None
    attendanceRate: Optional[float] = None
    status: Optional[str] = None


class CertificateIssueResponse(BaseModel):
    success: bool
    certificateId: UUID
    certificateNumber: str
    verificationCode: str
    issuedAt: str
    downloadUrl: str


