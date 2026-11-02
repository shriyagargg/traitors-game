from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.health import router as health_router

app = FastAPI(
    title=f"{settings.PROJECT_NAME} — {settings.ARCHITECT_NAME}",
    version=settings.VERSION,
    description="Autonomous Multi-Agent Social Deduction and Strategy Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register API Routers
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["System Health"])


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}. The Architect is running.",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
