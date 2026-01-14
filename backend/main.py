from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import settings
from .routers import (
    exercises_router,
    routines_router,
    sessions_router,
    body_metrics_router,
)

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(exercises_router, prefix="/api")
app.include_router(routines_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(body_metrics_router, prefix="/api")


class HealthCheck(BaseModel):
    status: str
    version: str


@app.get("/", response_model=HealthCheck)
def read_root():
    return HealthCheck(status="ok", version=settings.API_VERSION)


@app.get("/health", response_model=HealthCheck)
def health_check():
    return HealthCheck(status="ok", version=settings.API_VERSION)
