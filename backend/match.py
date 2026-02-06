import re
from typing import Dict, List, Set

STOPWORDS: Set[str] = {
    "and","or","the","a","an","to","in","for","of","with","on","at","by","from","as",
    "is","are","was","were","be","been","being","this","that","it","we","you","they",
    "i","he","she","them","his","her","our","your","their"
}

def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip().lower()

def _keywords(text: str) -> Set[str]:
    text = _clean(text)
    words = re.findall(r"[a-zA-Z][a-zA-Z\+\#\.]{1,}", text)
    return {w.lower() for w in words if w.lower() not in STOPWORDS}

def _extract_years(text: str) -> List[str]:
    t = _clean(text)
    return re.findall(r"\b(\d{1,2}\+?)\s*(?:years|yrs)\b", t)

def calculate_analysis(resume_text: str, jd_text: str) -> Dict:
    resume = _clean(resume_text)
    jd = _clean(jd_text)

    resume_keys = _keywords(resume)
    jd_keys = _keywords(jd)

    # match score = keyword overlap
    if not jd_keys:
        match_score = 0
        overlap = set()
    else:
        overlap = resume_keys.intersection(jd_keys)
        match_score = int(round((len(overlap) / max(len(jd_keys), 1)) * 100))

    strengths = sorted(list(overlap))[:10]
    gaps = sorted(list(jd_keys.difference(resume_keys)))[:10]

    insights = []
    yrs = _extract_years(resume_text)
    if yrs:
        insights.append(f"Mentions experience: {', '.join(yrs[:3])} yrs")

    if "bachelor" in resume or "b.tech" in resume or "btech" in resume or "bs" in resume:
        insights.append("Has undergraduate degree mentioned")
    if "master" in resume or "m.tech" in resume or "ms " in resume:
        insights.append("Has postgraduate degree mentioned")

    common = ["react", "node", "python", "fastapi", "django", "flask", "java", "aws", "azure", "gcp",
              "sql", "mongodb", "docker", "kubernetes"]
    found = [c for c in common if c in resume]
    if found:
        insights.append("Key skills found: " + ", ".join(found[:8]))

    if match_score < 40 and jd_keys:
        insights.append("Low JD alignment — consider tailoring resume keywords to JD requirements")

    return {
        "match_score": match_score,
        "strengths": strengths,
        "gaps": gaps,
        "insights": insights[:8],
    }