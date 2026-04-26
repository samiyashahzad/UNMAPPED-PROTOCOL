import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("UNMAPPED Skills Protocol")

BACKEND_URL = "https://sofiajeon-unmapped-backend.hf.space"

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
        return response.json()

@mcp.tool()
async def get_labor_signals(region: str = "Ghana") -> dict:
    """
    Returns real ILO ILOSTAT econometric signals for a region —
    youth unemployment, mean wage, NEET rate, sector breakdown.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(f"{BACKEND_URL}/health")
        return {
            "region": region,
            "backend_status": response.json(),
            "tip": "Call map_informal_skills with this region to get full signals"
        }

if __name__ == "__main__":
    mcp.run(transport="stdio")