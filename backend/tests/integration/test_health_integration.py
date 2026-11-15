from unittest.mock import patch
from fastapi.testclient import TestClient

class TestHealthIntegration:
    """
    Integration Tests: Tests HTTP endpoint responses, status codes, and JSON schemas
    for health diagnostics and root service endpoints using TestClient.
    """

    def test_liveness_endpoint(self, client: TestClient):
        response = client.get("/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
        assert "environment" in data
        assert "timestamp" in data
        assert "version" in data

    def test_readiness_endpoint_healthy(self, client: TestClient):
        with patch("backend.app.api.health.check_db_connectivity", return_value=True):
            response = client.get("/health/ready")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ready"
            assert data["database"] == "connected"
            assert "timestamp" in data

    def test_readiness_endpoint_degraded(self, client: TestClient):
        with patch("backend.app.api.health.check_db_connectivity", return_value=False):
            response = client.get("/health/ready")
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "degraded"
            assert data["database"] == "disconnected"

    def test_root_endpoint(self, client: TestClient):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert "version" in data
        assert data["health"] == "/health/live"

