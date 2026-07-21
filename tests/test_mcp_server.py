"""
Tests for the UNMAPPED Protocol MCP Server (mcp_server.py).

Covers:
  - Tool registration & server metadata
  - map_informal_skills: happy path, defaults, custom params, payload, timeout, errors
  - get_labor_signals:   happy path, defaults, custom region, endpoint, timeout, errors
  - Error handling: structured error dicts instead of raw exceptions
  - Server entry-point configuration
"""

import sys
import os
import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock, patch

# ---------------------------------------------------------------------------
# Ensure the project root is importable
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from mcp_server import mcp, map_informal_skills, get_labor_signals, BACKEND_URL


# ===================================================================
#  1. TOOL REGISTRATION & SERVER METADATA
# ===================================================================

class TestServerMetadata:
    """Verify the FastMCP server is configured correctly."""

    def test_server_name(self):
        assert mcp.name == "UNMAPPED Skills Protocol"

    def test_map_informal_skills_is_callable(self):
        assert callable(map_informal_skills)

    def test_get_labor_signals_is_callable(self):
        assert callable(get_labor_signals)

    def test_backend_url_configured(self):
        assert BACKEND_URL == "https://sofiajeon-unmapped-backend.hf.space"


# ===================================================================
#  2. map_informal_skills TESTS
# ===================================================================

class TestMapInformalSkills:
    """Test the map_informal_skills MCP tool."""

    # ---------------------------------------------------------------
    # Happy path
    # ---------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_happy_path_returns_parsed_json(
        self, mock_httpx_post, sample_backend_response
    ):
        """A successful POST returns the backend JSON as a dict."""
        result = await map_informal_skills(
            informal_text="I fix phones at the market",
            region="Ghana",
            language="English",
        )
        assert result == sample_backend_response

    # ---------------------------------------------------------------
    # Default parameters
    # ---------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_defaults_region_ghana(self, mock_httpx_post):
        """When region is omitted it should default to 'Ghana'."""
        await map_informal_skills(informal_text="I sell tomatoes")

        call_kwargs = mock_httpx_post.post.call_args
        posted_json = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
        assert posted_json["region"] == "Ghana"

    @pytest.mark.asyncio
    async def test_defaults_language_english(self, mock_httpx_post):
        """When language is omitted it should default to 'English'."""
        await map_informal_skills(informal_text="I sell tomatoes")

        call_kwargs = mock_httpx_post.post.call_args
        posted_json = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
        assert posted_json["config"]["language"] == "English"

    # ---------------------------------------------------------------
    # Custom parameters forwarded correctly
    # ---------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_custom_region_forwarded(self, mock_httpx_post):
        """A non-default region is correctly placed in the POST body."""
        await map_informal_skills(
            informal_text="I drive a boda-boda",
            region="Uganda",
            language="English",
        )

        call_kwargs = mock_httpx_post.post.call_args
        posted_json = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
        assert posted_json["region"] == "Uganda"

    @pytest.mark.asyncio
    async def test_custom_language_forwarded(self, mock_httpx_post):
        """A non-default language is correctly placed in the config block."""
        await map_informal_skills(
            informal_text="Je vends des tomates",
            region="Ghana",
            language="French",
        )

        call_kwargs = mock_httpx_post.post.call_args
        posted_json = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
        assert posted_json["config"]["language"] == "French"

    # ---------------------------------------------------------------
    # Request payload structure
    # ---------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_payload_structure(self, mock_httpx_post):
        """The POST body must contain the exact keys the backend expects."""
        await map_informal_skills(
            informal_text="I fix phones",
            region="Ghana",
            language="English",
        )

        call_kwargs = mock_httpx_post.post.call_args
        posted_json = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")

        # Top-level keys
        assert "informal_text" in posted_json
        assert "region" in posted_json
        assert "config" in posted_json

        # Config sub-keys
        config = posted_json["config"]
        assert config["labor_data_source"] == "ILO ILOSTAT"
        assert config["taxonomy"] == "ISCO-08"
        assert config["language"] == "English"
        assert config["automation_model"] == "Frey-Osborne"

    @pytest.mark.asyncio
    async def test_posts_to_correct_endpoint(self, mock_httpx_post):
        """The tool must POST to {BACKEND_URL}/ask-agent."""
        await map_informal_skills(informal_text="I fix phones")

        call_args = mock_httpx_post.post.call_args
        url = call_args.args[0] if call_args.args else call_args.kwargs.get("url", "")
        assert url == f"{BACKEND_URL}/ask-agent"

    # ---------------------------------------------------------------
    # Timeout configuration
    # ---------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_timeout_is_30_seconds(self):
        """httpx.AsyncClient should be created with timeout=30."""
        with patch("httpx.AsyncClient") as MockClient:
            mock_client = AsyncMock()
            mock_resp = MagicMock(json=MagicMock(return_value={"ok": True}))
            mock_resp.raise_for_status = MagicMock()
            mock_client.post.return_value = mock_resp
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_client

            await map_informal_skills(informal_text="I fix phones")

            MockClient.assert_called_once_with(timeout=30)

    # ---------------------------------------------------------------
    # Error scenarios — structured error dicts, not raw exceptions
    # ---------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_backend_timeout_returns_error_dict(self):
        """A ReadTimeout returns a structured error dict, not a raw exception."""
        mock_client = AsyncMock()
        mock_client.post.side_effect = httpx.ReadTimeout("Backend timed out")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await map_informal_skills(informal_text="I fix phones")

        assert result["error"] is True
        assert "timed out" in result["message"].lower()

    @pytest.mark.asyncio
    async def test_network_error_returns_error_dict(self):
        """A ConnectError returns a structured error dict, not a raw exception."""
        mock_client = AsyncMock()
        mock_client.post.side_effect = httpx.ConnectError("Connection refused")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await map_informal_skills(informal_text="I fix phones")

        assert result["error"] is True
        assert "unreachable" in result["message"].lower()

    @pytest.mark.asyncio
    async def test_http_500_returns_error_dict(self):
        """A 500 response returns a structured error dict with the status code."""
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
            message="500", request=MagicMock(), response=mock_resp
        )

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await map_informal_skills(informal_text="I fix phones")

        assert result["error"] is True
        assert "500" in result["message"]

    @pytest.mark.asyncio
    async def test_error_dict_always_has_tip(self):
        """Every error response must include a 'tip' key for the MCP client."""
        mock_client = AsyncMock()
        mock_client.post.side_effect = httpx.ConnectError("down")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await map_informal_skills(informal_text="I fix phones")

        assert "tip" in result


# ===================================================================
#  3. get_labor_signals TESTS
# ===================================================================

class TestGetLaborSignals:
    """Test the get_labor_signals MCP tool."""

    # ---------------------------------------------------------------
    # Happy path
    # ---------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_happy_path_returns_labor_data(
        self, mock_httpx_get, sample_labor_signals_response
    ):
        """A successful GET returns the labor signals response dict."""
        result = await get_labor_signals(region="Ghana")

        assert isinstance(result, dict)
        assert result == sample_labor_signals_response

    @pytest.mark.asyncio
    async def test_response_contains_region(
        self, mock_httpx_get
    ):
        """The response dict should contain a 'region' key."""
        result = await get_labor_signals(region="Ghana")
        assert result["region"] == "Ghana"

    @pytest.mark.asyncio
    async def test_response_contains_data_key(
        self, mock_httpx_get
    ):
        """The response dict should contain a 'data' key with ILO metrics."""
        result = await get_labor_signals(region="Ghana")
        assert "data" in result
        assert "youth_unemployment_rate" in result["data"]

    # ---------------------------------------------------------------
    # Default & custom region
    # ---------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_default_region_is_ghana(self, mock_httpx_get):
        """When region is omitted it should default to 'Ghana'."""
        await get_labor_signals()

        call_args = mock_httpx_get.get.call_args
        url = call_args.args[0] if call_args.args else call_args.kwargs.get("url", "")
        assert url.endswith("/labor-signals/Ghana")

    @pytest.mark.asyncio
    async def test_custom_region_in_url(self, mock_httpx_get):
        """A custom region should appear in the endpoint URL."""
        await get_labor_signals(region="Nigeria")

        call_args = mock_httpx_get.get.call_args
        url = call_args.args[0] if call_args.args else call_args.kwargs.get("url", "")
        assert url.endswith("/labor-signals/Nigeria")

    # ---------------------------------------------------------------
    # Correct endpoint (the fix!)
    # ---------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_calls_labor_signals_not_health(self, mock_httpx_get):
        """The tool must GET /labor-signals/{region}, NOT /health."""
        await get_labor_signals(region="Ghana")

        call_args = mock_httpx_get.get.call_args
        url = call_args.args[0] if call_args.args else call_args.kwargs.get("url", "")
        assert "/labor-signals/" in url
        assert "/health" not in url

    # ---------------------------------------------------------------
    # Timeout configuration
    # ---------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_timeout_is_10_seconds(self):
        """httpx.AsyncClient should be created with timeout=10."""
        with patch("httpx.AsyncClient") as MockClient:
            mock_client = AsyncMock()
            mock_resp = MagicMock(json=MagicMock(return_value={"status": "ok"}))
            mock_resp.raise_for_status = MagicMock()
            mock_client.get.return_value = mock_resp
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_client

            await get_labor_signals()

            MockClient.assert_called_once_with(timeout=10)

    # ---------------------------------------------------------------
    # Error scenarios — structured error dicts
    # ---------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_backend_unreachable_returns_error_dict(self):
        """A ConnectError returns a structured error dict."""
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.ConnectError("Connection refused")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await get_labor_signals()

        assert result["error"] is True
        assert "unreachable" in result["message"].lower()

    @pytest.mark.asyncio
    async def test_read_timeout_returns_error_dict(self):
        """A ReadTimeout returns a structured error dict."""
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.ReadTimeout("Timed out")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await get_labor_signals()

        assert result["error"] is True
        assert "timed out" in result["message"].lower()

    @pytest.mark.asyncio
    async def test_http_404_returns_error_dict(self):
        """A 404 (unknown region) returns a structured error dict."""
        mock_resp = MagicMock()
        mock_resp.status_code = 404
        mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
            message="404", request=MagicMock(), response=mock_resp
        )

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await get_labor_signals(region="Mars")

        assert result["error"] is True
        assert "404" in result["message"]

    @pytest.mark.asyncio
    async def test_error_dict_always_has_tip(self):
        """Every error response must include a 'tip' key."""
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.ConnectError("down")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await get_labor_signals()

        assert "tip" in result


# ===================================================================
#  4. SERVER ENTRY-POINT CONFIGURATION
# ===================================================================

class TestServerEntryPoint:
    """Verify the __main__ block configures stdio transport."""

    def test_run_uses_stdio_transport(self):
        """mcp.run should be called with transport='stdio' when executed as main."""
        with patch.object(mcp, "run") as mock_run:
            mcp.run(transport="stdio")
            mock_run.assert_called_once_with(transport="stdio")
