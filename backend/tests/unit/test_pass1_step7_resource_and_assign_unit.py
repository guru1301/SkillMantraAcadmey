import uuid
from unittest.mock import MagicMock
from backend.app.db.models.resource import Resource
from backend.app.schemas.resource import ResourceUpdate
from backend.app.services.resource_service import update_resource
from backend.app.schemas.trainer import TrainerBatchAssignmentCreate


def test_resource_update_title_maps_to_name_column():
    fake_db = MagicMock()
    mock_resource = Resource(
        id=uuid.uuid4(),
        batch_id=uuid.uuid4(),
        name="Original Title",
        type="google_drive",
        url="https://drive.google.com/test",
        description="Original desc",
    )
    fake_db.execute.return_value.scalar_one_or_none.return_value = mock_resource

    update_payload = ResourceUpdate(title="Updated Courseware Title", description="New description")
    res = update_resource(fake_db, mock_resource.id, update_payload)

    assert res is not None
    assert mock_resource.name == "Updated Courseware Title"
    assert mock_resource.title == "Updated Courseware Title"
    assert mock_resource.description == "New description"
    assert fake_db.commit.called


def test_trainer_batch_assignment_create_schema_fields():
    trainer_id = uuid.uuid4()
    data = {"trainer_id": str(trainer_id), "role": "Lead Trainer", "is_lead": True}
    obj = TrainerBatchAssignmentCreate.model_validate(data)
    assert obj.trainer_id == trainer_id
    assert obj.role == "Lead Trainer"
    assert obj.is_lead is True

