"""
Stage C API Integration Tests: Authentication, Authorization, Tenant Isolation, and Endpoints.
"""
from decimal import Decimal
from unittest.mock import MagicMock
import uuid
import pytest
from starlette.testclient import TestClient

from backend.app.api.deps import AuthenticatedUser, get_current_user, get_db
from backend.app.core.config import settings
from backend.app.core.rate_limiter import login_ip_rate_limiter, login_identifier_rate_limiter
from backend.app.core.security import generate_session_csrf_token
from backend.app.db.models import Batch, Student
from backend.app.main import app


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def client():
    # Use TestClient with raise_server_exceptions=False to test standard HTTP error codes
    return TestClient(app, raise_server_exceptions=False)


class TestStageCApiIntegration:
    def test_unauthenticated_request_to_protected_endpoint_returns_401(self, client):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401
        assert "Authentication required" in response.json()["detail"]

    def test_unauthenticated_request_to_admin_dashboard_returns_401(self, client):
        response = client.get("/api/v1/admin/dashboard")
        assert response.status_code == 401

    def test_wrong_role_student_accessing_super_admin_endpoint_returns_403(self, client, mock_db):
        student_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student@univ.edu",
            full_name="Alice Student",
        )
        app.dependency_overrides[get_current_user] = lambda: student_user
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            response = client.get("/api/v1/admin/dashboard")
            assert response.status_code == 403
            assert "Access forbidden for role 'student'" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_wrong_role_trainer_accessing_college_create_returns_403(self, client, mock_db):
        trainer_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="trainer",
            email="trainer@test.com",
            full_name="Bob Trainer",
        )
        app.dependency_overrides[get_current_user] = lambda: trainer_user
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            response = client.post(
                "/api/v1/colleges",
                json={"name": "New College", "status": "active"},
            )
            assert response.status_code == 403
            assert "Access forbidden" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_college_admin_cross_tenant_access_returns_403(self, client, mock_db):
        my_college_id = uuid.uuid4()
        other_college_id = uuid.uuid4()

        college_admin_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="admin@college1.edu",
            full_name="College 1 Admin",
            college_id=my_college_id,
        )
        app.dependency_overrides[get_current_user] = lambda: college_admin_user
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            response = client.get(f"/api/v1/colleges/{other_college_id}")
            assert response.status_code == 403
            assert "Tenant isolation violation" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_public_contact_inquiry_submission_returns_201(self, client, mock_db):
        mock_inquiry = MagicMock()
        mock_inquiry.id = uuid.uuid4()
        mock_inquiry.name = "Principal Sharma"
        mock_inquiry.designation = "Principal"
        mock_inquiry.organization = "Delhi Institute of Technology"
        mock_inquiry.email = "principal@dit.ac.in"
        mock_inquiry.phone = "+91 9876543210"
        mock_inquiry.requirement_type = "Full Stack Web Training"
        mock_inquiry.area_of_interest = "Campus Placement"
        mock_inquiry.message = "Interested in training batch of 120 students."
        mock_inquiry.status = "new"
        from datetime import datetime, timezone
        mock_inquiry.created_at = datetime.now(timezone.utc)

        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            with pytest.MonkeyPatch.context() as mp:
                mp.setattr(
                    "backend.app.api.v1.endpoints.inquiries.create_contact_inquiry",
                    lambda db, data: mock_inquiry,
                )
                payload = {
                    "name": "Principal Sharma",
                    "designation": "Principal",
                    "organization": "Delhi Institute of Technology",
                    "email": "principal@dit.ac.in",
                    "phone": "+91 9876543210",
                    "requirement_type": "Full Stack Web Training",
                    "area_of_interest": "Campus Placement",
                    "message": "Interested in training batch of 120 students.",
                }
                response = client.post("/api/v1/inquiries", json=payload)
                assert response.status_code == 201
                data = response.json()
                assert data["organization"] == "Delhi Institute of Technology"
                assert data["status"] == "new"
        finally:
            app.dependency_overrides.clear()

    def test_super_admin_dashboard_returns_200_and_metrics(self, client, mock_db):
        admin_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="super@skillmantra.com",
            full_name="Super Administrator",
        )
        app.dependency_overrides[get_current_user] = lambda: admin_user
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_db.execute.return_value.scalar.return_value = 42
        mock_db.execute.return_value.mappings.return_value.first.return_value = {
            "total": 100,
            "attended": 85,
        }

        try:
            response = client.get("/api/v1/admin/dashboard")
            assert response.status_code == 200
            data = response.json()
            assert "colleges" in data
            assert "programs" in data
            assert "batches" in data
            assert "students" in data
            assert "trainers" in data
            assert "overallAttendanceRate" in data
            assert data["overallAttendanceRate"] == 85.0
        finally:
            app.dependency_overrides.clear()

    def test_student_submitting_exam_returns_scored_review(self, client, mock_db):
        student_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student@univ.edu",
            full_name="Student Test",
        )
        app.dependency_overrides[get_current_user] = lambda: student_user
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_scored_result = {
            "success": True,
            "score": 80,
            "totalMarks": Decimal("100.00"),
            "percentage": 80,
            "isPassed": True,
            "review": [
                {
                    "id": "q1",
                    "question": "Sample Question",
                    "options": ["A", "B", "C"],
                    "selectedOptionIndex": 1,
                    "correctOptionIndex": 1,
                    "isCorrect": True,
                    "points": 1,
                    "explanation": "Correct answer explanation",
                }
            ],
        }

        try:
            with pytest.MonkeyPatch.context() as mp:
                mp.setattr(
                    "backend.app.api.v1.endpoints.assessments.submit_assessment_attempt",
                    lambda db, assessment_id, student_id, answers, violations_count: mock_scored_result,
                )
                payload = {
                    "assessment_id": str(uuid.uuid4()),
                    "answers": {"q1": 1},
                    "violations_count": 0,
                }
                response = client.post("/api/v1/assessments/submit", json=payload)
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert data["score"] == 80
                assert data["isPassed"] is True
                assert len(data["review"]) == 1
        finally:
            app.dependency_overrides.clear()

    def test_student_get_my_certificate_eligibility_returns_200(self, client, mock_db):
        student_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student@univ.edu",
            full_name="Student Test",
        )
        app.dependency_overrides[get_current_user] = lambda: student_user
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_certs = [
            {
                "batchId": uuid.uuid4(),
                "batchCode": "B26-TEST",
                "programName": "Full Stack",
                "collegeName": "Tech College",
                "attendanceRate": 85.5,
                "attendanceRequired": 80.0,
                "attendanceMet": True,
                "sessionsCompleted": 10,
                "totalSessions": 10,
                "allSessionsFinished": True,
                "isEligible": True,
                "issued": False,
                "certificateNumber": None,
            }
        ]

        try:
            with pytest.MonkeyPatch.context() as mp:
                mp.setattr(
                    "backend.app.api.v1.endpoints.certificates.calculate_student_certificate_eligibility",
                    lambda db, student_id: mock_certs,
                )
                response = client.get("/api/v1/certificates/me/eligibility")
                assert response.status_code == 200
                data = response.json()
                assert len(data["certificates"]) == 1
                assert data["certificates"][0]["isEligible"] is True
        finally:
            app.dependency_overrides.clear()

    def test_invalid_payload_returns_422(self, client, mock_db):
        super_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="admin@test.com",
            full_name="Admin",
        )
        app.dependency_overrides[get_current_user] = lambda: super_admin
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            response = client.post("/api/v1/colleges", json={"status": "invalid_status"})
            assert response.status_code == 422
        finally:
            app.dependency_overrides.clear()

    # ==========================================================================
    # CSRF Protection Hardening Tests (POST, PUT, PATCH, DELETE)
    # ==========================================================================

    def test_csrf_cookie_missing_returns_403_on_state_changing_post(self, client):
        cookies = {settings.SESSION_COOKIE_NAME: "active_session_token"}
        response = client.post(
            "/api/v1/colleges",
            cookies=cookies,
            json={"name": "Test College"},
        )
        assert response.status_code == 403
        assert "CSRF protection violation" in response.json()["detail"]

    def test_csrf_header_missing_returns_403_on_state_changing_put(self, client):
        cookies = {
            settings.SESSION_COOKIE_NAME: "active_session_token",
            "csrf_token": "valid_csrf_token_secret_123",
        }
        response = client.put(
            f"/api/v1/colleges/{uuid.uuid4()}",
            cookies=cookies,
            json={"name": "Updated College"},
        )
        assert response.status_code == 403
        assert "X-CSRF-Token request header" in response.json()["detail"]

    def test_csrf_header_missing_returns_403_on_state_changing_patch(self, client):
        cookies = {
            settings.SESSION_COOKIE_NAME: "active_session_token",
            "csrf_token": "valid_csrf_token_secret_123",
        }
        response = client.patch(
            f"/api/v1/colleges/{uuid.uuid4()}/status",
            cookies=cookies,
            json={"status": "inactive"},
        )
        assert response.status_code == 403
        assert "X-CSRF-Token request header" in response.json()["detail"]

    def test_csrf_mismatched_token_returns_403(self, client):
        cookies = {
            settings.SESSION_COOKIE_NAME: "active_session_token",
            "csrf_token": "correct_csrf_secret",
        }
        headers = {"X-CSRF-Token": "tampered_attacker_secret"}
        response = client.post(
            "/api/v1/colleges",
            cookies=cookies,
            headers=headers,
            json={"name": "Test College"},
        )
        assert response.status_code == 403
        assert "does not match session csrf_token" in response.json()["detail"]

    def test_csrf_subdomain_cookie_injection_fails_with_403(self, client):
        """
        Subdomain / cookie injection attack:
        Attacker controls another session or subdomain and injects matching cookie & header,
        but the token is bound to another session token.
        Verification MUST reject the injected token with 403.
        """
        victim_session = "victim_secret_session_token"
        attacker_session = "attacker_controlled_session_token"
        injected_csrf_token = generate_session_csrf_token(attacker_session)

        cookies = {
            settings.SESSION_COOKIE_NAME: victim_session,
            "csrf_token": injected_csrf_token,
        }
        headers = {"X-CSRF-Token": injected_csrf_token}
        response = client.post(
            "/api/v1/colleges",
            cookies=cookies,
            headers=headers,
            json={"name": "Attacker College"},
        )
        assert response.status_code == 403
        assert "Invalid or forged session-bound CSRF token" in response.json()["detail"]

    def test_csrf_valid_signed_session_bound_token_passes_csrf_middleware(self, client, mock_db):
        """
        Legitimate request: matching cookie and header containing a valid signed token
        bound to the active session token passes CSRF middleware.
        """
        session_token = "valid_user_session_token"
        valid_csrf = generate_session_csrf_token(session_token)

        super_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="admin@test.com",
            full_name="Admin",
        )
        app.dependency_overrides[get_current_user] = lambda: super_admin
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_college = MagicMock()
        mock_college.id = uuid.uuid4()
        mock_college.name = "Valid College"
        mock_college.code = "VAL"
        mock_college.status = "active"
        mock_college.city = None
        mock_college.state = None
        mock_college.address = None
        mock_college.pincode = None
        mock_college.logo_url = None
        mock_college.created_at = None
        mock_college.updated_at = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        mock_db.refresh.side_effect = lambda obj: None

        with pytest.MonkeyPatch.context() as mp:
            cookies = {
                settings.SESSION_COOKIE_NAME: session_token,
                "csrf_token": valid_csrf,
            }
            headers = {"X-CSRF-Token": valid_csrf}
            response = client.post(
                "/api/v1/colleges",
                cookies=cookies,
                headers=headers,
                json={"name": "Valid College", "code": "VAL"},
            )
            # Response must NOT be 403 CSRF violation
            assert response.status_code != 403


    def test_non_cookie_bearer_auth_is_exempt_from_csrf_per_documented_policy(self, client, mock_db):
        """
        Requests authenticated via explicit Authorization Bearer header do not use cookies,
        hence standard browser CSRF cross-origin attack vectors do not apply.
        """
        super_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="admin@test.com",
            full_name="Admin",
        )
        app.dependency_overrides[get_current_user] = lambda: super_admin
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_college = MagicMock()
        mock_college.id = uuid.uuid4()
        mock_college.name = "Bearer Created College"
        mock_college.code = "BCC"
        mock_college.status = "active"
        mock_college.city = None
        mock_college.state = None
        mock_college.address = None
        mock_college.pincode = None
        mock_college.logo_url = None
        mock_college.website = None
        mock_college.contact_name = None
        mock_college.contact_email = None
        mock_college.contact_phone = None
        from datetime import datetime, timezone
        mock_college.created_at = datetime.now(timezone.utc)
        mock_college.updated_at = datetime.now(timezone.utc)

        try:
            with pytest.MonkeyPatch.context() as mp:
                mp.setattr(
                    "backend.app.api.v1.endpoints.colleges.create_college",
                    lambda db, payload: mock_college,
                )
                headers = {"Authorization": "Bearer non_cookie_jwt_token_123"}
                response = client.post(
                    "/api/v1/colleges",
                    headers=headers,
                    json={"name": "Bearer Created College", "status": "active"},
                )
                assert response.status_code == 201
        finally:
            app.dependency_overrides.clear()

    # ==========================================================================
    # Student Data & Role Authorization Tests
    # ==========================================================================

    def test_student_role_forbidden_from_listing_students(self, client, mock_db):
        student_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student@univ.edu",
            full_name="Alice Student",
        )
        app.dependency_overrides[get_current_user] = lambda: student_user
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            response = client.get("/api/v1/students")
            assert response.status_code == 403
            assert "Access forbidden for role 'student'" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_student_accessing_another_student_record_returns_403(self, client, mock_db):
        student_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student1@univ.edu",
            full_name="Student 1",
        )
        other_student_id = uuid.uuid4()

        app.dependency_overrides[get_current_user] = lambda: student_user
        app.dependency_overrides[get_db] = lambda: mock_db

        # Mock db finding the other student
        mock_other = Student(id=other_student_id, roll_number="ST-99", full_name="Student 99")
        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_other

        try:
            response = client.get(f"/api/v1/students/{other_student_id}")
            assert response.status_code == 403
            assert "Students may only access their own student records" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_student_attempting_to_mark_attendance_returns_403(self, client, mock_db):
        student_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student@univ.edu",
            full_name="Alice Student",
        )
        app.dependency_overrides[get_current_user] = lambda: student_user
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            payload = {
                "session_id": str(uuid.uuid4()),
                "records": [{"student_id": str(student_user.id), "status": "present"}],
            }
            response = client.post("/api/v1/attendance/mark", json=payload)
            assert response.status_code == 403
            assert "Access forbidden for role 'student'" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_student_accessing_another_student_attendance_summary_returns_403(self, client, mock_db):
        student_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student@univ.edu",
            full_name="Alice Student",
        )
        other_id = uuid.uuid4()
        app.dependency_overrides[get_current_user] = lambda: student_user
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_other = Student(id=other_id, roll_number="ST-02", full_name="Other")
        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_other

        try:
            response = client.get(f"/api/v1/attendance/student/{other_id}/summary")
            assert response.status_code == 403
            assert "Students may only access their own student records" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_student_accessing_another_student_certificate_returns_403(self, client, mock_db):
        student_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student@univ.edu",
            full_name="Alice Student",
        )
        other_id = uuid.uuid4()
        app.dependency_overrides[get_current_user] = lambda: student_user
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_other = Student(id=other_id, roll_number="ST-02", full_name="Other")
        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_other

        try:
            response = client.get(f"/api/v1/certificates/student/{other_id}/eligibility")
            assert response.status_code == 403
            assert "Students may only access their own student records" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_unenrolled_student_accessing_batch_assessments_returns_403(self, client, mock_db):
        student_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student@univ.edu",
            full_name="Alice Student",
        )
        batch_id = uuid.uuid4()
        app.dependency_overrides[get_current_user] = lambda: student_user
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_batch = Batch(id=batch_id, college_id=uuid.uuid4())
        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_batch
        # Student not enrolled
        mock_db.execute.return_value.scalar.return_value = None

        try:
            response = client.get(f"/api/v1/assessments?batch_id={batch_id}")
            assert response.status_code == 403
            assert "Student is not enrolled in this batch" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_login_rate_limiting_enforces_429(self, client, mock_db):
        login_ip_rate_limiter.clear_all()
        login_identifier_rate_limiter.clear_all()
        app.dependency_overrides[get_db] = lambda: mock_db

        # Mock DB returning empty for authenticate_user (failed login)
        mock_db.execute.return_value.mappings.return_value.first.return_value = None

        try:
            # Send 5 failed attempts for test account
            for _ in range(5):
                res = client.post(
                    "/api/v1/auth/login",
                    json={"email": "attacker@spam.com", "password": "wrong_password"},
                )
                assert res.status_code == 401

            # 6th attempt should be blocked by rate limiter with 429
            blocked_res = client.post(
                "/api/v1/auth/login",
                json={"email": "attacker@spam.com", "password": "wrong_password"},
            )
            assert blocked_res.status_code == 429
            assert "Too many login attempts" in blocked_res.json()["detail"]
        finally:
            login_ip_rate_limiter.clear_all()
            login_identifier_rate_limiter.clear_all()
            app.dependency_overrides.clear()

    def test_get_college_cities_super_admin(self, client, mock_db):
        super_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="admin@test.com",
            full_name="Admin",
        )
        app.dependency_overrides[get_current_user] = lambda: super_admin
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_db.execute.return_value.scalars.return_value.all.return_value = ["Chennai", "Coimbatore", "Trichy"]

        try:
            res = client.get("/api/v1/colleges/cities")
            assert res.status_code == 200
            assert res.json() == ["Chennai", "Coimbatore", "Trichy"]
        finally:
            app.dependency_overrides.clear()

    def test_attendance_platform_stats_endpoint(self, client, mock_db):
        super_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="admin@test.com",
            full_name="Admin",
        )
        app.dependency_overrides[get_current_user] = lambda: super_admin
        app.dependency_overrides[get_db] = lambda: mock_db

        mock_db.execute.return_value.mappings.return_value.first.return_value = {
            "total_sessions": 50,
            "total_records": 1000,
            "present_records": 900,
        }

        try:
            res = client.get("/api/v1/attendance/stats")
            assert res.status_code == 200
            data = res.json()
            assert data["totalSessions"] == 50
            assert data["totalRecordsMarked"] == 1000
            assert data["overallAttendanceRate"] == 90.0
        finally:
            app.dependency_overrides.clear()

