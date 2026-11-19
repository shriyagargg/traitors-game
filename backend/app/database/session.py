from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Render and other managed Postgres providers commonly supply postgres:// or
# postgresql:// URLs. Use the psycopg 3 driver declared by this project.
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Engine configuration
# If using SQLite, connect_args check_same_thread must be False for asyncio
connect_args = {"check_same_thread": False} if "sqlite" in database_url else {}

engine = create_async_engine(
    database_url,
    echo=False,
    connect_args=connect_args,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # SQLite development databases need additive columns after model updates.
        if "sqlite" in settings.DATABASE_URL:
            from sqlalchemy import text
            columns = await conn.execute(text("PRAGMA table_info(players)"))
            existing = {row[1] for row in columns.fetchall()}
            if existing and "user_id" not in existing:
                await conn.execute(text("ALTER TABLE players ADD COLUMN user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL"))
            if existing and "is_ai" not in existing:
                await conn.execute(text("ALTER TABLE players ADD COLUMN is_ai BOOLEAN NOT NULL DEFAULT 0"))
            chat_columns = await conn.execute(text("PRAGMA table_info(chat_messages)"))
            existing_chat = {row[1] for row in chat_columns.fetchall()}
            if existing_chat and "is_ai" not in existing_chat:
                await conn.execute(text("ALTER TABLE chat_messages ADD COLUMN is_ai BOOLEAN NOT NULL DEFAULT 0"))
