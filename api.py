from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json
from router import generate_solution
from ingestor import ingest_external_data, is_vector_db_ready
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="UNMAPPED Skills Protocol")

# 1. NEW: The Infrastructure Config Layer
class SystemConfig(BaseModel):
    labor_data_source: str = "ILO ILOSTAT"
    taxonomy: str = "ISCO-08"
    language: str = "English"
    automation_model: str = "Frey-Osborne"

# 2. UPDATED: The Main Payload
class QueryRequest(BaseModel):
    informal_text: str
    region: str
    config: Optional[SystemConfig] = SystemConfig()


@app.post("/ask-agent")
def ask_agent(request: QueryRequest):
    try:
        # Pass the text, region, AND the config dictionary to the router
        result = generate_solution(
            request.informal_text,
            request.region,
            request.config.model_dump()
        )

        # Parse the string back to JSON so FastAPI serves it correctly
        return {"response": json.loads(result["data"])}
        
    except Exception as e:
        print(f"FATAL SERVER ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Protocol Error.")


@app.post("/ingest-external-data")
def ingest_external():
    """Ingest supported files from data/external into the local vector DB."""
    result = ingest_external_data()
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.get("/health")
def health():
    """Service and vector DB readiness check."""
    vector_db_ready = is_vector_db_ready()
    return {
        "status": "ok",
        "service": "world-bank-generic-ai-engine",
        "vector_db": {
            "ready": vector_db_ready,
            "message": "Vector DB indexed." if vector_db_ready else "Vector DB empty. Run /ingest-external-data.",
        },
    }

# To run this, you will type this in your terminal:
# uvicorn api:app --reload