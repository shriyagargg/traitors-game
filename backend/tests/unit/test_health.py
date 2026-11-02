import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check_endpoint():
    """
    Validates Gate 1.2: System Health and PEAS Metadata Response.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["project"] == "AI TRAITORS"
        assert data["architect"] == "The Architect"
        assert data["version"] == "1.0.0"
        assert "peas_agent" in data


@pytest.mark.asyncio
async def test_root_endpoint():
    """
    Validates API root landing endpoint.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "Welcome to AI TRAITORS" in data["message"]
        assert data["health"] == "/api/v1/health"
