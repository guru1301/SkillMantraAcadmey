"""
Pydantic Schemas Package for Skill Mantra Academy API.
"""
from backend.app.schemas.common import MessageResponse, ErrorResponse, PaginatedResponse
from backend.app.schemas.auth import LoginRequest, LoginResponse, UserProfileResponse, SessionStatusResponse
from backend.app.schemas.college import (
    CollegeCreate, CollegeUpdate, CollegeStatusUpdate,
    CollegeResponse, CollegeWithCountsResponse, CollegeStatsResponse
)
from backend.app.schemas.program import (
    ProgramCreate, ProgramUpdate, ProgramResponse, ProgramWithCountsResponse
)
from backend.app.schemas.batch import (
    BatchCreate, BatchUpdate, BatchStatusUpdate, BatchResponse, BatchDetailResponse, BatchStatsResponse
)
from backend.app.schemas.trainer import (
    TrainerCreate, TrainerUpdate, TrainerSelfUpdate, TrainerAdminUpdate,
    TrainerResponse, TrainerDetailResponse,
    TrainerBatchAssignmentCreate, BatchAssignedTrainerResponse
)
from backend.app.schemas.student import (
    StudentCreate, StudentUpdate, StudentResponse, BulkStudentItem,
    BulkStudentEnrollRequest, BulkStudentEnrollResponse, EnrolledStudentResponse
)
from backend.app.schemas.session import (
    TrainingSessionCreate, TrainingSessionUpdate, TrainingSessionResponse, TrainingSessionDetailResponse
)
from backend.app.schemas.attendance import (
    AttendanceMarkItem, BulkAttendanceMarkRequest, AttendanceRecordResponse,
    StudentAttendanceSummaryResponse, StudentAttendanceHistoryItem
)
from backend.app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse
from backend.app.schemas.assessment import (
    AssessmentCreate, AssessmentUpdate, AssessmentResponse, AssessmentStudentView,
    AssessmentSubmissionRequest, AssessmentSubmissionResponse, QuestionReviewItem
)
from backend.app.schemas.certificate import CertificateEligibilityResponse, CertificateEligibilityItem
from backend.app.schemas.inquiry import ContactInquiryCreate, ContactInquiryStatusUpdate, ContactInquiryResponse

