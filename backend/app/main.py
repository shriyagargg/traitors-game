from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.session import init_db
from app.game_engine.coordinator import coordinator
from app.api.v1.health import router as health_router
from app.api.v1.game import router as game_router
from app.api.v1.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB tables and start authoritative timer
    await init_db()
    await coordinator.load_active_rooms()
    coordinator.start()
    yield
    # Shutdown: Stop timer loop
    await coordinator.stop()


app = FastAPI(
    title=f"{settings.PROJECT_NAME} — {settings.ARCHITECT_NAME}",
    version=settings.VERSION,
    description="Autonomous Multi-Agent Social Deduction and Strategy Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
origins = settings.BACKEND_CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["System Health"])
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(game_router, prefix=settings.API_V1_STR, tags=["Game Engine & WebSockets"])
# Also mount game_router at root without prefix for direct routes if needed
app.include_router(game_router, prefix="", tags=["Game Engine Direct"])


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}. The Architect is running.",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }
