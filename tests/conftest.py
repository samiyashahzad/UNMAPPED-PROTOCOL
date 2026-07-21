"""
Shared pytest fixtures for the UNMAPPED Protocol MCP server tests.

All HTTP interactions are mocked so tests run offline and fast.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# ---------------------------------------------------------------------------
# Helpers: build a fake httpx.Response
# ---------------------------------------------------------------------------

def _make_mock_response(json_data: dict, status_code: int = 200) -> MagicMock:
    """Return a lightweight object that quacks like httpx.Response."""
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data
    resp.raise_for_status = MagicMock()
    if status_code >= 400:
        import httpx
        resp.raise_for_status.side_effect = httpx.HTTPStatusError(
            message=f"{status_code}", request=MagicMock(), response=resp
        )
    return resp


def _make_mock_client(post_response=None, get_response=None):
    """Build an AsyncMock httpx client with pre-configured responses."""
    mock_client = AsyncMock()
    if post_response is not None:
        mock_client.post.return_value = post_response
    if get_response is not None:
        mock_client.get.return_value = get_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    return mock_client


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_backend_response() -> dict:
    """A realistic response from the /ask-agent backend endpoint."""
    return {
        "region": "Ghana",
        "informal_input": "I fix phones and sell accessories at the market",
        "formal_skills": [
            "Mobile Device Repair",
            "Retail Sales",
            "Customer Service",
        ],
        "isco_matched_roles": [
            {
                "title": "Electronics Mechanics and Servicers",
                "isco_code": "7421",
                "automation_probability": 0.42,
                "automation_risk_label": "Medium",
                "automation_source": "Frey & Osborne (2013)",
            }
        ],
        "automation_risk_level": "Medium",
        "automation_analysis": "Moderate automation risk at 42%.",
        "econometric_signals": [
            {
                "label": "Youth Unemployment Rate",
                "value": "7.0",
                "unit": "%",
                "year": "2023",
                "source": "ILO ILOSTAT",
            }
        ],
        "skills_by_category": {
            "technical": ["Mobile Device Repair"],
            "interpersonal": ["Customer Service"],
            "entrepreneurial": ["Retail Sales"],
        },
    }


@pytest.fixture
def sample_health_response() -> dict:
    """A realistic response from the /health backend endpoint."""
    return {
        "status": "ok",
        "service": "world-bank-generic-ai-engine",
        "vector_db": {
            "ready": True,
            "message": "Vector DB indexed.",
        },
    }


@pytest.fixture
def sample_labor_signals_response() -> dict:
    """A realistic response from the /labor-signals/{region} endpoint."""
    return {
        "region": "Ghana",
        "data": {
            "youth_unemployment_rate": 7.0,
            "mean_monthly_wage_usd": 120,
            "neet_rate": 14.2,
            "top_employment_sector": "Services",
            "data_source": "ILO ILOSTAT",
            "data_years": {
                "youth_unemployment_rate": "2023",
                "mean_monthly_wage_usd": "2022",
                "neet_rate": "2023",
            },
            "employment_sector_breakdown": {
                "agriculture": {"share_percent": 29.8},
                "industry": {"share_percent": 21.5},
                "services": {"share_percent": 48.7},
            },
        },
    }


@pytest.fixture
def mock_httpx_post(sample_backend_response):
    """
    Patch httpx.AsyncClient so that POST requests return
    *sample_backend_response* without touching the network.

    Yields the mock client instance for assertion introspection.
    """
    mock_response = _make_mock_response(sample_backend_response)
    mock_client = _make_mock_client(post_response=mock_response, get_response=mock_response)

    with patch("httpx.AsyncClient", return_value=mock_client):
        yield mock_client


@pytest.fixture
def mock_httpx_get(sample_labor_signals_response):
    """
    Patch httpx.AsyncClient so that GET requests return
    *sample_labor_signals_response* without touching the network.

    Yields the mock client instance for assertion introspection.
    """
    mock_response = _make_mock_response(sample_labor_signals_response)
    mock_client = _make_mock_client(post_response=mock_response, get_response=mock_response)

    with patch("httpx.AsyncClient", return_value=mock_client):
        yield mock_client
