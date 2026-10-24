import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock, patch

import sys, os
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from mcp_server import map_informal_skills, get_labor_signals

@pytest.mark.asyncio
async def test_timeout_error():
    # STEP 1: Create a fake AsyncClient
    mock_client = AsyncMock()

    # STEP 2: Make .post() throw a timeout
    # TODO: Set mock_client.post.side_effect to the right exception
    # HINT: The exception class is httpx.________ 
    mock_client.post.side_effect = httpx.ReadTimeout("Backend timed out")


    # STEP 3: Wire up the async context manager
    # TODO: Fill in both lines
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    # STEP 4: Patch and call
    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await map_informal_skills(informal_text="I fix phones")

    # STEP 5: Assert — what do you expect?
    # TODO: Fill in these assertions
    # HINT: Look at _error_response() in mcp_server.py — what keys does it return?
    assert result["error"] is True
    print(result)
    assert "timed out" in result["message"].lower()
    
@pytest.mark.asyncio
async def test_500_server_error():
    # STEP 1: Create a fake response that has status_code = 500
    mock_resp = MagicMock()
    mock_resp.status_code = 500
    # When raise_for_status() is called on a 500 response, it throws HTTPStatusError
    mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
        message="500 Internal Server Error",
        request=MagicMock(),
        response=mock_resp,
    )

    # STEP 2: Create a fake client whose .post() returns this fake 500 response
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    # STEP 3: Patch and call map_informal_skills
    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await map_informal_skills(informal_text="I fix phones")

    # STEP 4: Inspect the result!
    print("\n--- RESULT OF 500 ERROR ---")
    print("Type:", type(result))
    print("Content:", result)

    # STEP 5: What assertions do you write here?
    assert result["error"] is True
    assert "500" in result["message"]

@pytest.mark.asyncio
async def test_bad_input_404_error():
    # STEP 1: Fake a 404 response (Bad / unknown region)
    mock_resp = MagicMock()
    mock_resp.status_code = 404
    mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
        message="404 Not Found",
        request=MagicMock(),
        response=mock_resp,
    )

    # STEP 2: Fake client returning the 404 on .get()
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    # STEP 3: Patch and call get_labor_signals with bad input
    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await get_labor_signals(region="Atlantis")

    # STEP 4: Inspect what came back
    print("\n--- RESULT OF 404 BAD INPUT ---")
    print("Content:", result)

    # STEP 5: Assert
    assert result["error"] is True
    assert "404" in result["message"]
