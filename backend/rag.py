"""Lightweight RAG implementation with fuzzy matching.

This module provides simple `store_resume` and `retrieve_context` functions
without relying on Chroma or heavy embedding models. It uses fuzzy word matching
to find relevant resume sections.
"""

import os
import json
from typing import List
from difflib import SequenceMatcher

STORAGE_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
CACHE_FILE = os.path.join(STORAGE_PATH, "resume_cache.json")


def _ensure_storage():
    os.makedirs(STORAGE_PATH, exist_ok=True)


def store_resume(resume_text: str):
    """Persist the raw resume text for simple retrieval later."""
    _ensure_storage()
    data = {"resume": resume_text}
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f)


def _load_resume() -> str:
    if not os.path.exists(CACHE_FILE):
        return ""
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f).get("resume", "")
    except Exception:
        return ""


def _fuzzy_match(word1: str, word2: str, threshold: float = 0.7) -> bool:
    """Check if two words are similar enough (fuzzy match)."""
    ratio = SequenceMatcher(None, word1.lower(), word2.lower()).ratio()
    return ratio >= threshold


def _score_paragraph(paragraph: str, query_words: List[str]) -> float:
    """Score a paragraph based on how many query words it contains (including fuzzy matches)."""
    para_lower = paragraph.lower()
    score = 0.0
    
    for q_word in query_words:
        if q_word in para_lower:
            # Direct match: higher score
            score += 2.0
        else:
            # Fuzzy match: check word-by-word
            para_words = [w.strip(".,;:()[]") for w in para_lower.split()]
            for p_word in para_words:
                if _fuzzy_match(q_word, p_word, threshold=0.75):
                    score += 1.0
                    break  # Count each query word only once per paragraph
    
    return score


def retrieve_context(query: str, top_k: int = 3) -> str:
    """Return up to `top_k` most relevant paragraphs from the stored resume.

    Uses fuzzy word matching to find related concepts and sections.
    """
    if not query or not query.strip():
        return ""

    resume = _load_resume()
    if not resume:
        return ""

    # Split resume into paragraphs
    paragraphs: List[str] = [p.strip() for p in resume.split("\n\n") if p.strip()]
    if not paragraphs:
        # Fallback: split by sentences
        paragraphs = [s.strip() for s in resume.split(".") if s.strip()]

    # Extract keywords from query
    query_words = [w.lower().strip(".,;:()[]") for w in query.split() if len(w) > 2]

    # Score and sort paragraphs
    scored = [(p, _score_paragraph(p, query_words)) for p in paragraphs]
    scored.sort(key=lambda x: x[1], reverse=True)

    # Return top-k paragraphs with non-zero scores
    top = [p for p, s in scored if s > 0][:top_k]

    # If no paragraph has overlap, return the first `top_k` paragraphs as context
    if not top:
        top = paragraphs[:top_k]

    return "\n\n".join(top)