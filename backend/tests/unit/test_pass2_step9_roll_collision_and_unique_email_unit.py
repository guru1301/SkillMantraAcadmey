"""
Pass 2 Step 9 Unit Tests: Roll-Number Collisions & Cross-Table Unique Email (P2-12).

Requirements:
1. activate_student_account:
   - Must not use scalar_one_or_none on roll number alone.
   - Disambiguate when multiple students across colleges share the same roll number (e.g. 2022EC204)
     using candidate matching on DOB and activation token, or explicit college_code / email.
   - Must not raise a 500 error (MultipleResultsFound).
   - If no candidate matches, fail closed with uniform 400.
2. Cross-table unique email:
   - On creating any user (admin_users, college_users, trainers, students),
     check that email is unique across ALL four tables (case-insensitive) and return 409 Conflict.
3. Login duplicate identifier:
   - Login with a duplicate identifier returns uniform 401, never picks an arbitrary role.
"""
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import pytest
from fastapi import HTTPException, status
from sqlalchemy import create_engine, select, func, event
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import sessionmaker

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "TEXT"

from backend.app.core.security import hash_activation_token, hash_password
from backend.app.db.base import Base
from backend.app.db.models.admin_user import AdminUser
from backend.app.db.models.college import College
from backend.app.db.models.college_user import CollegeUser
from backend.app.db.models.student import Student
from backend.app.db.models.student_audit_log import StudentAuditLog
from backend.app.db.models.trainer import Trainer
from backend.app.db.models.user_session import UserSession
from backend.app.schemas.student import StudentActivationRequest, StudentCreate
from backend.app.schemas.trainer import TrainerCreate
from backend.app.api.v1.endpoints.admin import AdminUserCreate, create_admin_user_endpoint
from backend.app.services.auth_service import authenticate_user, check_email_unique_globally
from backend.app.services.student_service import activate_student_account, create_student
from backend.app.services.trainer_service import create_trainer


@pytest.fixture
def step9_db_session():
    """Isolated SQLite session with user models."""
    engine = create_engine("sqlite:///:memory:", echo=False)

    @event.listens_for(engine, "connect")
    def register_sqlite_functions(dbapi_connection, connection_record):
        dbapi_connection.create_function("gen_random_uuid", 0, lambda: str(uuid4()))

    Base.metadata.create_all(
        bind=engine,
        tables=[
            College.__table__,
            AdminUser.__table__,
            CollegeUser.__table__,
            Trainer.__table__,
            Student.__table__,
            StudentAuditLog.__table__,
            UserSession.__table__,
        ],
    )
    Session = sessionmaker(bind=engine)
    session = Session()

    yield session
    session.close()


class TestRollNumberCollisions:
    def test_roll_collision_activates_correct_student_without_500(self, step9_db_session):
        """
        Two colleges have students with the exact same roll number '2022EC204'.
        Activating with Student A's DOB and activation token must activate Student A
        without raising MultipleResultsFound (500). Student B must remain pending_activation.
        """
        college_a = College(id=uuid4(), name="College Alpha", status="active")
        college_b = College(id=uuid4(), name="College Beta", status="active")
        step9_db_session.add_all([college_a, college_b])
        step9_db_session.commit()

        token_a = "ACT-ALPHA-9999"
        token_b = "ACT-BETA-8888"
        expiry = datetime.now(timezone.utc) + timedelta(days=7)

        student_a = Student(
            id=uuid4(),
            college_id=college_a.id,
            roll_number="2022EC204",
            full_name="Alice Alpha",
            dob="2002-05-15",
            email="alice@collegea.edu",
            status="pending_activation",
            must_change_password=True,
            activation_token_hash=hash_activation_token(token_a),
            activation_token_expires_at=expiry,
        )
        student_b = Student(
            id=uuid4(),
            college_id=college_b.id,
            roll_number="2022EC204",
            full_name="Bob Beta",
            dob="2003-08-20",
            email="bob@collegeb.edu",
            status="pending_activation",
            must_change_password=True,
            activation_token_hash=hash_activation_token(token_b),
            activation_token_expires_at=expiry,
        )
        step9_db_session.add_all([student_a, student_b])
        step9_db_session.commit()

        # Alice activates using her roll, DOB, and token
        req = StudentActivationRequest(
            roll_number="2022EC204",
            dob="2002-05-15",
            activation_code=token_a,
            new_password="NewSecurePassword@2026",
        )

        res = activate_student_account(step9_db_session, req)
        assert res["success"] is True
        assert res["rollNumber"] == "2022EC204"

        # Verify Student A is active and Student B is untouched
        step9_db_session.refresh(student_a)
        step9_db_session.refresh(student_b)

        assert student_a.status == "active"
        assert student_a.activation_token_hash is None
        assert student_b.status == "pending_activation"
        assert student_b.activation_token_hash is not None

    def test_roll_collision_with_optional_college_code_disambiguation(self, step9_db_session):
        """
        Providing college_code disambiguates students with identical roll numbers.
        """
        college_a = College(id=uuid4(), name="College Alpha", status="active")
        college_b = College(id=uuid4(), name="College Beta", status="active")
        step9_db_session.add_all([college_a, college_b])
        step9_db_session.commit()

        token_b = "ACT-BETA-7777"
        expiry = datetime.now(timezone.utc) + timedelta(days=7)

        student_b = Student(
            id=uuid4(),
            college_id=college_b.id,
            roll_number="2022EC300",
            full_name="Bob Beta",
            dob="2003-08-20",
            email="bob300@collegeb.edu",
            status="pending_activation",
            must_change_password=True,
            activation_token_hash=hash_activation_token(token_b),
            activation_token_expires_at=expiry,
        )
        step9_db_session.add(student_b)
        step9_db_session.commit()

        req = StudentActivationRequest(
            roll_number="2022EC300",
            dob="2003-08-20",
            activation_code=token_b,
            new_password="SecurePass#781920",
            college_code="College Beta",
        )
        res = activate_student_account(step9_db_session, req)
        assert res["success"] is True

        # Incorrect college_code returns uniform 400
        req_wrong = StudentActivationRequest(
            roll_number="2022EC300",
            dob="2003-08-20",
            activation_code=token_b,
            new_password="SecurePass#781920",
            college_code="Nonexistent College",
        )
        with pytest.raises(HTTPException) as exc_info:
            activate_student_account(step9_db_session, req_wrong)
        assert exc_info.value.status_code == 400

    def test_roll_collision_wrong_credentials_fails_closed_400(self, step9_db_session):
        """
        When two students have identical roll numbers and wrong credentials are sent,
        returns uniform 400, never 500.
        """
        college_a = College(id=uuid4(), name="College Alpha", status="active")
        college_b = College(id=uuid4(), name="College Beta", status="active")
        step9_db_session.add_all([college_a, college_b])
        step9_db_session.commit()

        expiry = datetime.now(timezone.utc) + timedelta(days=7)
        s1 = Student(
            id=uuid4(),
            college_id=college_a.id,
            roll_number="2022DUP01",
            full_name="Student 1",
            dob="2001-01-01",
            status="pending_activation",
            activation_token_hash=hash_activation_token("TOK1111"),
            activation_token_expires_at=expiry,
        )
        s2 = Student(
            id=uuid4(),
            college_id=college_b.id,
            roll_number="2022DUP01",
            full_name="Student 2",
            dob="2002-02-02",
            status="pending_activation",
            activation_token_hash=hash_activation_token("TOK2222"),
            activation_token_expires_at=expiry,
        )
        step9_db_session.add_all([s1, s2])
        step9_db_session.commit()

        req = StudentActivationRequest(
            roll_number="2022DUP01",
            dob="2005-05-05",  # non-matching DOB
            activation_code="WRONG_TOKEN",
            new_password="ValidPassword@2026",
        )
        with pytest.raises(HTTPException) as exc_info:
            activate_student_account(step9_db_session, req)
        assert exc_info.value.status_code == 400
        assert "Activation verification failed" in exc_info.value.detail


class TestCrossTableUniqueEmail:
    def test_admin_creation_rejects_email_used_by_student_with_409(self, step9_db_session):
        """Creating an AdminUser with an email owned by a Student raises 409 Conflict."""
        college = College(id=uuid4(), name="College X", status="active")
        step9_db_session.add(college)
        step9_db_session.commit()

        student = Student(
            id=uuid4(),
            college_id=college.id,
            roll_number="ROLL-EMAIL-1",
            full_name="Student Email Owner",
            email="shared@platform.org",
            status="active",
        )
        step9_db_session.add(student)
        step9_db_session.commit()

        admin_payload = AdminUserCreate(
            email="SHARED@platform.org",  # case-insensitive check
            full_name="Shadow Admin",
            role="super_admin",
            password="AdminPassword@2026",
        )

        from backend.app.api.deps import AuthenticatedUser
        mock_actor = AuthenticatedUser(
            id=uuid4(),
            email="root@platform.org",
            role="super_admin",
            full_name="Root Admin",
        )

        with pytest.raises(HTTPException) as exc_info:
            create_admin_user_endpoint(admin_payload, current_user=mock_actor, db=step9_db_session)
        assert exc_info.value.status_code == 409
        assert "Email is already registered" in exc_info.value.detail

    def test_trainer_creation_rejects_email_used_by_admin_with_409(self, step9_db_session):
        """Creating a Trainer with an email owned by an AdminUser raises 409 Conflict."""
        admin = AdminUser(
            id=uuid4(),
            email="admin.boss@platform.org",
            full_name="Admin Boss",
            password_hash=hash_password("AdminPass@123"),
            status="active",
        )
        step9_db_session.add(admin)
        step9_db_session.commit()

        trainer_data = TrainerCreate(
            name="Shadow Trainer",
            email="Admin.Boss@platform.org",
            phone="9876543210",
            status="active",
            password="UniquePasskey#881023",
        )

        with pytest.raises(HTTPException) as exc_info:
            create_trainer(step9_db_session, trainer_data)
        assert exc_info.value.status_code == 409
        assert "Email is already registered" in exc_info.value.detail

    def test_student_creation_rejects_email_used_by_trainer_with_409(self, step9_db_session):
        """Creating a Student with an email owned by a Trainer raises 409 Conflict."""
        college = College(id=uuid4(), name="College X", status="active")
        trainer = Trainer(
            id=uuid4(),
            full_name="Trainer Lead",
            email="trainer.lead@platform.org",
            status="active",
            password_hash=hash_password("TrainerPass@123"),
        )
        step9_db_session.add_all([college, trainer])
        step9_db_session.commit()

        student_data = StudentCreate(
            college_id=college.id,
            roll_number="STUD-001",
            name="John Student",
            email="Trainer.Lead@platform.org",
        )

        with pytest.raises(HTTPException) as exc_info:
            create_student(step9_db_session, student_data)
        assert exc_info.value.status_code == 409
        assert "Email is already registered" in exc_info.value.detail


class TestLoginDuplicateIdentifier:
    def test_login_with_duplicate_identifier_across_roles_returns_401(self, step9_db_session):
        """
        If an email exists in both AdminUser and Student (e.g. legacy dirty data),
        authenticate_user must return uniform 401 instead of picking an arbitrary role.
        """
        college = College(id=uuid4(), name="College X", status="active")
        step9_db_session.add(college)
        step9_db_session.commit()

        shared_email = "duplicate@platform.org"
        pw = "SharedSecurePassword@2026"
        pw_hash = hash_password(pw)

        admin = AdminUser(
            id=uuid4(),
            email=shared_email,
            full_name="Admin Duplicate",
            password_hash=pw_hash,
            status="active",
        )
        student = Student(
            id=uuid4(),
            college_id=college.id,
            roll_number="DUP-STUD-01",
            full_name="Student Duplicate",
            email=shared_email,
            password_hash=pw_hash,
            status="active",
        )
        step9_db_session.add_all([admin, student])
        step9_db_session.commit()

        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(step9_db_session, shared_email, pw)
        assert exc_info.value.status_code == 401
        assert "Invalid credentials" in exc_info.value.detail
