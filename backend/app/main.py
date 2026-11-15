"""
FastAPI Main Application Entrypoint for Skill Mantra Academy / Skill Thinker Platform.
"""
from contextlib import asynccontextmanager
import secrets
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.api.health import router as health_router
from backend.app.api.v1.api import api_router
from backend.app.core.config import settings
from backend.app.core.logging import logger, setup_logging
from backend.app.core.security import verify_session_csrf_token


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.
    """
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} in [{settings.ENVIRONMENT}] mode...")
    try:
        from backend.app.db.session import SessionLocal
        from backend.app.services.auth_service import run_startup_maintenance
        with SessionLocal() as db:
            result = run_startup_maintenance(db)
            if result.get("status") == "completed":
                logger.info(
                    "Startup maintenance completed: purged %d stale sessions and %d rate limit rows.",
                    result.get("cleaned_sessions", 0),
                    result.get("cleaned_rates", 0),
                )
            elif result.get("status") == "skipped":
                logger.info("Startup maintenance skipped: %s", result.get("reason"))
            else:
                logger.warning("Startup maintenance encountered non-fatal error: %s", result.get("error"))
    except Exception as exc:
        logger.warning("Startup maintenance skipped or non-fatal error: %s", exc)
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="High-Performance Python FastAPI Backend for Skill Mantra Academy / Skill Thinker Platform",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)

# CORS Configuration
# When credentials=True, allow_origins cannot be ["*"] and must match specific origins.
# allow_headers is strictly restricted to Content-Type, X-CSRF-Token, Authorization (P2-11).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-CSRF-Token", "Authorization"],
    expose_headers=["set-cookie"],
)


@app.middleware("http")
async def csrf_protection_middleware(request: Request, call_next):
    """
    Global CSRF Protection Middleware.
    Enforces double-submit CSRF cookie & header validation on state-changing endpoints
    (POST, PUT, PATCH, DELETE) whenever a session cookie is present.
    Non-cookie requests (e.g. Bearer auth) and public login are exempt per documented policy.
    """
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        # Login is the initial authentication entrypoint that provisions credentials
        if request.url.path == f"{settings.API_V1_PREFIX}/auth/login":
            return await call_next(request)

        session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
        if session_cookie and session_cookie.strip():
            csrf_cookie = request.cookies.get("csrf_token")
            csrf_header = request.headers.get("x-csrf-token")

            if not csrf_cookie or not csrf_cookie.strip():
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "CSRF protection violation: Missing or empty csrf_token cookie."},
                )

            if not csrf_header or not csrf_header.strip():
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "CSRF protection violation: Missing or empty X-CSRF-Token request header."},
                )

            if not secrets.compare_digest(csrf_cookie.strip(), csrf_header.strip()):
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "CSRF protection violation: X-CSRF-Token does not match session csrf_token."},
                )

            if not verify_session_csrf_token(csrf_header.strip(), csrf_cookie.strip(), session_cookie.strip()):
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "CSRF protection violation: Invalid or forged session-bound CSRF token."},
                )

    return await call_next(request)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "An internal server error occurred. Please try again later."},
    )


# Mount Health & Diagnostics
app.include_router(health_router)

# Mount API v1 Routes under /api/v1
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Root endpoint
@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs" if not settings.is_production else "disabled in production",
        "health": "/health/live",
        "api_v1": settings.API_V1_PREFIX,
    }
