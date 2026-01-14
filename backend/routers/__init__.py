from .exercises import router as exercises_router
from .routines import router as routines_router
from .sessions import router as sessions_router
from .body_metrics import router as body_metrics_router

__all__ = [
    "exercises_router",
    "routines_router",
    "sessions_router",
    "body_metrics_router",
]
