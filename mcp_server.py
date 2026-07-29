import httpx
from mcp.server.fastmcp import FastMCP
from mcp.types import Context
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
async def map_informal_skills(ctx:Context,informal_text: str,region: str = "Ghana",language: str = "English"    ) -> dict:
    """
    Maps a young person's informal work experience to formal 
    economic signals, ISCO occupational codes, and real ILO 
    labor market data.
    """
    try:
        await ctx.info(f"Mapping informal skills for {region} and language {language}...")      
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
            await ctx.info("Successfully mapped informal skills.")
            return response.json()
    except httpx.TimeoutException:
        await ctx.info(f"Backend timed out while mapping skills for region '{region}'.")
        return _error_response(f"Backend timed out while mapping skills for region '{region}'.")
    except httpx.ConnectError:
        await ctx.info("Backend unreachable: connection refused.")
        return _error_response("Backend unreachable: connection refused.")
    except httpx.HTTPStatusError as e:
        await ctx.info(f"Backend returned HTTP {e.response.status_code}.")
        return _error_response(f"Backend returned HTTP {e.response.status_code}.")
    except Exception as e:
        await ctx.info(f"Unexpected error: {e}")
        return _error_response(f"Unexpected error: {e}")


@mcp.tool()
async def get_labor_signals(ctx:Context, region: str = "Ghana") -> dict:
    """
    Returns real ILO ILOSTAT econometric signals for a region —
    youth unemployment, mean wage, NEET rate, sector breakdown.
    """
    try:
        await ctx.info(f"Fetching ILO labor signals for {region} (youth unemployment, mean wage, NEET rate, etc.)...")
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{BACKEND_URL}/labor-signals/{region}")
            response.raise_for_status()
            await ctx.info("Successfully retrieved labor signals.")
            return response.json()
    except httpx.TimeoutException:
        await ctx.info(f"Backend timed out while fetching labor signals for '{region}'.")
        return _error_response(f"Backend timed out while fetching labor signals for '{region}'.")
    except httpx.ConnectError:
        await ctx.info("Backend unreachable: connection refused.")
        return _error_response("Backend unreachable: connection refused.")
    except httpx.HTTPStatusError as e:
        await ctx.info(f"Backend returned HTTP {e.response.status_code}.")
        return _error_response(f"Backend returned HTTP {e.response.status_code}.")
    except Exception as e:
        await ctx.info(f"Unexpected error: {e}")
        return _error_response(f"Unexpected error: {e}")

if __name__ == "__main__":
    mcp.run(transport="stdio")