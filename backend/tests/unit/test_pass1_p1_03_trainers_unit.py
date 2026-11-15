"""
TDD Unit Tests for Step 1 (P1-03 Cross-college trainer data leak):
- GET /trainers scoped to college_admin's college_id (super_admin sees all)
- GET /trainers/available verifies batch access and returns only id, full_name, skills for college_admin (no email/phone)
- GET /trainers/{id} requires college link for college_admin, filters assigned_batches to caller's college,
  allows trainer self-read only, denies students (403)
- POST /trainers/assign-batch rejects inactive trainers
"""
from datetime import datetime, timezone
from unittest.mock import MagicMock
import uuid

from fastapi import HTTPException
import pytest

from backend.app.api.deps import AuthenticatedUser
from backend.app.api.v1.endpoints.trainers import (
    assign_to_batch,
    get_available_trainers,
    get_trainer_details,
    list_trainers,
)
from backend.app.db.models import Batch, BatchTrainer, Trainer
from backend.app.schemas.trainer import TrainerBatchAssignmentCreate


def _make_user(role: str, college_id: uuid.UUID | None = None, user_id: uuid.UUID | None = None) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=user_id or uuid.uuid4(),
        role=role,
        email=f"{role}@test.edu",
        full_name=f"Test {role}",
        college_id=college_id,
    )


class TestPass1P103TrainerIsolationUnit:
    def test_list_trainers_super_admin_unscoped_vs_college_admin_scoped(self):
        college_a = uuid.uuid4()
        super_admin = _make_user("super_admin")
        college_admin_a = _make_user("college_admin", college_id=college_a)

        db_super = MagicMock()
        db_super.execute.return_value.mappings.return_value.all.return_value = []
        list_trainers(
            search=None,
            status=None,
            limit=None,
            offset=None,
            current_user=super_admin,
            db=db_super,
        )
        super_sql = str(db_super.execute.call_args.args[0])
        super_params = db_super.execute.call_args.args[1]
        assert "college_id" not in super_params
        assert "college_id" not in super_sql

        db_college = MagicMock()
        db_college.execute.return_value.mappings.return_value.all.return_value = []
        list_trainers(
            search=None,
            status=None,
            limit=None,
            offset=None,
            current_user=college_admin_a,
            db=db_college,
        )
        college_sql = str(db_college.execute.call_args.args[0])
        college_params = db_college.execute.call_args.args[1]
        assert college_params.get("college_id") == college_a
        assert "b.college_id = :college_id" in college_sql

        # college_admin without college_id -> 403
        college_admin_unbound = _make_user("college_admin", college_id=None)
        with pytest.raises(HTTPException) as exc:
            list_trainers(
                search=None,
                status=None,
                limit=None,
                offset=None,
                current_user=college_admin_unbound,
                db=MagicMock(),
            )
        assert exc.value.status_code == 403

    def test_available_trainers_for_college_admin_verifies_batch_and_returns_minimal_fields_no_pii(self):
        college_a = uuid.uuid4()
        college_b = uuid.uuid4()
        batch_a = Batch(id=uuid.uuid4(), college_id=college_a, code="B-A")
        batch_b = Batch(id=uuid.uuid4(), college_id=college_b, code="B-B")
        college_admin_a = _make_user("college_admin", college_id=college_a)

        # Cross-college batch -> 403
        db_cross = MagicMock()
        db_cross.execute.return_value.scalar_one_or_none.return_value = batch_b
        with pytest.raises(HTTPException) as exc:
            get_available_trainers(batch_id=batch_b.id, current_user=college_admin_a, db=db_cross)
        assert exc.value.status_code == 403

        # Own college batch -> returns only id, full_name, skills (no email, no phone)
        trainer_id = uuid.uuid4()
        db_own = MagicMock()
        db_own.execute.return_value.scalar_one_or_none.return_value = batch_a
        db_own.execute.return_value.mappings.return_value.all.return_value = [
            {
                "id": trainer_id,
                "full_name": "Jane Instructor",
                "skills": "Python, SQL",
            }
        ]
        res = get_available_trainers(batch_id=batch_a.id, current_user=college_admin_a, db=db_own)
        assert len(res) == 1
        dumped = res[0].model_dump()
        assert set(dumped.keys()) == {"id", "full_name", "skills"}
        assert dumped["id"] == trainer_id
        assert dumped["full_name"] == "Jane Instructor"
        assert dumped["skills"] == "Python, SQL"
        assert "email" not in dumped
        assert "phone" not in dumped

        # Verify SQL for college_admin did not even select email or phone columns
        avail_sql = str(db_own.execute.call_args_list[-1].args[0]).lower()
        assert "email" not in avail_sql
        assert "phone" not in avail_sql

        # Super admin receives full TrainerResponse including email/phone
        now = datetime.now(timezone.utc)
        super_admin = _make_user("super_admin")
        db_super_avail = MagicMock()
        db_super_avail.execute.return_value.scalar_one_or_none.return_value = batch_b
        db_super_avail.execute.return_value.mappings.return_value.all.return_value = [
            {
                "id": trainer_id,
                "name": "Jane Instructor",
                "email": "jane@skillthinker.com",
                "phone": "9000011111",
                "skills": "Python, SQL",
                "status": "active",
                "created_at": now,
                "updated_at": now,
            }
        ]
        res_super = get_available_trainers(batch_id=batch_b.id, current_user=super_admin, db=db_super_avail)
        assert len(res_super) == 1
        assert res_super[0].email == "jane@skillthinker.com"

    def test_get_trainer_details_blocks_unlinked_college_admin_and_filters_assigned_batches(self):
        college_a = uuid.uuid4()
        college_b = uuid.uuid4()
        trainer_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        college_admin_a = _make_user("college_admin", college_id=college_a)

        # Case 1: Trainer works ONLY for College B (assigned_batches_count in College A == 0) -> 403
        db_only_b = MagicMock()
        db_only_b.execute.return_value.mappings.return_value.first.return_value = {
            "id": trainer_id,
            "name": "College B Trainer",
            "email": "tb@collegeb.edu",
            "phone": "9999999999",
            "bio": "Java",
            "status": "active",
            "created_at": now,
            "updated_at": now,
            "assigned_batches_count": 0,  # linked to 0 batches in College A
        }
        with pytest.raises(HTTPException) as exc:
            get_trainer_details(trainer_id=trainer_id, current_user=college_admin_a, db=db_only_b)
        assert exc.value.status_code == 403

        # Case 2: Shared trainer (works in A & B) -> SQL filters assigned_batches to college A only
        db_shared = MagicMock()
        db_shared.execute.return_value.mappings.return_value.first.return_value = {
            "id": trainer_id,
            "name": "Shared Trainer",
            "email": "shared@test.edu",
            "phone": "8888888888",
            "bio": "Cloud",
            "status": "active",
            "created_at": now,
            "updated_at": now,
            "assigned_batches_count": 1,
        }
        db_shared.execute.return_value.mappings.return_value.all.return_value = [
            {
                "batch_id": uuid.uuid4(),
                "batch_code": "BATCH-A-01",
                "college_name": "College A",
                "program_name": "Cloud",
                "start_date": "2026-11-01",
                "end_date": "2026-12-01",
                "batch_status": "active",
                "is_lead": True,
                "role": "Lead Trainer",
                "assigned_at": str(now),
            }
        ]
        res = get_trainer_details(trainer_id=trainer_id, current_user=college_admin_a, db=db_shared)
        assert len(res.assigned_batches) == 1
        assert res.assigned_batches[0].college_name == "College A"
        header_sql = str(db_shared.execute.call_args_list[0].args[0])
        header_params = db_shared.execute.call_args_list[0].args[1]
        batches_sql = str(db_shared.execute.call_args_list[1].args[0])
        batches_params = db_shared.execute.call_args_list[1].args[1]
        assert header_params.get("college_id") == college_a
        assert "b.college_id = :college_id" in header_sql
        assert batches_params.get("college_id") == college_a
        assert "b.college_id = :college_id" in batches_sql

        # Case 3: Student denied (403); Trainer cannot view another trainer (403), may view self (200)
        student_user = _make_user("student", college_id=college_a)
        with pytest.raises(HTTPException) as exc_stu:
            get_trainer_details(trainer_id=trainer_id, current_user=student_user, db=MagicMock())
        assert exc_stu.value.status_code == 403

        other_trainer = _make_user("trainer", user_id=uuid.uuid4())
        with pytest.raises(HTTPException) as exc_other_tr:
            get_trainer_details(trainer_id=trainer_id, current_user=other_trainer, db=MagicMock())
        assert exc_other_tr.value.status_code == 403

        # Trainer reading self succeeds unscoped
        self_trainer = _make_user("trainer", user_id=trainer_id)
        db_self = MagicMock()
        db_self.execute.return_value.mappings.return_value.first.return_value = {
            "id": trainer_id,
            "name": "Shared Trainer",
            "email": "shared@test.edu",
            "phone": "8888888888",
            "bio": "Cloud",
            "status": "active",
            "created_at": now,
            "updated_at": now,
            "assigned_batches_count": 2,
        }
        db_self.execute.return_value.mappings.return_value.all.return_value = []
        self_res = get_trainer_details(trainer_id=trainer_id, current_user=self_trainer, db=db_self)
        assert self_res.id == trainer_id
        assert "college_id" not in db_self.execute.call_args_list[0].args[1]

    def test_assign_trainer_to_batch_rejects_inactive_trainer(self):
        college_a = uuid.uuid4()
        batch_a = Batch(id=uuid.uuid4(), college_id=college_a, code="B-A")
        inactive_trainer = Trainer(
            id=uuid.uuid4(),
            full_name="Inactive Trainer",
            email="inactive@test.edu",
            status="inactive",
        )
        super_admin = _make_user("super_admin")

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.side_effect = [
            batch_a,          # verify_batch_access: batch
            batch_a,          # assign_trainer_to_batch: batch
            inactive_trainer, # assign_trainer_to_batch: trainer
            None,             # existing_lead (before fix)
            None,             # existing_assignment (before fix)
        ]

        payload = TrainerBatchAssignmentCreate(
            trainer_id=inactive_trainer.id,
            role="Lead Trainer",
            is_lead=True,
        )
        with pytest.raises(HTTPException) as exc:
            assign_to_batch(batch_id=batch_a.id, payload=payload, current_user=super_admin, db=db)
        assert exc.value.status_code == 400
        assert "inactive" in exc.value.detail.lower()
        db.add.assert_not_called()
        db.commit.assert_not_called()

        # Active trainer succeeds
        active_trainer = Trainer(
            id=uuid.uuid4(),
            full_name="Active Trainer",
            email="active@test.edu",
            status="active",
        )
        db_ok = MagicMock()
        db_ok.execute.return_value.scalar_one_or_none.side_effect = [
            batch_a,        # verify_batch_access
            batch_a,        # assign_trainer_to_batch: batch
            active_trainer, # assign_trainer_to_batch: trainer
            None,           # existing_lead
            None,           # existing_assignment
        ]
        ok_res = assign_to_batch(
            batch_id=batch_a.id,
            payload=TrainerBatchAssignmentCreate(
                trainer_id=active_trainer.id,
                role="Lead Trainer",
                is_lead=True,
            ),
            current_user=super_admin,
            db=db_ok,
        )
        assert ok_res["success"] is True
        db_ok.add.assert_called_once()
        db_ok.commit.assert_called_once()
