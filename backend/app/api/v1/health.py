from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="System Health & PEAS Metadata Check")
async def health_check():
    """
    Returns system status, active version, and Architect agent metadata
    as required by Gate 1.2 acceptance tests.
    """
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "architect": settings.ARCHITECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "peas_agent": "Knowledge-Based Utility-Guided Multi-Agent System"
    }
