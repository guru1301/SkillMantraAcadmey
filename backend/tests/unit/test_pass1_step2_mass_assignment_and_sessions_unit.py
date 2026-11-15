"""
Pass 1 — Step 2 Unit Tests:
- Shared helper revoke_all_user_sessions(db, user_id, role, except_session_id=None)
- P1-06 (2a): TrainerSelfUpdate vs TrainerAdminUpdate, 422 on forbidden self-update fields,
  session revocation on admin password/status changes
- P1-07 (2b): StudentUpdate removes status & password with extra="forbid"
- P1-08 (2c): POST/DELETE /students/{id}/credentials & /batches/{id}/credentials
  revoke all active user_sessions for affected students and write student_audit_logs
- 2d: POST /students/bulk-enroll preserves existing student's full_name on roll_number
  conflict and reports the conflict
"""
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock
import uuid

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from backend.app.api.deps import AuthenticatedUser
from backend.app.db.models.student_audit_log import StudentAuditLog
from backend.app.db.models.user_session import UserSession
from backend.app.schemas.student import StudentUpdate
from backend.app.api.v1.endpoints.students import (
    assign_single_credentials,
    revoke_single_credentials,
)
from backend.app.api.v1.endpoints.batches import (
    assign_credentials as batch_assign_credentials,
    revoke_credentials as batch_revoke_credentials,
)
from backend.app.api.v1.endpoints.trainers import update_trainer_details
from backend.app.services import student_service, batch_service, trainer_service


def _extract_param_map(stmt, compiled):
    """Extract parameter dict from either text() or SQLAlchemy compiled statement."""
    if hasattr(compiled, "params") and compiled.params:
        return dict(compiled.params)
    if hasattr(stmt, "_bindparams") and stmt._bindparams:
        return {k: v.value for k, v in stmt._bindparams.items()}
    return {}


class _FakeResult:
    def __init__(self, scalar=None, rows=None, mappings_list=None, rowcount=0):
        self._scalar = scalar
        self._rows = rows or []
        self._mappings_list = mappings_list or []
        self.rowcount = rowcount

    def scalar_one_or_none(self):
        return self._scalar

    def fetchall(self):
        return self._rows

    def first(self):
        return self._rows[0] if self._rows else None

    def mappings(self):
        m = MagicMock()
        m.first.return_value = self._mappings_list[0] if self._mappings_list else None
        m.all.return_value = self._mappings_list
        return m


class _StatefulSessionMock:
    """
    Stateful SQLAlchemy Session test double tracking:
    - user_sessions rows (detecting UserSession UPDATE statements + revocations)
    - students / batch_students rows (for credentials & bulk-enroll checks)
    - trainers / college_users (for status/password/trainer update checks)
    - added ORM objects (especially StudentAuditLog)
    """

    def __init__(self):
        self.sessions = []  # List[SimpleNamespace(id, user_id, user_role, revoked_at)]
        self.students = {}  # Dict[UUID, SimpleNamespace]
        self.batch_students = set()  # Set[Tuple[UUID, UUID]] -> (batch_id, student_id)
        self.trainers = {}  # Dict[UUID, SimpleNamespace]
        self.batches = {}  # Dict[UUID, SimpleNamespace]
        self.added = []
        self.executed_sql = []
        self.commits = 0
        self.rollbacks = 0

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1

    def refresh(self, obj):
        if hasattr(obj, "updated_at") and not isinstance(getattr(obj, "updated_at"), datetime):
            obj.updated_at = datetime.now(timezone.utc)
        return obj

    def active_sessions_for(self, user_id, role=None):
        return [
            s
            for s in self.sessions
            if s.user_id == user_id
            and s.revoked_at is None
            and (role is None or s.user_role == role)
        ]

    def execute(self, stmt, params=None):
        params = dict(params or {})
        sql_text = str(stmt)
        sql_lower = sql_text.lower()
        self.executed_sql.append((sql_text, params))

        # Handle SQLAlchemy Core Update/Select compiled statements (e.g., UserSession, Student, Trainer)
        try:
            compiled = stmt.compile()
            compiled_sql = str(compiled).lower()
            compiled_params = _extract_param_map(stmt, compiled)
        except Exception:
            compiled_sql = sql_lower
            compiled_params = params

        # 1. UserSession UPDATE revocation
        if "update user_sessions" in compiled_sql:
            revoked_at_val = None
            target_uid = None
            target_role = None
            excluded_sid = None

            # Parse positional/named bind parameters reliably from where/values
            for k, v in compiled_params.items():
                if k == "revoked_at":
                    revoked_at_val = v
                elif k.startswith("user_id"):
                    target_uid = v
                elif k.startswith("user_role"):
                    target_role = v
                elif k.startswith("id"):
                    excluded_sid = v

            revoked_count = 0
            for s in self.sessions:
                if s.user_id != target_uid:
                    continue
                if s.revoked_at is not None:
                    continue
                if target_role is not None and s.user_role != target_role:
                    continue
                if excluded_sid is not None and s.id == excluded_sid:
                    continue
                s.revoked_at = revoked_at_val or datetime.now(timezone.utc)
                revoked_count += 1
            return _FakeResult(rowcount=revoked_count)

        # 2. verify_batch_access / bulk_enroll Batch ORM query
        if "from batches" in compiled_sql and compiled_sql.strip().startswith("select"):
            bid = compiled_params.get("id_1") or params.get("id") or next(
                (v for k, v in compiled_params.items() if "id" in k and k != "college_id_1"), None
            )
            b = self.batches.get(bid)
            if not b:
                return _FakeResult(scalar=None, rows=[], mappings_list=[])
            return _FakeResult(scalar=b, rows=[(b.college_id,)], mappings_list=[{"college_id": b.college_id}])

        # 3. verify_student_access query
        if "select college_id from students where id" in sql_lower:
            sid = params.get("id")
            st = self.students.get(sid)
            if not st:
                return _FakeResult(rows=[], mappings_list=[])
            return _FakeResult(rows=[(st.college_id,)], mappings_list=[{"college_id": st.college_id}])

        # 4. Select trainer ORM
        if "from trainers" in compiled_sql and compiled_sql.strip().startswith("select"):
            tid = next((v for k, v in compiled_params.items() if "id" in k), None)
            tr = self.trainers.get(tid)
            return _FakeResult(scalar=tr, rows=[tr] if tr else [])

        # 5. Select student ORM or Student rows for credentials
        if "from students" in compiled_sql and compiled_sql.strip().startswith("select"):
            # Could be single student lookup by id or by (college_id, roll_number)
            if "lower(trim(roll_number))" in sql_lower:
                cid = params.get("college_id")
                rn = (params.get("roll_number") or "").strip().lower()
                matched = [
                    st
                    for st in self.students.values()
                    if st.college_id == cid and st.roll_number.strip().lower() == rn
                ]
                if matched:
                    st = matched[0]
                    row = (st.id, st.roll_number, st.full_name, st.college_id)
                    return _FakeResult(
                        scalar=st,
                        rows=[row],
                        mappings_list=[
                            {
                                "id": st.id,
                                "roll_number": st.roll_number,
                                "full_name": st.full_name,
                                "college_id": st.college_id,
                            }
                        ],
                    )
                return _FakeResult(scalar=None, rows=[], mappings_list=[])

            if "batch_students" in compiled_sql:
                bid = params.get("batch_id") or next(iter(compiled_params.values()), None)
                matched = [
                    self.students[sid]
                    for (b_id, sid) in self.batch_students
                    if b_id == bid and sid in self.students
                ]
                return _FakeResult(
                    rows=[(st.id, st.roll_number, st.full_name, st.college_id) for st in matched],
                    mappings_list=[
                        {
                            "id": st.id,
                            "roll_number": st.roll_number,
                            "full_name": st.full_name,
                            "college_id": st.college_id,
                        }
                        for st in matched
                    ],
                )

            sid = params.get("student_id") or next(
                (v for k, v in compiled_params.items() if "id" in k), None
            )
            st = self.students.get(sid)
            return _FakeResult(
                scalar=st,
                rows=[(st.id, st.roll_number, st.full_name, st.college_id)] if st else [],
                mappings_list=[
                    {
                        "id": st.id,
                        "roll_number": st.roll_number,
                        "full_name": st.full_name,
                        "college_id": st.college_id,
                    }
                ]
                if st
                else [],
            )

        # 6. Single/batch student credential updates
        if sql_lower.strip().startswith("update students"):
            if "where id in (select student_id from batch_students" in sql_lower:
                bid = params.get("batch_id")
                affected = [
                    self.students[sid]
                    for (b_id, sid) in self.batch_students
                    if b_id == bid and sid in self.students
                ]
                for st in affected:
                    if "password_hash = null" in sql_lower:
                        st.password_hash = None
                        st.status = "inactive"
                    else:
                        st.password_hash = params.get("hash")
                        st.must_change_password = True
                        st.status = "active"
                return _FakeResult(
                    rows=[(st.id, st.roll_number, st.full_name, st.college_id) for st in affected],
                    rowcount=len(affected),
                )

            sid = params.get("student_id")
            st = self.students.get(sid)
            if not st:
                return _FakeResult(rows=[], rowcount=0)
            if "password_hash = null" in sql_lower:
                st.password_hash = None
                st.status = "inactive"
            else:
                st.password_hash = params.get("hash")
                st.must_change_password = True
                st.status = "active"
            return _FakeResult(
                rows=[(st.id, st.roll_number, st.full_name, st.college_id)],
                rowcount=1,
            )

        # 7. bulk_enroll insert into students
        if "insert into students" in sql_lower:
            cid = params["college_id"]
            rn = params["roll_number"].strip()
            existing = next(
                (
                    st
                    for st in self.students.values()
                    if st.college_id == cid and st.roll_number.strip().lower() == rn.lower()
                ),
                None,
            )
            if existing:
                if "do nothing" in sql_lower:
                    return _FakeResult(rows=[], rowcount=0)
                if "full_name = excluded.full_name" in sql_lower:
                    existing.full_name = params["full_name"]
                return _FakeResult(rows=[(existing.id,)], rowcount=1)

            new_id = uuid.uuid4()
            st = SimpleNamespace(
                id=new_id,
                college_id=cid,
                roll_number=rn,
                full_name=params["full_name"],
                email=params.get("email"),
                phone=params.get("phone"),
                department=params.get("department"),
                status="active",
                password_hash=None,
                must_change_password=False,
            )
            self.students[new_id] = st
            return _FakeResult(rows=[(new_id,)], rowcount=1)

        # 8. insert into batch_students
        if "insert into batch_students" in sql_lower:
            key = (params["batch_id"], params["student_id"])
            if key in self.batch_students:
                return _FakeResult(rows=[], rowcount=0)
            self.batch_students.add(key)
            return _FakeResult(rows=[(uuid.uuid4(),)], rowcount=1)

        # 9. Admin user status / password update on trainers/college_users
        if "update trainers" in compiled_sql or "update college_users" in compiled_sql:
            return _FakeResult(scalar=uuid.uuid4(), rows=[(uuid.uuid4(),)], rowcount=1)

        return _FakeResult()


# ---------------------------------------------------------------------------
# 1. Shared helper: revoke_all_user_sessions
# ---------------------------------------------------------------------------


class TestSharedRevokeAllUserSessions:
    def test_revokes_matching_user_and_role_only(self):
        from backend.app.services.auth_service import revoke_all_user_sessions

        db = _StatefulSessionMock()
        target_uid = uuid.uuid4()
        other_uid = uuid.uuid4()
        s1 = SimpleNamespace(id=uuid.uuid4(), user_id=target_uid, user_role="student", revoked_at=None)
        s2 = SimpleNamespace(id=uuid.uuid4(), user_id=target_uid, user_role="student", revoked_at=None)
        s_diff_role = SimpleNamespace(id=uuid.uuid4(), user_id=target_uid, user_role="trainer", revoked_at=None)
        s_other_user = SimpleNamespace(id=uuid.uuid4(), user_id=other_uid, user_role="student", revoked_at=None)
        db.sessions.extend([s1, s2, s_diff_role, s_other_user])

        revoked_count = revoke_all_user_sessions(db, target_uid, "student")
        assert revoked_count == 2
        assert db.active_sessions_for(target_uid, "student") == []
        assert s_diff_role.revoked_at is None
        assert s_other_user.revoked_at is None

    def test_except_session_id_keeps_current_session_active(self):
        from backend.app.services.auth_service import revoke_all_user_sessions

        db = _StatefulSessionMock()
        uid = uuid.uuid4()
        s_keep = SimpleNamespace(id=uuid.uuid4(), user_id=uid, user_role="trainer", revoked_at=None)
        s_old1 = SimpleNamespace(id=uuid.uuid4(), user_id=uid, user_role="trainer", revoked_at=None)
        s_old2 = SimpleNamespace(id=uuid.uuid4(), user_id=uid, user_role="trainer", revoked_at=None)
        db.sessions.extend([s_keep, s_old1, s_old2])

        revoked_count = revoke_all_user_sessions(db, uid, "trainer", except_session_id=s_keep.id)
        assert revoked_count == 2
        active = db.active_sessions_for(uid, "trainer")
        assert [s.id for s in active] == [s_keep.id]
        assert s_old1.revoked_at is not None
        assert s_old2.revoked_at is not None


# ---------------------------------------------------------------------------
# 2a (P1-06): TrainerSelfUpdate vs TrainerAdminUpdate + session revocation
# ---------------------------------------------------------------------------


class TestP106TrainerUpdateSplit:
    def test_trainer_self_update_schema_allows_profile_fields_and_forbids_privileged_fields(self):
        from backend.app.schemas.trainer import TrainerSelfUpdate, TrainerAdminUpdate

        assert TrainerSelfUpdate is not TrainerAdminUpdate
        valid = TrainerSelfUpdate(full_name="Dr. Asha", phone="9876543210", skills="Python, FastAPI", bio="Mentor")
        assert valid.full_name == "Dr. Asha"

        for forbidden_payload in [
            {"status": "active"},
            {"email": "attacker@evil.com"},
            {"password": "NewPassword123!"},
            {"is_superuser": True},
        ]:
            with pytest.raises(ValidationError):
                TrainerSelfUpdate(**forbidden_payload)

    @pytest.mark.parametrize(
        "forbidden_payload",
        [
            {"status": "active"},
            {"email": "new@college.edu"},
            {"password": "BypassPassword123!"},
            {"role": "super_admin"},
        ],
    )
    def test_trainer_put_own_record_returns_422_on_forbidden_fields(self, forbidden_payload):
        db = _StatefulSessionMock()
        tid = uuid.uuid4()
        db.trainers[tid] = SimpleNamespace(
            id=tid,
            full_name="Trainer Self",
            email="trainer@test.edu",
            phone="111",
            skills="Python",
            status="active",
            password_hash="hash",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            name="Trainer Self",
            bio="Python",
            expertise=["Python"],
        )
        trainer_user = AuthenticatedUser(
            id=tid,
            role="trainer",
            email="trainer@test.edu",
            full_name="Trainer Self",
            status="active",
        )
        with pytest.raises(HTTPException) as exc:
            update_trainer_details(
                trainer_id=tid,
                payload=forbidden_payload,
                current_user=trainer_user,
                db=db,
            )
        assert exc.value.status_code == 422

    def test_trainer_put_own_record_updates_allowed_fields_only(self):
        db = _StatefulSessionMock()
        tid = uuid.uuid4()
        tr = SimpleNamespace(
            id=tid,
            full_name="Old Name",
            email="trainer@test.edu",
            phone="111",
            skills="Python",
            status="active",
            password_hash="hash",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.trainers[tid] = tr
        db.sessions.append(SimpleNamespace(id=uuid.uuid4(), user_id=tid, user_role="trainer", revoked_at=None))

        trainer_user = AuthenticatedUser(
            id=tid,
            role="trainer",
            email="trainer@test.edu",
            full_name="Old Name",
            status="active",
        )
        res = update_trainer_details(
            trainer_id=tid,
            payload={"full_name": "New Name", "phone": "9998887776", "skills": "Python, Docker"},
            current_user=trainer_user,
            db=db,
        )
        assert tr.full_name == "New Name"
        assert tr.phone == "9998887776"
        assert tr.skills == "Python, Docker"
        # Normal self-profile update must NOT revoke own active session
        assert len(db.active_sessions_for(tid, "trainer")) == 1
        assert res.name == "New Name"

    def test_admin_status_or_password_change_on_trainer_revokes_all_sessions(self):
        for payload in [{"status": "inactive"}, {"password": "AdminResetPassword123!"}]:
            db = _StatefulSessionMock()
            tid = uuid.uuid4()
            tr = SimpleNamespace(
                id=tid,
                full_name="Trainer Target",
                email="trainer@test.edu",
                phone="111",
                skills="Python",
                status="active",
                password_hash="old_hash",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db.trainers[tid] = tr
            db.sessions.append(SimpleNamespace(id=uuid.uuid4(), user_id=tid, user_role="trainer", revoked_at=None))
            db.sessions.append(SimpleNamespace(id=uuid.uuid4(), user_id=tid, user_role="trainer", revoked_at=None))

            admin_user = AuthenticatedUser(
                id=uuid.uuid4(),
                role="super_admin",
                email="super@admin.edu",
                full_name="Super Admin",
                status="active",
            )
            update_trainer_details(
                trainer_id=tid,
                payload=payload,
                current_user=admin_user,
                db=db,
            )
            assert db.active_sessions_for(tid, "trainer") == []


# ---------------------------------------------------------------------------
# 2b (P1-07): StudentUpdate rejects status & password (extra="forbid")
# ---------------------------------------------------------------------------


class TestP107StudentUpdateForbidsPrivilegedFields:
    @pytest.mark.parametrize(
        "forbidden_payload",
        [
            {"status": "active"},
            {"status": "inactive"},
            {"password": "NewPassword123!"},
            {"password_hash": "raw"},
            {"college_id": str(uuid.uuid4())},
        ],
    )
    def test_student_update_schema_rejects_status_password_and_extras(self, forbidden_payload):
        with pytest.raises(ValidationError):
            StudentUpdate(**forbidden_payload)

    def test_student_update_allows_legitimate_profile_fields(self):
        parsed = StudentUpdate(name="Aarav Sharma", phone="9876501234", department="CSE")
        assert parsed.name == "Aarav Sharma"
        assert "status" not in parsed.model_dump()
        assert "password" not in parsed.model_dump()


# ---------------------------------------------------------------------------
# 2c (P1-08): Student & Batch Credentials revoke sessions + write audit logs
# ---------------------------------------------------------------------------


class TestP108CredentialsSessionRevocationAndAuditLogs:
    def _seed_student_and_batch(self):
        db = _StatefulSessionMock()
        cid = uuid.uuid4()
        bid = uuid.uuid4()
        s1_id = uuid.uuid4()
        s2_id = uuid.uuid4()
        unrelated_id = uuid.uuid4()

        db.batches[bid] = SimpleNamespace(id=bid, college_id=cid)
        db.students[s1_id] = SimpleNamespace(
            id=s1_id,
            college_id=cid,
            roll_number="RN001",
            full_name="Student One",
            status="active",
            password_hash="old1",
            must_change_password=False,
        )
        db.students[s2_id] = SimpleNamespace(
            id=s2_id,
            college_id=cid,
            roll_number="RN002",
            full_name="Student Two",
            status="active",
            password_hash="old2",
            must_change_password=False,
        )
        db.students[unrelated_id] = SimpleNamespace(
            id=unrelated_id,
            college_id=cid,
            roll_number="RN999",
            full_name="Other Student",
            status="active",
            password_hash="keep",
            must_change_password=False,
        )
        db.batch_students.add((bid, s1_id))
        db.batch_students.add((bid, s2_id))

        db.sessions.extend([
            SimpleNamespace(id=uuid.uuid4(), user_id=s1_id, user_role="student", revoked_at=None),
            SimpleNamespace(id=uuid.uuid4(), user_id=s1_id, user_role="student", revoked_at=None),
            SimpleNamespace(id=uuid.uuid4(), user_id=s2_id, user_role="student", revoked_at=None),
            SimpleNamespace(id=uuid.uuid4(), user_id=unrelated_id, user_role="student", revoked_at=None),
        ])
        admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="cadmin@test.edu",
            full_name="College Admin",
            college_id=cid,
            status="active",
        )
        return db, bid, s1_id, s2_id, unrelated_id, admin

    def test_post_single_student_credentials_revokes_sessions_and_logs_audit(self):
        db, _, s1_id, _, unrelated_id, admin = self._seed_student_and_batch()
        assign_single_credentials(student_id=s1_id, password=None, current_user=admin, db=db)

        assert db.active_sessions_for(s1_id, "student") == []
        assert len(db.active_sessions_for(unrelated_id, "student")) == 1
        audit_logs = [o for o in db.added if isinstance(o, StudentAuditLog)]
        assert len(audit_logs) == 1
        assert audit_logs[0].student_id == s1_id
        assert audit_logs[0].actor_id == admin.id

    def test_delete_single_student_credentials_revokes_sessions_and_logs_audit(self):
        db, _, s1_id, _, unrelated_id, admin = self._seed_student_and_batch()
        revoke_single_credentials(student_id=s1_id, current_user=admin, db=db)

        assert db.active_sessions_for(s1_id, "student") == []
        assert len(db.active_sessions_for(unrelated_id, "student")) == 1
        audit_logs = [o for o in db.added if isinstance(o, StudentAuditLog)]
        assert len(audit_logs) == 1
        assert audit_logs[0].student_id == s1_id
        assert audit_logs[0].actor_id == admin.id

    def test_post_batch_credentials_revokes_all_batch_student_sessions_and_logs_audit(self):
        db, bid, s1_id, s2_id, unrelated_id, admin = self._seed_student_and_batch()
        batch_assign_credentials(batch_id=bid, password=None, current_user=admin, db=db)

        assert db.active_sessions_for(s1_id, "student") == []
        assert db.active_sessions_for(s2_id, "student") == []
        assert len(db.active_sessions_for(unrelated_id, "student")) == 1
        audit_logs = [o for o in db.added if isinstance(o, StudentAuditLog)]
        assert {log.student_id for log in audit_logs} == {s1_id, s2_id}

    def test_delete_batch_credentials_revokes_all_batch_student_sessions_and_logs_audit(self):
        db, bid, s1_id, s2_id, unrelated_id, admin = self._seed_student_and_batch()
        batch_revoke_credentials(batch_id=bid, current_user=admin, db=db)

        assert db.active_sessions_for(s1_id, "student") == []
        assert db.active_sessions_for(s2_id, "student") == []
        assert len(db.active_sessions_for(unrelated_id, "student")) == 1
        audit_logs = [o for o in db.added if isinstance(o, StudentAuditLog)]
        assert {log.student_id for log in audit_logs} == {s1_id, s2_id}


# ---------------------------------------------------------------------------
# 2d: POST /students/bulk-enroll roll-number conflict preserves existing name
# ---------------------------------------------------------------------------


class TestBulkEnrollRollConflictPreservesFullName:
    def test_bulk_enroll_does_not_overwrite_existing_full_name_and_reports_conflict(self):
        from backend.app.schemas.student import BulkStudentItem

        db = _StatefulSessionMock()
        cid = uuid.uuid4()
        bid = uuid.uuid4()
        existing_id = uuid.uuid4()
        db.batches[bid] = SimpleNamespace(id=bid, college_id=cid)
        db.students[existing_id] = SimpleNamespace(
            id=existing_id,
            college_id=cid,
            roll_number="22CS001",
            full_name="Original Priya Nair",
            email="priya.original@college.edu",
            phone="9000000001",
            department="CSE",
            status="active",
        )

        items = [
            BulkStudentItem(
                rollNumber="22cs001",  # Case-insensitive conflict on trimmed roll_number
                fullName="Overwritten Name Attempt",
                email="hijack@evil.com",
                phone="1111111111",
                department="ECE",
            ),
            BulkStudentItem(
                rollNumber="22CS002",
                fullName="Brand New Arjun",
                email="arjun@college.edu",
            ),
        ]

        result = student_service.bulk_enroll_students(
            db=db,
            batch_id=bid,
            enforced_college_id=cid,
            students=items,
        )

        # Existing student's full_name & other profile fields MUST remain untouched
        assert db.students[existing_id].full_name == "Original Priya Nair"
        assert db.students[existing_id].email == "priya.original@college.edu"
        assert db.students[existing_id].department == "CSE"

        # Existing student is still enrolled into target batch, alongside new student
        enrolled_student_ids = {sid for (b_id, sid) in db.batch_students if b_id == bid}
        assert existing_id in enrolled_student_ids
        assert len(enrolled_student_ids) == 2

        assert result["totalProcessed"] == 2
        assert result["newlyEnrolled"] == 2
        assert len(result.get("conflicts", [])) == 1
        conflict = result["conflicts"][0]
        assert conflict["rollNumber"].upper() == "22CS001"
        assert conflict["existingFullName"] == "Original Priya Nair"
        assert conflict["submittedFullName"] == "Overwritten Name Attempt"

        # Ensure executed SQL never contains full_name = EXCLUDED.full_name
        assert not any("full_name = excluded.full_name" in sql.lower() for sql, _ in db.executed_sql)


class TestSharedSessionRevocationReuseAcrossEndpoints:
    def test_admin_status_deactivation_and_password_reset_leave_zero_active_sessions(self):
        from backend.app.api.v1.endpoints.admin import (
            AdminUserResetPassword,
            AdminUserStatusUpdate,
            reset_user_password_endpoint,
            update_user_status_endpoint,
        )

        db = MagicMock()
        target_id = uuid.uuid4()
        college_user = SimpleNamespace(id=target_id, status="active", password_hash="old", updated_at=None)
        db.execute.side_effect = [
            _FakeResult(scalar=None),          # AdminUser not found
            _FakeResult(scalar=college_user),  # CollegeUser found
            _FakeResult(rowcount=2),           # revoke_all_user_sessions execute
        ]
        super_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="super@admin.edu",
            full_name="Super",
            status="active",
        )
        res_status = update_user_status_endpoint(
            user_id=target_id,
            payload=AdminUserStatusUpdate(status="inactive"),
            current_user=super_admin,
            db=db,
        )
        assert res_status.success is True
        revoke_stmt = db.execute.call_args_list[2][0][0]
        assert "update user_sessions" in str(revoke_stmt.compile()).lower()
        assert db.commit.called

        db2 = MagicMock()
        db2.execute.side_effect = [
            _FakeResult(scalar=None),
            _FakeResult(scalar=college_user),
            _FakeResult(rowcount=3),
        ]
        res_pw = reset_user_password_endpoint(
            user_id=target_id,
            payload=AdminUserResetPassword(password="ResetPass123!"),
            current_user=super_admin,
            db=db2,
        )
        assert res_pw.success is True
        revoke_stmt2 = db2.execute.call_args_list[2][0][0]
        assert "update user_sessions" in str(revoke_stmt2.compile()).lower()
        assert db2.commit.called

    def test_change_user_password_keeps_current_session_and_revokes_others(self):
        from backend.app.core.security import hash_password
        from backend.app.services.auth_service import change_user_password

        db = _StatefulSessionMock()
        uid = uuid.uuid4()
        s_curr = SimpleNamespace(id=uuid.uuid4(), user_id=uid, user_role="trainer", revoked_at=None)
        s_other = SimpleNamespace(id=uuid.uuid4(), user_id=uid, user_role="trainer", revoked_at=None)
        db.sessions.extend([s_curr, s_other])
        db.trainers[uid] = SimpleNamespace(id=uid, password_hash=hash_password("OldPass123!"))

        ok = change_user_password(
            db=db,
            user_id=uid,
            role="trainer",
            current_password="OldPass123!",
            new_password="BrandNewPassword99!",
            except_session_id=s_curr.id,
        )
        assert ok is True
        assert [s.id for s in db.active_sessions_for(uid, "trainer")] == [s_curr.id]
        assert s_other.revoked_at is not None
