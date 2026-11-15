"""
Pass 1 — Step 5 Unit Tests: Role Policy Alignment
Covers backend enforcement for:
- PATCH /batches/{id}/status (college_admin -> 'active' only; 'completed'/'cancelled'/'planned' 403)
- PUT /batches/{id} status field (college_admin -> 'active' only when status supplied; non-status updates ok)
- PATCH /batches/{id}/trainers/{id}/lead (super_admin only; college_admin/trainer -> 403)
- DELETE /batches/{id}/trainers/{id} (super_admin only; college_admin/trainer -> 403)
- POST /trainers/assign-batch (super_admin and college_admin inside own college only)
- POST/PUT/DELETE /assessments (assigned trainer or super_admin only; college_admin -> 403)
- POST /resources (super_admin, owning college_admin, and assigned trainer; unassigned/cross-tenant -> 403)
"""
from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
import uuid

import pytest
from fastapi import HTTPException

from backend.app.api.deps import AuthenticatedUser
from backend.app.api.v1.endpoints.assessments import (
    create_new_assessment,
    delete_existing_assessment,
    edit_assessment,
)
from backend.app.api.v1.endpoints.batches import (
    change_batch_status,
    remove_trainer_from_batch_route,
    set_lead_trainer,
    update_batch_details,
)
from backend.app.api.v1.endpoints.resources import add_resource
from backend.app.api.v1.endpoints.trainers import assign_to_batch
from backend.app.schemas.assessment import AssessmentCreate, AssessmentUpdate
from backend.app.schemas.batch import BatchStatusUpdate, BatchUpdate
from backend.app.schemas.resource import ResourceCreate
from backend.app.schemas.trainer import TrainerBatchAssignmentCreate


def _dep_callables(endpoint_fn):
    """Collect FastAPI Depends callables on an endpoint's inspect signature."""
    import inspect

    sig = inspect.signature(endpoint_fn)
    deps = []
    for p in sig.parameters.values():
        dep = getattr(p.default, "dependency", None)
        if dep is not None:
            deps.append(dep)
    return deps


class _FakeResult:
    def __init__(self, scalar=None, rows=None, rowcount=1):
        self._scalar = scalar
        self._rows = rows or []
        self.rowcount = rowcount

    def scalar_one_or_none(self):
        return self._scalar

    def scalar(self):
        if self._scalar is not None:
            return self._scalar
        return self._rows[0][0] if self._rows else None


def _build_role_world():
    now = datetime.now(timezone.utc)
    college_a = uuid.uuid4()
    college_b = uuid.uuid4()
    batch_a_id = uuid.uuid4()
    batch_b_id = uuid.uuid4()
    program_id = uuid.uuid4()
    trainer_assigned_id = uuid.uuid4()
    trainer_unassigned_id = uuid.uuid4()
    assessment_id = uuid.uuid4()

    batch_a = SimpleNamespace(
        id=batch_a_id,
        college_id=college_a,
        program_id=program_id,
        code="BA-1",
        batch_code="BA-1",
        name="Batch A",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
        target_strength=50,
        status="planned",
        created_at=now,
        updated_at=now,
    )
    batch_b = SimpleNamespace(
        id=batch_b_id,
        college_id=college_b,
        program_id=program_id,
        code="BB-1",
        batch_code="BB-1",
        name="Batch B",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
        target_strength=50,
        status="planned",
        created_at=now,
        updated_at=now,
    )
    assessment = SimpleNamespace(
        id=assessment_id,
        batch_id=batch_a_id,
        title="Quiz 1",
        topic="Basics",
        description=None,
        duration_minutes=30,
        total_marks=10,
        passing_marks=5,
        status="draft",
        start_time=now + timedelta(days=1),
        end_time=now + timedelta(days=2),
        shuffle_questions=False,
        anti_cheat_enabled=True,
        questions=[],
        created_at=now,
        updated_at=now,
    )

    batches = {batch_a_id: batch_a, batch_b_id: batch_b}
    batch_trainers = {(batch_a_id, trainer_assigned_id)}
    assessments = {assessment_id: assessment}

    class _WorldDB:
        def __init__(self):
            self.added = []
            self.commits = 0

        def add(self, obj):
            self.added.append(obj)

        def commit(self):
            self.commits += 1

        def refresh(self, obj):
            if hasattr(obj, "updated_at") and not isinstance(getattr(obj, "updated_at"), datetime):
                obj.updated_at = datetime.now(timezone.utc)
            return obj

        def execute(self, stmt, params=None):
            params = dict(params or {})
            sql = str(stmt).lower()
            try:
                compiled = stmt.compile()
                compiled_sql = str(compiled).lower()
                cparams = dict(getattr(compiled, "params", {}) or {})
            except Exception:
                compiled_sql = sql
                cparams = params

            if "from batch_trainers" in sql or "from batch_trainers" in compiled_sql:
                b = params.get("b") or cparams.get("batch_id_1")
                t = params.get("t") or cparams.get("trainer_id_1")
                return _FakeResult(scalar=1 if (b, t) in batch_trainers else None)

            if "from assessments" in compiled_sql and "select" in compiled_sql:
                aid = cparams.get("id_1") or next(iter(cparams.values()), None)
                return _FakeResult(scalar=assessments.get(aid))

            if "from batches" in compiled_sql and "select" in compiled_sql:
                bid = cparams.get("id_1") or params.get("id") or next(iter(cparams.values()), None)
                return _FakeResult(scalar=batches.get(bid))

            return _FakeResult()

    users = {
        "super_admin": AuthenticatedUser(
            id=uuid.uuid4(), role="super_admin", email="super@test.edu", full_name="Super Admin", status="active"
        ),
        "college_admin_a": AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="a@test.edu",
            full_name="College A Admin",
            college_id=college_a,
            status="active",
        ),
        "college_admin_b": AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="b@test.edu",
            full_name="College B Admin",
            college_id=college_b,
            status="active",
        ),
        "trainer_assigned": AuthenticatedUser(
            id=trainer_assigned_id, role="trainer", email="tr1@test.edu", full_name="Assigned Trainer", status="active"
        ),
        "trainer_unassigned": AuthenticatedUser(
            id=trainer_unassigned_id, role="trainer", email="tr2@test.edu", full_name="Unassigned Trainer", status="active"
        ),
    }

    return _WorldDB(), users, batch_a, batch_b, assessment


class TestStep5BatchStatusRoles:
    @pytest.mark.parametrize("restricted_status", ["completed", "cancelled", "planned"])
    def test_patch_batch_status_blocks_college_admin_for_non_active(self, restricted_status):
        db, users, batch_a, _, _ = _build_role_world()
        with pytest.raises(HTTPException) as exc:
            change_batch_status(
                batch_id=batch_a.id,
                payload=BatchStatusUpdate(status=restricted_status),
                current_user=users["college_admin_a"],
                db=db,
            )
        assert exc.value.status_code == 403

    def test_patch_batch_status_allows_college_admin_active_only_and_super_admin_all(self):
        db, users, batch_a, _, _ = _build_role_world()
        with patch("backend.app.api.v1.endpoints.batches.set_batch_status", return_value=True) as mock_set:
            res = change_batch_status(
                batch_id=batch_a.id,
                payload=BatchStatusUpdate(status="active"),
                current_user=users["college_admin_a"],
                db=db,
            )
            assert res.success is True
            mock_set.assert_called_once()

            for st in ("planned", "active", "completed", "cancelled"):
                res2 = change_batch_status(
                    batch_id=batch_a.id,
                    payload=BatchStatusUpdate(status=st),
                    current_user=users["super_admin"],
                    db=db,
                )
                assert res2.success is True

    @pytest.mark.parametrize("restricted_status", ["completed", "cancelled", "planned"])
    def test_put_batch_blocks_college_admin_setting_non_active_status(self, restricted_status):
        db, users, batch_a, _, _ = _build_role_world()
        with pytest.raises(HTTPException) as exc:
            update_batch_details(
                batch_id=batch_a.id,
                payload=BatchUpdate(status=restricted_status),
                current_user=users["college_admin_a"],
                db=db,
            )
        assert exc.value.status_code == 403

    def test_put_batch_allows_college_admin_active_or_non_status_fields_and_super_admin_all(self):
        db, users, batch_a, _, _ = _build_role_world()
        with patch("backend.app.api.v1.endpoints.batches.update_batch", return_value=batch_a):
            # Non-status edit by owning college_admin
            res_non_status = update_batch_details(
                batch_id=batch_a.id,
                payload=BatchUpdate(target_strength=75),
                current_user=users["college_admin_a"],
                db=db,
            )
            assert res_non_status.id == batch_a.id

            # Moving status to active by owning college_admin
            res_active = update_batch_details(
                batch_id=batch_a.id,
                payload=BatchUpdate(status="active"),
                current_user=users["college_admin_a"],
                db=db,
            )
            assert res_active.id == batch_a.id

            # Super admin setting completed
            res_super = update_batch_details(
                batch_id=batch_a.id,
                payload=BatchUpdate(status="completed"),
                current_user=users["super_admin"],
                db=db,
            )
            assert res_super.id == batch_a.id


class TestStep5BatchTrainerLeadAndRemovalRoles:
    def test_set_lead_trainer_and_remove_trainer_require_super_admin_only(self):
        from backend.app.api.deps import require_super_admin

        assert require_super_admin in _dep_callables(set_lead_trainer)
        assert require_super_admin in _dep_callables(remove_trainer_from_batch_route)

        db, users, batch_a, _, _ = _build_role_world()
        for non_super in (users["college_admin_a"], users["trainer_assigned"]):
            with pytest.raises(HTTPException) as exc1:
                set_lead_trainer(
                    batch_id=batch_a.id,
                    trainer_id=users["trainer_assigned"].id,
                    current_user=non_super,
                    db=db,
                )
            assert exc1.value.status_code == 403

            with pytest.raises(HTTPException) as exc2:
                remove_trainer_from_batch_route(
                    batch_id=batch_a.id,
                    trainer_id=users["trainer_assigned"].id,
                    current_user=non_super,
                    db=db,
                )
            assert exc2.value.status_code == 403

        with patch("backend.app.api.v1.endpoints.batches.set_batch_lead_trainer", return_value=True), patch(
            "backend.app.api.v1.endpoints.batches.remove_trainer_from_batch", return_value=True
        ):
            assert (
                set_lead_trainer(batch_a.id, users["trainer_assigned"].id, current_user=users["super_admin"], db=db).success
                is True
            )
            assert (
                remove_trainer_from_batch_route(
                    batch_a.id, users["trainer_assigned"].id, current_user=users["super_admin"], db=db
                ).success
                is True
            )

    def test_assign_batch_allows_owning_college_admin_and_blocks_cross_college(self):
        db, users, batch_a, batch_b, _ = _build_role_world()
        assignment_mock = SimpleNamespace(
            id=uuid.uuid4(),
            batch_id=batch_a.id,
            trainer_id=users["trainer_assigned"].id,
            role="Trainer",
            is_lead=False,
        )
        payload = TrainerBatchAssignmentCreate(trainer_id=users["trainer_assigned"].id, is_lead=False, role="Trainer")

        with pytest.raises(HTTPException) as exc:
            assign_to_batch(
                payload=payload,
                batch_id=batch_b.id,
                current_user=users["college_admin_a"],
                db=db,
            )
        assert exc.value.status_code == 403

        with patch("backend.app.api.v1.endpoints.trainers.assign_trainer_to_batch", return_value=assignment_mock):
            res = assign_to_batch(
                payload=payload,
                batch_id=batch_a.id,
                current_user=users["college_admin_a"],
                db=db,
            )
            assert res["success"] is True


class TestStep5AssessmentAndResourceRoles:
    def test_assessments_create_edit_delete_deny_college_admin_and_unassigned_trainer(self):
        db, users, batch_a, _, assessment = _build_role_world()
        create_payload = AssessmentCreate(
            batch_id=batch_a.id,
            title="Midterm Quiz",
            duration_minutes=30,
            total_marks=10,
            passing_marks=5,
            questions=[
                {"id": "q1", "question": "2+2?", "options": ["3", "4"], "correctOptionIndex": 1}
            ],
        )
        update_payload = AssessmentUpdate(title="Updated Title")

        # college_admin must get 403 on POST, PUT, DELETE /assessments (even in own college)
        with patch("backend.app.api.v1.endpoints.assessments.AssessmentResponse.model_validate", return_value=assessment):
            with pytest.raises(HTTPException) as e_create:
                create_new_assessment(create_payload, current_user=users["college_admin_a"], db=db)
            assert e_create.value.status_code == 403

            with pytest.raises(HTTPException) as e_edit:
                edit_assessment(assessment.id, update_payload, current_user=users["college_admin_a"], db=db)
            assert e_edit.value.status_code == 403

            with pytest.raises(HTTPException) as e_del:
                delete_existing_assessment(assessment.id, current_user=users["college_admin_a"], db=db)
            assert e_del.value.status_code == 403

        # Unassigned trainer must get 403 on all three
        with pytest.raises(HTTPException) as e_t_create:
            create_new_assessment(create_payload, current_user=users["trainer_unassigned"], db=db)
        assert e_t_create.value.status_code == 403

        with pytest.raises(HTTPException) as e_t_edit:
            edit_assessment(assessment.id, update_payload, current_user=users["trainer_unassigned"], db=db)
        assert e_t_edit.value.status_code == 403

        with pytest.raises(HTTPException) as e_t_del:
            delete_existing_assessment(assessment.id, current_user=users["trainer_unassigned"], db=db)
        assert e_t_del.value.status_code == 403

        # Assigned trainer and super_admin succeed
        with patch("backend.app.api.v1.endpoints.assessments.create_assessment", return_value=assessment), patch(
            "backend.app.api.v1.endpoints.assessments.update_assessment", return_value=assessment
        ), patch("backend.app.api.v1.endpoints.assessments.delete_assessment", return_value=True), patch(
            "backend.app.api.v1.endpoints.assessments.AssessmentResponse.model_validate", return_value=assessment
        ):
            for allowed in (users["trainer_assigned"], users["super_admin"]):
                assert create_new_assessment(create_payload, current_user=allowed, db=db).id == assessment.id
                assert edit_assessment(assessment.id, update_payload, current_user=allowed, db=db).id == assessment.id
                assert delete_existing_assessment(assessment.id, current_user=allowed, db=db).success is True

    def test_post_resources_allows_assigned_staff_and_blocks_cross_tenant_or_unassigned(self):
        db, users, batch_a, batch_b, _ = _build_role_world()
        res_obj = SimpleNamespace(
            id=uuid.uuid4(),
            batch_id=batch_a.id,
            title="Notes",
            description=None,
            type="link",
            url="https://example.com/notes",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        payload_a = ResourceCreate(batch_id=batch_a.id, title="Notes", type="link", url="https://example.com/notes")
        payload_b = ResourceCreate(batch_id=batch_b.id, title="Notes", type="link", url="https://example.com/notes")

        with pytest.raises(HTTPException) as e_unassigned:
            add_resource(payload_a, current_user=users["trainer_unassigned"], db=db)
        assert e_unassigned.value.status_code == 403

        with pytest.raises(HTTPException) as e_cross:
            add_resource(payload_b, current_user=users["college_admin_a"], db=db)
        assert e_cross.value.status_code == 403

        with patch("backend.app.api.v1.endpoints.resources.create_resource", return_value=res_obj), patch(
            "backend.app.api.v1.endpoints.resources.ResourceResponse.model_validate", return_value=res_obj
        ):
            for allowed in (users["super_admin"], users["college_admin_a"], users["trainer_assigned"]):
                created = add_resource(payload_a, current_user=allowed, db=db)
                assert created.id == res_obj.id
