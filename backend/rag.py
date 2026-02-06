import os
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

# ✅ Persist DB in backend/chroma_db folder
DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")

client = chromadb.PersistentClient(
    path=DB_DIR,
    settings=Settings(anonymized_telemetry=False)
)

collection = client.get_or_create_collection("resume_chunks")
model = SentenceTransformer("all-MiniLM-L6-v2")


def chunk_text(text: str, chunk_size: int = 220, overlap: int = 40):
    """
    Safer chunking than splitlines. Works even if PDF text has long lines.
    """
    words = text.split()
    if not words:
        return []

    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size]).strip()
        if chunk:
            chunks.append(chunk)
        i += max(chunk_size - overlap, 1)
    return chunks


def reset_collection():
    global collection
    try:
        client.delete_collection("resume_chunks")
    except Exception:
        pass
    collection = client.get_or_create_collection("resume_chunks")


def store_resume(resume_text: str):
    """
    Stores resume text into Chroma embeddings.
    """
    reset_collection()

    chunks = chunk_text(resume_text)
    if not chunks:
        # store at least 1 doc so retrieval doesn't crash
        collection.add(
            documents=["No readable resume text was extracted."],
            embeddings=model.encode(["No readable resume text was extracted."]).tolist(),
            ids=["chunk_0"],
        )
        return

    # limit chunks to avoid heavy compute
    chunks = chunks[:80]

    embeddings = model.encode(chunks).tolist()
    ids = [f"chunk_{i}" for i in range(len(chunks))]

    collection.add(documents=chunks, embeddings=embeddings, ids=ids)


def retrieve_context(query: str, top_k: int = 3) -> str:
    """
    Retrieves most relevant chunks for the query.
    """
    if not query.strip():
        return ""

    query_embedding = model.encode([query]).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results=top_k)

    docs = results.get("documents", [[]])[0]
    return "\n\n".join(docs) if docs else ""