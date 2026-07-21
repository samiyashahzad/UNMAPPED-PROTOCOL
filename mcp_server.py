import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("UNMAPPED Skills Protocol")

BACKEND_URL = "https://sofiajeon-unmapped-backend.hf.space"


def _error_response(message: str) -> dict:
    """Return a structured error dict instead of crashing the MCP transport."""
    return {
        "error": True,
        "message": message,
        "tip": "The UNMAPPED backend may be down. Try again shortly.",
    }


@mcp.tool()
async def map_informal_skills(
    informal_text: str,
    region: str = "Ghana",
    language: str = "English"
) -> dict:
    """
    Maps a young person's informal work experience to formal 
    economic signals, ISCO occupational codes, and real ILO 
    labor market data.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{BACKEND_URL}/ask-agent",
                json={
                    "informal_text": informal_text,
                    "region": region,
                    "config": {
                        "labor_data_source": "ILO ILOSTAT",
                        "taxonomy": "ISCO-08",
                        "language": language,
                        "automation_model": "Frey-Osborne"
                    }
                }
            )
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        return _error_response(f"Backend timed out while mapping skills for region '{region}'.")
    except httpx.ConnectError:
        return _error_response("Backend unreachable: connection refused.")
    except httpx.HTTPStatusError as e:
        return _error_response(f"Backend returned HTTP {e.response.status_code}.")
    except Exception as e:
        return _error_response(f"Unexpected error: {e}")


@mcp.tool()
async def get_labor_signals(region: str = "Ghana") -> dict:
    """
    Returns real ILO ILOSTAT econometric signals for a region —
    youth unemployment, mean wage, NEET rate, sector breakdown.
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{BACKEND_URL}/labor-signals/{region}")
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        return _error_response(f"Backend timed out while fetching labor signals for '{region}'.")
    except httpx.ConnectError:
        return _error_response("Backend unreachable: connection refused.")
    except httpx.HTTPStatusError as e:
        return _error_response(f"Backend returned HTTP {e.response.status_code}.")
    except Exception as e:
        return _error_response(f"Unexpected error: {e}")

if __name__ == "__main__":
    mcp.run(transport="stdio")