"""
Attendance Schemas for Session Tracking and Student History.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class AttendanceMarkItem(BaseModel):
    student_id: UUID
    status: str = Field(..., pattern="^(present|absent|late|excused)$")
    remarks: Optional[str] = None


class BulkAttendanceMarkRequest(BaseModel):
    session_id: UUID
    records: List[AttendanceMarkItem]


class AttendanceRecordResponse(BaseModel):
    id: UUID
    session_id: UUID
    student_id: UUID
    status: str
    remarks: Optional[str] = None
    marked_at: datetime
    marked_by: Optional[UUID] = None
    marked_by_id: Optional[UUID] = None
    marked_by_role: Optional[str] = None
    updated_at: Optional[datetime] = None
    student_name: Optional[str] = None
    roll_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class StudentAttendanceHistoryItem(BaseModel):
    session_id: Optional[UUID] = None
    sessionId: Optional[UUID] = None
    batch_id: Optional[UUID] = None
    batchId: Optional[UUID] = None
    batch_code: Optional[str] = None
    batchCode: Optional[str] = None
    program_name: Optional[str] = None
    programName: Optional[str] = None
    date: Optional[str] = None
    title: Optional[str] = None
    topic: Optional[str] = None
    status: Optional[str] = None
    attendance_status: Optional[str] = None
    attendance_notes: Optional[str] = None
    remarks: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, extra="ignore")


class StudentAttendanceSummaryResponse(BaseModel):
    totalRecordedSessions: Optional[int] = 0
    totalSessions: Optional[int] = 0
    presentCount: Optional[int] = 0
    absentCount: Optional[int] = 0
    lateCount: Optional[int] = 0
    excusedCount: Optional[int] = 0
    unmarkedCompletedSessions: Optional[int] = 0
    percentage: Optional[float] = 0.0
    attendancePercentage: Optional[float] = 0.0
    history: List[StudentAttendanceHistoryItem] = []

    model_config = ConfigDict(from_attributes=True, extra="ignore")


class SessionRosterItem(BaseModel):
    student_id: UUID
    roll_number: str
    full_name: str
    email: Optional[str] = None
    department: Optional[str] = None
    status: str = "unmarked"
    notes: Optional[str] = None
    marked_at: Optional[str] = None


class PlatformAttendanceStatsResponse(BaseModel):
    totalSessions: int
    totalRecordsMarked: int
    overallAttendanceRate: float


