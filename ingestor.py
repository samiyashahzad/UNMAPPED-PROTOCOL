import os
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader, CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# Initialize the vector store under an absolute project path.
# This avoids cwd-dependent bugs (common when running from different folders/terminals).
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_DIR = DATA_DIR / "chroma_db"
EXTERNAL_DATA_DIR = DATA_DIR / "external"
DB_DIR.mkdir(parents=True, exist_ok=True)
EXTERNAL_DATA_DIR.mkdir(parents=True, exist_ok=True)

SUPPORTED_EXTENSIONS = (".pdf", ".csv")


def get_embedding_model():
    """Use one embedding model for both indexing and retrieval."""
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def ingest_data(file_path: str):
    """Safely loads a file and stores it in the vector database."""
    print(f"Attempting to ingest: {file_path}")
    
    # 1. Graceful Fail: Check if file exists
    if not os.path.exists(file_path):
        return {"status": "error", "message": "File not found."}
        
    try:
        # Determine file type
        if file_path.endswith('.pdf'):
            loader = PyPDFLoader(file_path)
        elif file_path.endswith('.csv'):
            loader = CSVLoader(file_path)
        else:
            return {"status": "error", "message": "Unsupported file type. Use PDF or CSV."}
            
        documents = loader.load()
        
        # Chunk the data so the LLM doesn't get overwhelmed
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)
        
        # Embed and store in ChromaDB
        embeddings = get_embedding_model()
        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=str(DB_DIR),
        )
        
        return {"status": "success", "message": f"Successfully ingested {len(chunks)} chunks."}
        
    except Exception as e:
        # Catch any weird parsing errors or API limits
        print(f"CRITICAL ERROR during ingestion: {str(e)}")
        return {"status": "error", "message": f"Ingestion failed: {str(e)}"}

def ingest_external_data(data_dir: str = str(EXTERNAL_DATA_DIR)):
    """Ingest all supported files from the configured external data folder."""
    if not os.path.exists(data_dir):
        return {"status": "error", "message": f"External data directory not found: {data_dir}"}

    files = [
        os.path.join(data_dir, file_name)
        for file_name in os.listdir(data_dir)
        if file_name.lower().endswith(SUPPORTED_EXTENSIONS)
    ]

    if not files:
        return {"status": "error", "message": "No supported files found in external data directory."}

    results = []
    for file_path in files:
        results.append({"file": file_path, **ingest_data(file_path)})

    failures = [result for result in results if result.get("status") == "error"]
    if failures:
        return {
            "status": "partial_success",
            "message": "Some files failed to ingest.",
            "results": results,
        }

    return {
        "status": "success",
        "message": f"Successfully ingested {len(results)} external file(s).",
        "results": results,
    }

def _db_has_index_data() -> bool:
    """Check for persisted Chroma artifacts before trying retrieval."""
    if not DB_DIR.exists():
        return False
    return any(DB_DIR.iterdir())


def is_vector_db_ready() -> bool:
    """Public health check for vector DB readiness."""
    return _db_has_index_data()


def get_context(query: str, k: int = 3):
    """Retrieves the most relevant chunks for a given query safely."""
    try:
        if not _db_has_index_data():
            return ""

        embeddings = get_embedding_model()
        db_path = str(DB_DIR)

        # Primary path for current langchain-chroma versions.
        try:
            vectorstore = Chroma(persist_directory=db_path, embedding_function=embeddings)
        except TypeError:
            # Backward-compat fallback for versions expecting `embedding`.
            vectorstore = Chroma(persist_directory=db_path, embedding=embeddings)

        docs = vectorstore.similarity_search(query, k=k)
        return "\n\n".join([doc.page_content for doc in docs])
    except Exception as e:
        print(f"Warning: Vector DB search unavailable. Returning empty context. Error: {str(e)}")
        return "" # Return empty string instead of crashing