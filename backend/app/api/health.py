from datetime import datetime, timezone
from fastapi import APIRouter, status, Response
from pydantic import BaseModel
from backend.app.core.config import settings
from backend.app.db.session import check_db_connectivity

router = APIRouter(tags=["Health & Diagnostics"])

class LivenessResponse(BaseModel):
    status: str
    environment: str
    timestamp: str
    version: str

class ReadinessResponse(BaseModel):
    status: str
    database: str
    environment: str
    timestamp: str

@router.get(
    "/health/live",
    response_model=LivenessResponse,
    status_code=status.HTTP_200_OK,
    summary="Application Liveness Check",
)
def liveness_check() -> LivenessResponse:
    """
    Lightweight probe verifying that the FastAPI process is alive and responsive.
    Does not execute external I/O or database queries.
    """
    return LivenessResponse(
        status="alive",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="1.0.0",
    )

@router.get(
    "/health/ready",
    response_model=ReadinessResponse,
    responses={
        200: {"description": "Service is ready to handle traffic"},
        503: {"description": "Service is unavailable or degraded (e.g. database down)"},
    },
    summary="Application Readiness Check",
)
def readiness_check(response: Response) -> ReadinessResponse:
    """
    Readiness probe verifying that core infrastructure dependencies (e.g. PostgreSQL)
    are reachable and responsive.
    """
    db_healthy = check_db_connectivity()
    now_iso = datetime.now(timezone.utc).isoformat()

    if not db_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return ReadinessResponse(
            status="degraded",
            database="disconnected",
            environment=settings.ENVIRONMENT,
            timestamp=now_iso,
        )

    return ReadinessResponse(
        status="ready",
        database="connected",
        environment=settings.ENVIRONMENT,
        timestamp=now_iso,
    )

