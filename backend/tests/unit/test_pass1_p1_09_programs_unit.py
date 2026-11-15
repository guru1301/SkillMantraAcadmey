"""
Pass 1 — Step 3 (P1-09) Unit Tests: Programs tenant & role scoping.
- GET /programs: college_id allowed only for super_admin and owning college_admin.
  Trainers and students passing another college_id get 403, and otherwise see only
  their own college/batches.
- batches_count in both GET /programs and GET /programs/{id} is scoped to the caller's
  tenant/batches (global count only for super_admin).
"""
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock
import uuid

import pytest
from fastapi import HTTPException

from backend.app.api.deps import AuthenticatedUser
from backend.app.api.v1.endpoints.programs import list_programs, get_program_details


class _MappingResult:
    def __init__(self, rows):
        self._rows = rows

    def mappings(self):
        m = MagicMock()
        m.all.return_value = self._rows
        m.first.return_value = self._rows[0] if self._rows else None
        return m

    def first(self):
        if not self._rows:
            return None
        row = self._rows[0]
        if isinstance(row, dict):
            return tuple(row.values())
        return row

    def scalar_one_or_none(self):
        first = self.first()
        if first is None:
            return None
        return first[0] if isinstance(first, tuple) else first


class _ProgramsWorldDB:
    """
    In-memory multi-tenant programs + batches + batch_trainers + batch_students store
    that interprets program_service SQL queries faithfully by inspecting SQL & bound params.
    """

    def __init__(self):
        now = datetime.now(timezone.utc)
        self.college_a = uuid.uuid4()
        self.college_b = uuid.uuid4()
        self.prog_python_id = uuid.uuid4()
        self.prog_java_id = uuid.uuid4()

        self.programs = {
            self.prog_python_id: {
                "id": self.prog_python_id,
                "name": "Python Full Stack",
                "code": None,
                "description": "Core Python curriculum",
                "duration_days": 60,
                "modules": [],
                "progress_weights": None,
                "status": "active",
                "created_at": now,
                "updated_at": now,
            },
            self.prog_java_id: {
                "id": self.prog_java_id,
                "name": "Java Enterprise",
                "code": None,
                "description": "Core Java curriculum",
                "duration_days": 90,
                "modules": [],
                "progress_weights": None,
                "status": "active",
                "created_at": now,
                "updated_at": now,
            },
        }

        # Python: 2 batches in College A, 3 batches in College B (total 5)
        # Java:   0 batches in College A, 1 batch in College B (total 1)
        self.b_a1 = uuid.uuid4()
        self.b_a2 = uuid.uuid4()
        self.b_b1 = uuid.uuid4()
        self.b_b2 = uuid.uuid4()
        self.b_b3 = uuid.uuid4()
        self.b_java_b1 = uuid.uuid4()

        self.batches = [
            SimpleNamespace(id=self.b_a1, college_id=self.college_a, program_id=self.prog_python_id),
            SimpleNamespace(id=self.b_a2, college_id=self.college_a, program_id=self.prog_python_id),
            SimpleNamespace(id=self.b_b1, college_id=self.college_b, program_id=self.prog_python_id),
            SimpleNamespace(id=self.b_b2, college_id=self.college_b, program_id=self.prog_python_id),
            SimpleNamespace(id=self.b_b3, college_id=self.college_b, program_id=self.prog_python_id),
            SimpleNamespace(id=self.b_java_b1, college_id=self.college_b, program_id=self.prog_java_id),
        ]

        self.trainer_1 = uuid.uuid4()
        self.batch_trainers = {(self.b_a1, self.trainer_1)}

        self.student_1 = uuid.uuid4()  # College A, enrolled in b_a1 & b_a2
        self.student_2 = uuid.uuid4()  # College B, enrolled in b_b1 & b_java_b1
        self.batch_students = {
            (self.b_a1, self.student_1),
            (self.b_a2, self.student_1),
            (self.b_b1, self.student_2),
            (self.b_java_b1, self.student_2),
        }
        self.executed_queries = []

    def _matching_batches(self, program_id, params):
        cid = params.get("college_id")
        tid = params.get("trainer_id")
        sid = params.get("student_id")
        res = []
        for b in self.batches:
            if b.program_id != program_id:
                continue
            if cid is not None and b.college_id != cid:
                continue
            if tid is not None and (b.id, tid) not in self.batch_trainers:
                continue
            if sid is not None and (b.id, sid) not in self.batch_students:
                continue
            res.append(b)
        return res

    def execute(self, stmt, params=None):
        sql = str(stmt)
        sql_lower = sql.lower()
        params = dict(params or {})
        self.executed_queries.append((sql, params))

        # Trainer college-link verification query
        if "from batch_trainers" in sql_lower and "where" in sql_lower and "from programs" not in sql_lower:
            tid = params.get("trainer_id")
            cid = params.get("college_id")
            linked = any(
                (b.id, tid) in self.batch_trainers and (cid is None or b.college_id == cid)
                for b in self.batches
            )
            return _MappingResult([(1,)] if linked else [])

        # Single program lookup (GET /programs/{program_id})
        if "p.id = :program_id" in sql_lower:
            pid = params.get("program_id")
            prog = self.programs.get(pid)
            if not prog:
                return _MappingResult([])
            matched_batches = self._matching_batches(pid, params)
            row = dict(prog)
            row["batches_count"] = len(matched_batches)
            return _MappingResult([row])

        # Programs list lookup (GET /programs)
        if "from programs" in sql_lower:
            status_f = params.get("status_filter")
            requires_batch_scope = any(k in params for k in ("college_id", "trainer_id", "student_id"))
            rows = []
            for pid, prog in self.programs.items():
                if status_f and prog["status"] != status_f:
                    continue
                matched_batches = self._matching_batches(pid, params)
                if requires_batch_scope and len(matched_batches) == 0:
                    continue
                row = dict(prog)
                row["batches_count"] = len(matched_batches)
                rows.append(row)
            rows.sort(key=lambda r: r["name"])
            return _MappingResult(rows)

        return _MappingResult([])


class TestPass1P109ProgramsScopingUnit:
    def test_super_admin_gets_global_counts_and_can_filter_college(self):
        db = _ProgramsWorldDB()
        super_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="super@admin.edu",
            full_name="Super Admin",
            status="active",
        )

        all_progs = list_programs(status=None, college_id=None, current_user=super_admin, db=db)
        counts = {p.name: p.batches_count for p in all_progs}
        assert counts == {"Java Enterprise": 1, "Python Full Stack": 5}

        detail = get_program_details(program_id=db.prog_python_id, current_user=super_admin, db=db)
        assert detail.batches_count == 5

        scoped = list_programs(status=None, college_id=db.college_a, current_user=super_admin, db=db)
        assert [(p.name, p.batches_count) for p in scoped] == [("Python Full Stack", 2)]

    def test_college_admin_counts_differ_by_tenant_and_cross_college_raises_403(self):
        db = _ProgramsWorldDB()
        admin_a = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="a@college.edu",
            full_name="Admin A",
            college_id=db.college_a,
            status="active",
        )
        admin_b = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="b@college.edu",
            full_name="Admin B",
            college_id=db.college_b,
            status="active",
        )

        with pytest.raises(HTTPException) as exc:
            list_programs(status=None, college_id=db.college_b, current_user=admin_a, db=db)
        assert exc.value.status_code == 403

        progs_a = list_programs(status=None, college_id=None, current_user=admin_a, db=db)
        progs_b = list_programs(status=None, college_id=None, current_user=admin_b, db=db)
        assert {p.name: p.batches_count for p in progs_a} == {"Python Full Stack": 2}
        assert {p.name: p.batches_count for p in progs_b} == {
            "Java Enterprise": 1,
            "Python Full Stack": 3,
        }

        detail_a = get_program_details(program_id=db.prog_python_id, current_user=admin_a, db=db)
        detail_b = get_program_details(program_id=db.prog_python_id, current_user=admin_b, db=db)
        assert detail_a.batches_count == 2
        assert detail_b.batches_count == 3

    def test_trainer_passing_other_college_id_gets_403_and_counts_scope_to_assigned_batches(self):
        db = _ProgramsWorldDB()
        trainer = AuthenticatedUser(
            id=db.trainer_1,
            role="trainer",
            email="trainer@academy.edu",
            full_name="Trainer One",
            college_id=None,
            status="active",
        )

        # Passing a college_id where trainer has no batches -> 403
        with pytest.raises(HTTPException) as exc:
            list_programs(status=None, college_id=db.college_b, current_user=trainer, db=db)
        assert exc.value.status_code == 403

        # Unfiltered call -> scoped strictly to trainer's assigned batch (b_a1 only -> count 1, no Java)
        progs = list_programs(status=None, college_id=None, current_user=trainer, db=db)
        assert [(p.name, p.batches_count) for p in progs] == [("Python Full Stack", 1)]

        # Detail view -> batches_count scoped to trainer's assigned batches (1, not global 5)
        detail = get_program_details(program_id=db.prog_python_id, current_user=trainer, db=db)
        assert detail.batches_count == 1
        detail_java = get_program_details(program_id=db.prog_java_id, current_user=trainer, db=db)
        assert detail_java.batches_count == 0

        # Passing an owned college_id does not widen beyond trainer's assigned batches
        progs_same_college = list_programs(status=None, college_id=db.college_a, current_user=trainer, db=db)
        assert [(p.name, p.batches_count) for p in progs_same_college] == [("Python Full Stack", 1)]

    def test_student_passing_other_college_id_gets_403_and_counts_scope_to_own_college_and_batches(self):
        db = _ProgramsWorldDB()
        student_a = AuthenticatedUser(
            id=db.student_1,
            role="student",
            email="s1@collegea.edu",
            full_name="Student One",
            college_id=db.college_a,
            status="active",
        )
        student_b = AuthenticatedUser(
            id=db.student_2,
            role="student",
            email="s2@collegeb.edu",
            full_name="Student Two",
            college_id=db.college_b,
            status="active",
        )

        # Student A passing College B filter -> 403
        with pytest.raises(HTTPException) as exc:
            list_programs(status=None, college_id=db.college_b, current_user=student_a, db=db)
        assert exc.value.status_code == 403

        # Student A & B default list views differ by tenant and count only own enrolled batches
        progs_a = list_programs(status=None, college_id=None, current_user=student_a, db=db)
        progs_b = list_programs(status=None, college_id=None, current_user=student_b, db=db)
        assert {p.name: p.batches_count for p in progs_a} == {"Python Full Stack": 2}
        assert {p.name: p.batches_count for p in progs_b} == {
            "Java Enterprise": 1,
            "Python Full Stack": 1,
        }

        # Passing own college_id stays scoped to student's enrolled batches
        progs_a_same = list_programs(status=None, college_id=db.college_a, current_user=student_a, db=db)
        assert {p.name: p.batches_count for p in progs_a_same} == {"Python Full Stack": 2}

        # Detail view -> batches_count scoped per tenant/enrollment (2 vs 1, not global 5)
        detail_a = get_program_details(program_id=db.prog_python_id, current_user=student_a, db=db)
        detail_b = get_program_details(program_id=db.prog_python_id, current_user=student_b, db=db)
        assert detail_a.batches_count == 2
        assert detail_b.batches_count == 1
        assert any("count(distinct" in sql.lower() for sql, _ in db.executed_queries)
