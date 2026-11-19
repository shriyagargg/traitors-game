import pytest_asyncio
from app.database.session import init_db
import app.database.models  # ensure models are registered on Base.metadata

@pytest_asyncio.fixture(autouse=True)
async def initialize_test_database():
    await init_db()
    yield
