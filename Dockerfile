# ============================================================
# UNMAPPED Protocol — Production Dockerfile
# Runs the FastAPI backend (api.py) with uvicorn.
# ============================================================

# ---- Stage 1: Build dependencies ----
FROM python:3.13-slim AS builder

WORKDIR /app

# System deps needed by some Python packages (chromadb, pypdf, etc.)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---- Stage 2: Runtime image ----
FROM python:3.13-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY api.py .
COPY router.py .
COPY ingestor.py .
COPY mcp_server.py .
COPY semantic_router.py .

# Copy static data (ILO signals, automation scores)
COPY data/ data/

# Create directories the app expects at runtime
RUN mkdir -p data/chroma_db data/external

# Pre-download the HuggingFace embedding model so first request isn't slow
RUN python -c "from langchain_huggingface import HuggingFaceEmbeddings; HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')"

# Environment variables (override at runtime with docker run -e or .env)
ENV GROQ_API_KEY=""
ENV GROQ_BASE_URL="https://api.groq.com/openai/v1"
ENV GROQ_MODEL="llama-3.3-70b-versatile"

EXPOSE 7860

# Health check against the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import httpx; r = httpx.get('http://localhost:7860/health'); r.raise_for_status()" || exit 1

# Run with uvicorn — 0.0.0.0 to accept connections from outside the container
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]
