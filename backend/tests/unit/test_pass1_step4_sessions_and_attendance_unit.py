"""
Pass 1 — Step 4 Unit Tests: Sessions & Attendance Integrity
- 4a (P1-11): create_training_session and update_training_session validate that any
  supplied trainer_id exists, is active, and is assigned to the batch in batch_trainers.
- 4b: GET /attendance/live-roster returns 403 (not 200 empty) for unassigned trainers
  and cross-college college_admins, and works for assigned trainers, owning college_admin,
  and super_admin.
- 4c: SessionAttendance model + unapplied Alembic migration 0009 add marked_by_id,
  marked_by_role, and updated_at; /attendance/mark and /attendance/live-save record them;
  only super_admin may edit attendance older than 7 days.
"""
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock
import uuid

import pytest
from fastapi import HTTPException

from backend.app.api.deps import AuthenticatedUser
from backend.app.api.v1.endpoints.attendance import (
    get_live_roster,
    mark_session_attendance,
    save_live_roster_attendance,
)
from backend.app.db.models.session_attendance import SessionAttendance
from backend.app.db.models.training_session import TrainingSession
from backend.app.schemas.attendance import AttendanceMarkItem, BulkAttendanceMarkRequest
from backend.app.schemas.session import TrainingSessionCreate, TrainingSessionUpdate
from backend.app.services.session_attendance_service import (
    create_training_session,
    get_trainer_batch_live_roster,
    record_bulk_attendance,
    save_live_batch_attendance,
    update_training_session,
)

REPO_ROOT = Path(__file__).resolve().parents[3]


def _extract_param_map(stmt, compiled):
    if hasattr(compiled, "params") and compiled.params:
        return dict(compiled.params)
    if hasattr(stmt, "_bindparams") and stmt._bindparams:
        return {k: v.value for k, v in stmt._bindparams.items()}
    return {}


class _FakeResult:
    def __init__(self, scalar=None, rows=None, mappings_list=None, scalars_list=None):
        self._scalar = scalar
        self._rows = rows or []
        self._mappings_list = mappings_list or []
        self._scalars_list = scalars_list if scalars_list is not None else []

    def scalar_one_or_none(self):
        return self._scalar

    def scalar(self):
        if self._scalar is not None:
            return self._scalar
        if self._rows:
            r = self._rows[0]
            return r[0] if isinstance(r, tuple) else r
        return None

    def scalars(self):
        m = MagicMock()
        m.all.return_value = self._scalars_list
        return m

    def mappings(self):
        m = MagicMock()
        m.first.return_value = self._mappings_list[0] if self._mappings_list else None
        m.all.return_value = self._mappings_list
        return m


class _AttendanceWorldDB:
    """In-memory DB test double covering batches, trainers, sessions, and session_attendance."""

    def __init__(self):
        self.college_a = uuid.uuid4()
        self.college_b = uuid.uuid4()
        self.batch_a = SimpleNamespace(id=uuid.uuid4(), college_id=self.college_a, code="B-A1")

        self.active_assigned_trainer = SimpleNamespace(
            id=uuid.uuid4(), status="active", full_name="Assigned Trainer"
        )
        self.inactive_trainer = SimpleNamespace(
            id=uuid.uuid4(), status="inactive", full_name="Inactive Trainer"
        )
        self.active_unassigned_trainer = SimpleNamespace(
            id=uuid.uuid4(), status="active", full_name="Unassigned Trainer"
        )
        self.trainers = {
            self.active_assigned_trainer.id: self.active_assigned_trainer,
            self.inactive_trainer.id: self.inactive_trainer,
            self.active_unassigned_trainer.id: self.active_unassigned_trainer,
        }
        self.batch_trainers = {(self.batch_a.id, self.active_assigned_trainer.id)}
        self.student_1 = SimpleNamespace(
            id=uuid.uuid4(),
            roll_number="RN01",
            full_name="Student One",
            email="s1@college.edu",
            department="CSE",
            phone="999",
        )
        self.batch_students = {(self.batch_a.id, self.student_1.id)}
        self.sessions = {}
        self.attendance_rows = {}  # (session_id, student_id) -> dict
        self.executed = []
        self.commits = 0

    def add(self, obj):
        if isinstance(obj, TrainingSession):
            if getattr(obj, "id", None) is None:
                obj.id = uuid.uuid4()
            now = datetime.now(timezone.utc)
            if getattr(obj, "created_at", None) is None:
                obj.created_at = now
            obj.updated_at = now
            self.sessions[obj.id] = obj

    def flush(self):
        pass

    def commit(self):
        self.commits += 1

    def refresh(self, obj):
        now = datetime.now(timezone.utc)
        if hasattr(obj, "created_at") and not isinstance(getattr(obj, "created_at"), datetime):
            obj.created_at = now
        if hasattr(obj, "updated_at") and not isinstance(getattr(obj, "updated_at"), datetime):
            obj.updated_at = now
        return obj

    def execute(self, stmt, params=None):
        params = dict(params or {})
        sql_text = str(stmt)
        sql_lower = sql_text.lower()
        self.executed.append((sql_text, params))

        try:
            compiled = stmt.compile()
            compiled_sql = str(compiled).lower()
            compiled_params = _extract_param_map(stmt, compiled)
        except Exception:
            compiled_sql = sql_lower
            compiled_params = params

        # BatchTrainer assignment check (raw SQL in deps or ORM select)
        if "from batch_trainers" in sql_lower or "from batch_trainers" in compiled_sql:
            vals = list(compiled_params.values()) if compiled_params else [params.get("b"), params.get("t")]
            b_val = params.get("b") or compiled_params.get("batch_id_1")
            t_val = params.get("t") or compiled_params.get("trainer_id_1")
            if b_val is None and len(vals) >= 2:
                b_val, t_val = vals[0], vals[1]
            assigned = (b_val, t_val) in self.batch_trainers
            return _FakeResult(scalar=uuid.uuid4() if assigned else None, rows=[(1,)] if assigned else [])

        # BatchStudent enrolled IDs query
        if "from batch_students" in compiled_sql and "select" in compiled_sql and "from batches" not in sql_lower:
            bid = compiled_params.get("batch_id_1") or params.get("batch_id")
            enrolled = [sid for (b_id, sid) in self.batch_students if (bid is None or b_id == bid)]
            if "full_name" in sql_lower:
                roster = [
                    {
                        "student_id": self.student_1.id,
                        "roll_number": self.student_1.roll_number,
                        "full_name": self.student_1.full_name,
                        "email": self.student_1.email,
                        "department": self.student_1.department,
                        "phone": self.student_1.phone,
                        "status": "unmarked",
                        "notes": None,
                    }
                ]
                return _FakeResult(mappings_list=roster)
            return _FakeResult(scalars_list=enrolled)

        # Trainer ORM select
        if "from trainers" in compiled_sql and compiled_sql.strip().startswith("select"):
            tid = compiled_params.get("id_1") or next(iter(compiled_params.values()), None)
            tr = self.trainers.get(tid)
            return _FakeResult(scalar=tr)

        # Live roster batch join query
        if "from batches b" in sql_lower and "join colleges c" in sql_lower:
            bid = params.get("batch_id")
            if bid != self.batch_a.id:
                return _FakeResult(mappings_list=[])
            tid = params.get("trainer_id")
            trainer_filter_in_sql = "bt.trainer_id = :trainer_id" in sql_lower
            if trainer_filter_in_sql and (bid, tid) not in self.batch_trainers:
                # Simulate LEFT JOIN batch_trainers vs required trainer filter:
                # Notice original LEFT JOIN returned the batch row even when trainer wasn't assigned!
                return _FakeResult(
                    mappings_list=[
                        {
                            "id": self.batch_a.id,
                            "code": self.batch_a.code,
                            "batch_code": self.batch_a.code,
                            "college_id": self.college_a,
                            "college_name": "College A",
                            "college_city": "City",
                            "program_id": uuid.uuid4(),
                            "program_name": "Python",
                            "start_date": "2026-01-01",
                            "end_date": "2026-12-31",
                            "target_strength": 30,
                            "status": "active",
                            "role": "faculty",
                            "is_lead": False,
                            "enrolled_count": 1,
                            "today_marked": False,
                        }
                    ]
                )
            return _FakeResult(
                mappings_list=[
                    {
                        "id": self.batch_a.id,
                        "code": self.batch_a.code,
                        "batch_code": self.batch_a.code,
                        "college_id": self.college_a,
                        "college_name": "College A",
                        "college_city": "City",
                        "program_id": uuid.uuid4(),
                        "program_name": "Python",
                        "start_date": "2026-01-01",
                        "end_date": "2026-12-31",
                        "target_strength": 30,
                        "status": "active",
                        "role": "faculty",
                        "is_lead": True,
                        "enrolled_count": 1,
                        "today_marked": False,
                    }
                ]
            )

        # Batch ORM select (verify_batch_access or create_training_session)
        if "from batches" in compiled_sql and compiled_sql.strip().startswith("select"):
            bid = compiled_params.get("id_1") or params.get("id") or next(
                iter(compiled_params.values()), None
            )
            return _FakeResult(scalar=self.batch_a if bid == self.batch_a.id else None)

        # TrainingSession ORM select
        if "from training_sessions" in compiled_sql and compiled_sql.strip().startswith("select"):
            sid = compiled_params.get("id_1")
            if sid is not None:
                return _FakeResult(scalar=self.sessions.get(sid))
            bid = compiled_params.get("batch_id_1")
            dt = compiled_params.get("date_1")
            matched = next(
                (s for s in self.sessions.values() if s.batch_id == bid and str(s.date) == str(dt)),
                None,
            )
            return _FakeResult(scalar=matched)

        # Live roster session query
        if "from training_sessions" in sql_lower and "date = cast" in sql_lower:
            return _FakeResult(mappings_list=[])

        # SessionAttendance upsert
        if "insert into session_attendance" in sql_lower:
            key = (params.get("session_id"), params.get("student_id"))
            self.attendance_rows[key] = dict(params)
            return _FakeResult()

        return _FakeResult()


# ---------------------------------------------------------------------------
# 4a (P1-11): Trainer existence, active status & batch assignment on sessions
# ---------------------------------------------------------------------------


class TestStep4aSessionTrainerIntegrity:
    def test_create_training_session_rejects_nonexistent_trainer(self):
        db = _AttendanceWorldDB()
        payload = TrainingSessionCreate(
            batch_id=db.batch_a.id,
            trainer_id=uuid.uuid4(),
            title="Intro Lecture",
            session_date=date.today(),
        )
        with pytest.raises(HTTPException) as exc:
            create_training_session(db, payload)
        assert exc.value.status_code in (400, 403)

    def test_create_training_session_rejects_inactive_trainer(self):
        db = _AttendanceWorldDB()
        payload = TrainingSessionCreate(
            batch_id=db.batch_a.id,
            trainer_id=db.inactive_trainer.id,
            title="Intro Lecture",
            session_date=date.today(),
        )
        with pytest.raises(HTTPException) as exc:
            create_training_session(db, payload)
        assert exc.value.status_code in (400, 403)

    def test_create_training_session_rejects_unassigned_active_trainer(self):
        db = _AttendanceWorldDB()
        payload = TrainingSessionCreate(
            batch_id=db.batch_a.id,
            trainer_id=db.active_unassigned_trainer.id,
            title="Intro Lecture",
            session_date=date.today(),
        )
        with pytest.raises(HTTPException) as exc:
            create_training_session(db, payload)
        assert exc.value.status_code in (400, 403)

    def test_create_and_update_training_session_validate_assigned_active_trainer(self):
        db = _AttendanceWorldDB()
        sess = create_training_session(
            db,
            TrainingSessionCreate(
                batch_id=db.batch_a.id,
                trainer_id=db.active_assigned_trainer.id,
                title="Valid Lecture",
                session_date=date.today(),
            ),
        )
        assert sess.trainer_id == db.active_assigned_trainer.id

        # Update with valid assigned active trainer -> succeeds
        updated_sess = update_training_session(
            db,
            sess.id,
            TrainingSessionUpdate(trainer_id=db.active_assigned_trainer.id, title="Updated Valid Lecture"),
        )
        assert updated_sess is not None
        assert updated_sess.title == "Updated Valid Lecture"
        assert updated_sess.trainer_id == db.active_assigned_trainer.id

        # Update with unassigned active trainer -> 400/403
        with pytest.raises(HTTPException) as exc1:
            update_training_session(
                db,
                sess.id,
                TrainingSessionUpdate(trainer_id=db.active_unassigned_trainer.id),
            )
        assert exc1.value.status_code in (400, 403)

        # Update with inactive trainer -> 400/403
        with pytest.raises(HTTPException) as exc2:
            update_training_session(
                db,
                sess.id,
                TrainingSessionUpdate(trainer_id=db.inactive_trainer.id),
            )
        assert exc2.value.status_code in (400, 403)

        # Update with nonexistent trainer -> 400/403
        with pytest.raises(HTTPException) as exc3:
            update_training_session(
                db,
                sess.id,
                TrainingSessionUpdate(trainer_id=uuid.uuid4()),
            )
        assert exc3.value.status_code in (400, 403)


# ---------------------------------------------------------------------------
# 4b: GET /attendance/live-roster returns 403 on unauthorized callers
# ---------------------------------------------------------------------------


class TestStep4bLiveRosterAccessControl:
    def test_unassigned_trainer_gets_403_not_200_empty(self):
        db = _AttendanceWorldDB()
        unassigned_user = AuthenticatedUser(
            id=db.active_unassigned_trainer.id,
            role="trainer",
            email="other_tr@test.edu",
            full_name="Unassigned Trainer",
            status="active",
        )
        with pytest.raises(HTTPException) as exc:
            get_live_roster(
                batch_id=db.batch_a.id,
                date=date.today().isoformat(),
                current_user=unassigned_user,
                db=db,
            )
        assert exc.value.status_code == 403

        with pytest.raises(HTTPException) as exc_svc:
            get_trainer_batch_live_roster(
                db,
                db.active_unassigned_trainer.id,
                db.batch_a.id,
                date.today().isoformat(),
            )
        assert exc_svc.value.status_code == 403

    def test_cross_college_admin_gets_403_not_200_empty(self):
        db = _AttendanceWorldDB()
        other_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="admin@b.edu",
            full_name="College B Admin",
            college_id=db.college_b,
            status="active",
        )
        with pytest.raises(HTTPException) as exc:
            get_live_roster(
                batch_id=db.batch_a.id,
                date=date.today().isoformat(),
                current_user=other_admin,
                db=db,
            )
        assert exc.value.status_code == 403

    def test_assigned_trainer_owning_college_admin_and_super_admin_succeed(self):
        db = _AttendanceWorldDB()
        today_iso = date.today().isoformat()
        assigned_trainer = AuthenticatedUser(
            id=db.active_assigned_trainer.id,
            role="trainer",
            email="tr@a.edu",
            full_name="Assigned Trainer",
            status="active",
        )
        owning_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="admin@a.edu",
            full_name="College A Admin",
            college_id=db.college_a,
            status="active",
        )
        super_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="super@admin.edu",
            full_name="Super Admin",
            status="active",
        )

        for caller in (assigned_trainer, owning_admin, super_admin):
            res = get_live_roster(
                batch_id=db.batch_a.id,
                date=today_iso,
                current_user=caller,
                db=db,
            )
            assert res["batch"] is not None
            assert len(res["roster"]) == 1


# ---------------------------------------------------------------------------
# 4c: Audit fields on session_attendance, migration 0009, and 7-day lock
# ---------------------------------------------------------------------------


class TestStep4cAttendanceAuditAndSevenDayLock:
    def test_session_attendance_model_and_unapplied_migration_have_audit_columns(self):
        cols = set(SessionAttendance.__table__.columns.keys())
        assert {"marked_by_id", "marked_by_role", "updated_at"}.issubset(cols)

        mig_path = REPO_ROOT / "backend/alembic/versions/0009_add_session_attendance_audit_columns.py"
        assert mig_path.exists()
        mig_text = mig_path.read_text(encoding="utf-8")
        assert "0008_add_pending_review_submission_status" in mig_text
        assert "marked_by_id" in mig_text
        assert "marked_by_role" in mig_text
        assert "updated_at" in mig_text

    def test_mark_and_live_save_record_marked_by_id_role_and_updated_at(self):
        db = _AttendanceWorldDB()
        session_id = uuid.uuid4()
        db.sessions[session_id] = TrainingSession(
            id=session_id,
            batch_id=db.batch_a.id,
            title="Recent Session",
            date=date.today(),
            status="scheduled",
        )
        trainer_user = AuthenticatedUser(
            id=db.active_assigned_trainer.id,
            role="trainer",
            email="tr@a.edu",
            full_name="Assigned Trainer",
            status="active",
        )

        mark_session_attendance(
            payload=BulkAttendanceMarkRequest(
                session_id=session_id,
                records=[AttendanceMarkItem(student_id=db.student_1.id, status="present", remarks="ok")],
            ),
            current_user=trainer_user,
            db=db,
        )
        mark_row = db.attendance_rows[(session_id, db.student_1.id)]
        assert mark_row["marked_by_id"] == trainer_user.id
        assert mark_row["marked_by_role"] == "trainer"
        assert any(
            "marked_by_id" in sql.lower()
            and "marked_by_role" in sql.lower()
            and "updated_at" in sql.lower()
            for sql, _ in db.executed
            if "insert into session_attendance" in sql.lower()
        )

        db.attendance_rows.clear()
        db.executed.clear()
        owning_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="admin@a.edu",
            full_name="College A Admin",
            college_id=db.college_a,
            status="active",
        )
        save_live_roster_attendance(
            payload={
                "batchId": str(db.batch_a.id),
                "date": date.today().isoformat(),
                "title": "Live Session",
                "records": [{"studentId": str(db.student_1.id), "status": "present"}],
            },
            current_user=owning_admin,
            db=db,
        )
        live_rows = list(db.attendance_rows.values())
        assert len(live_rows) == 1
        assert live_rows[0]["marked_by_id"] == owning_admin.id
        assert live_rows[0]["marked_by_role"] == "college_admin"
        assert any(
            "marked_by_id" in sql.lower()
            and "marked_by_role" in sql.lower()
            and "updated_at" in sql.lower()
            for sql, _ in db.executed
            if "insert into session_attendance" in sql.lower()
        )

    def test_only_super_admin_may_edit_attendance_older_than_7_days(self):
        db = _AttendanceWorldDB()
        old_date = (datetime.now(timezone.utc) - timedelta(days=8)).date()
        within_window_date = (datetime.now(timezone.utc) - timedelta(days=7)).date()

        old_session_id = uuid.uuid4()
        db.sessions[old_session_id] = TrainingSession(
            id=old_session_id,
            batch_id=db.batch_a.id,
            title="Old Session",
            date=old_date,
            status="completed",
        )
        window_session_id = uuid.uuid4()
        db.sessions[window_session_id] = TrainingSession(
            id=window_session_id,
            batch_id=db.batch_a.id,
            title="7-Day Boundary Session",
            date=within_window_date,
            status="completed",
        )

        trainer_user = AuthenticatedUser(
            id=db.active_assigned_trainer.id,
            role="trainer",
            email="tr@a.edu",
            full_name="Assigned Trainer",
            status="active",
        )
        owning_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="admin@a.edu",
            full_name="College A Admin",
            college_id=db.college_a,
            status="active",
        )
        super_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="super@admin.edu",
            full_name="Super Admin",
            status="active",
        )

        # /attendance/mark > 7 days old: trainer & college_admin denied (403)
        for non_super in (trainer_user, owning_admin):
            with pytest.raises(HTTPException) as exc:
                mark_session_attendance(
                    payload=BulkAttendanceMarkRequest(
                        session_id=old_session_id,
                        records=[AttendanceMarkItem(student_id=db.student_1.id, status="present")],
                    ),
                    current_user=non_super,
                    db=db,
                )
            assert exc.value.status_code == 403

            with pytest.raises(HTTPException) as exc_live:
                save_live_roster_attendance(
                    payload={
                        "batchId": str(db.batch_a.id),
                        "date": old_date.isoformat(),
                        "title": "Backdated Live Edit",
                        "records": [{"studentId": str(db.student_1.id), "status": "present"}],
                    },
                    current_user=non_super,
                    db=db,
                )
            assert exc_live.value.status_code == 403

        # Boundary: exactly 7 days ago -> still permitted for trainer
        mark_session_attendance(
            payload=BulkAttendanceMarkRequest(
                session_id=window_session_id,
                records=[AttendanceMarkItem(student_id=db.student_1.id, status="present")],
            ),
            current_user=trainer_user,
            db=db,
        )

        # > 7 days old: super_admin allowed on both /attendance/mark and /attendance/live-save
        mark_session_attendance(
            payload=BulkAttendanceMarkRequest(
                session_id=old_session_id,
                records=[AttendanceMarkItem(student_id=db.student_1.id, status="excused")],
            ),
            current_user=super_admin,
            db=db,
        )
        res_live_super = save_live_roster_attendance(
            payload={
                "batchId": str(db.batch_a.id),
                "date": old_date.isoformat(),
                "title": "Super Override",
                "records": [{"studentId": str(db.student_1.id), "status": "excused"}],
            },
            current_user=super_admin,
            db=db,
        )
        assert res_live_super["savedCount"] == 1
        live_saved = db.attendance_rows[(uuid.UUID(res_live_super["sessionId"]), db.student_1.id)]
        assert live_saved["marked_by_id"] == super_admin.id
        assert live_saved["marked_by_role"] == "super_admin"
