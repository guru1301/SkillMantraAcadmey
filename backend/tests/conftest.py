import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.main import app

@pytest.fixture(scope="session")
def client():
    """
    FastAPI TestClient fixture.
    """
    return TestClient(app, raise_server_exceptions=False)

