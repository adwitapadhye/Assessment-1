import re
from typing import Dict, List, Set

STOPWORDS: Set[str] = {
    "and","or","the","a","an","to","in","for","of","with","on","at","by","from","as",
    "is","are","was","were","be","been","being","this","that","it","we","you","they",
    "i","he","she","them","his","her","our","your","their","work","worked","experience"
}

def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip().lower()

def _keywords(text: str) -> Set[str]:
    text = _clean(text)
    words = re.findall(r"[a-zA-Z][a-zA-Z\+\#\.]{1,}", text)
    return {w.lower() for w in words if w.lower() not in STOPWORDS and len(w) > 2}

def _extract_skills(text: str) -> Set[str]:
    """Extract technical skills (frameworks, languages, tools)"""
    text = _clean(text)
    
    # Common tech stack keywords
    tech_keywords = [
        "python", "javascript", "java", "c++", "c#", "typescript", "ruby", "go", "rust", "php",
        "react", "angular", "vue", "next", "svelte", "node", "django", "flask", "fastapi", "spring",
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "ci/cd",
        "sql", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
        "git", "linux", "unix", "windows", "macos"
    ]
    
    found = set()
    for skill in tech_keywords:
        if skill in text:
            found.add(skill)
    
    # Extract multi-word tech phrases
    phrases = re.findall(r"(?:rest api|graphql|websocket|microservice|machine learning|deep learning|data science|full.?stack|backend|frontend|devops)", text)
    found.update(phrases)
    
    return found

def _extract_years(text: str) -> List[str]:
    t = _clean(text)
    return re.findall(r"\b(\d{1,2}\+?)\s*(?:years|yrs)\b", t)

def _extract_job_titles(text: str) -> List[str]:
    """Extract job titles/roles"""
    text = _clean(text)
    roles = re.findall(r"(?:senior|junior|lead|staff|principal)?\s*(?:software\s+)?(?:engineer|developer|architect|manager|lead|director|specialist)", text)
    return list(set(roles))[:5]

def calculate_analysis(resume_text: str, jd_text: str) -> Dict:
    resume = _clean(resume_text)
    jd = _clean(jd_text)

    resume_keys = _keywords(resume)
    jd_keys = _keywords(jd)
    
    resume_skills = _extract_skills(resume_text)
    jd_skills = _extract_skills(jd_text)

    # Match score combines keyword overlap and skill overlap
    if not jd_keys:
        match_score = 0
        keyword_overlap = set()
    else:
        keyword_overlap = resume_keys.intersection(jd_keys)
        skill_weight = len(resume_skills.intersection(jd_skills)) * 3  # Skills worth more
        keyword_weight = len(keyword_overlap)
        total_weight = skill_weight + keyword_weight
        max_weight = len(jd_skills) * 3 + len(jd_keys)
        match_score = int(round((total_weight / max(max_weight, 1)) * 100))

    # Strengths: Extract actual skills found + relevant keywords
    strengths = sorted(list(resume_skills.intersection(jd_skills)))
    strengths.extend([k for k in sorted(list(keyword_overlap))[:5] if k not in strengths])
    strengths = strengths[:10]

    # Gaps: JD requirements not in resume
    gaps = sorted(list(jd_skills.difference(resume_skills)))
    gaps.extend([k for k in sorted(list(jd_keys.difference(resume_keys)))[:5] if k not in gaps])
    gaps = gaps[:10]

    insights = []
    
    yrs = _extract_years(resume_text)
    if yrs:
        insights.append(f"Experience mentioned: {', '.join(yrs[:3])} years")

    if any(deg in resume for deg in ["bachelor", "b.tech", "btech", "bs", "b.s."]):
        insights.append("Has undergraduate degree")
    if any(deg in resume for deg in ["master", "m.tech", "ms", "m.s.", "phd", "ph.d"]):
        insights.append("Has postgraduate degree")

    job_titles = _extract_job_titles(resume_text)
    if job_titles:
        insights.append("Roles: " + ", ".join(job_titles).title())

    if resume_skills:
        insights.append("Technical skills: " + ", ".join(sorted(list(resume_skills))[:6]))

    if match_score >= 80:
        insights.append("✅ Strong JD alignment")
    elif match_score >= 60:
        insights.append("⚠️ Moderate JD alignment")
    else:
        insights.append("❌ Low JD alignment — consider tailoring resume to JD")

    if gaps:
        insights.append(f"Missing: {', '.join(gaps[:3])}")

    return {
        "match_score": match_score,
        "strengths": strengths,
        "gaps": gaps,
        "insights": insights[:8],
    }