from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
import os

from parser import extract_text
from rag import store_resume, retrieve_context
from match import calculate_analysis  

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

resume_text = ""
jd_text = ""


class ChatRequest(BaseModel):
    question: str


@app.post("/upload")
async def upload_files(resume: UploadFile, jd: UploadFile):
    try:
        global resume_text, jd_text

        resume_bytes = await resume.read()
        jd_bytes = await jd.read()

        resume_ext = (resume.filename.split(".")[-1] or "").lower()
        jd_ext = (jd.filename.split(".")[-1] or "").lower()

        resume_path = f"resume.{resume_ext if resume_ext else 'pdf'}"
        jd_path = f"jd.{jd_ext if jd_ext else 'pdf'}"

        with open(resume_path, "wb") as f:
            f.write(resume_bytes)

        with open(jd_path, "wb") as f:
            f.write(jd_bytes)

        if resume_path.endswith(".pdf"):
            resume_text = extract_text(resume_path)
        else:
            resume_text = open(resume_path, "r", encoding="utf-8", errors="ignore").read()

        if jd_path.endswith(".pdf"):
            jd_text = extract_text(jd_path)
        else:
            jd_text = open(jd_path, "r", encoding="utf-8", errors="ignore").read()

        store_resume(resume_text)

        analysis = calculate_analysis(resume_text, jd_text)  # ✅ FIXED
        print(f"Upload successful - Match score: {analysis['match_score']}")
        return analysis
    except Exception as e:
        print(f"Upload Error: {str(e)}")
        return {"error": str(e), "match_score": 0, "strengths": [], "gaps": [], "insights": []}


@app.post("/chat")
async def chat(payload: ChatRequest):
    try:
        question = payload.question.strip()
        if not question:
            return {"answer": "Please ask a question."}

        context = retrieve_context(question, top_k=3)
        if not context:
            return {"answer": "I couldn't find relevant sections in the resume to answer that."}

        prompt_text = f"""You are a resume screening assistant.
Answer ONLY using the Resume Context.
If the context does not contain the answer, say you don't have enough information.

Resume Context:
{context}

Question:
{question}

Answer:"""

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }

        payload_data = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "user", "content": prompt_text}
            ],
            "max_tokens": 1000,
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=payload_data)
        
        # API errors
        if response.status_code != 200:
            error_msg = response.json().get("error", {}).get("message", "Unknown error")
            print(f"Groq API Error: {response.status_code} - {error_msg}")
            return {"answer": f"API Error: {error_msg}", "error": True}
        
        response_data = response.json()
        
        # Extract answer from response
        if response_data.get("choices") and len(response_data["choices"]) > 0:
            answer = response_data["choices"][0].get("message", {}).get("content", "")
            if answer:
                return {"answer": answer}
        
        return {"answer": "Sorry, I couldn't generate a response. Please try again."}
        
    except Exception as e:
        print(f"Chat Error: {str(e)}")
        return {"answer": f"Error: {str(e)}", "error": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)