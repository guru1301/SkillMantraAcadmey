"""
Main API v1 Router: Bundles all domain endpoints under /api/v1.
"""
from fastapi import APIRouter

from backend.app.api.v1.endpoints import (
    admin,
    assessments,
    attendance,
    auth,
    batches,
    certificates,
    colleges,
    inquiries,
    feedback,
    programs,
    resources,
    sessions,
    students,
    trainers,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(colleges.router)
api_router.include_router(programs.router)
api_router.include_router(batches.router)
api_router.include_router(trainers.router)
api_router.include_router(students.router)
api_router.include_router(sessions.router)
api_router.include_router(attendance.router)
api_router.include_router(resources.router)
api_router.include_router(assessments.router)
api_router.include_router(certificates.router)
api_router.include_router(inquiries.router)
api_router.include_router(feedback.router)

