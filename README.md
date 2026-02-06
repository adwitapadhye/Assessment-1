AI Resume Screening Tool (RAG-based)

An AI-powered resume screening application that compares a candidate’s resume with a job description, calculates a match score, identifies strengths and gaps, and enables contextual Q&A using Retrieval-Augmented Generation (RAG).

Built using FastAPI, React, ChromaDB, Sentence Transformers, and Google Gemini.

🚀 Features

Upload Resume + Job Description

Automatic match score calculation

Extracts:

Strengths

Gaps

Key insights

RAG-based chat to ask questions about the candidate

Modern React UI dashboard

Vector search using ChromaDB

🧠 How It Works

Resume is uploaded and parsed.

Text is split into chunks.

Chunks are converted into embeddings using Sentence Transformers.

Stored in ChromaDB.

When a question is asked:

Relevant chunks are retrieved.

Sent to Gemini for answer generation.

🏗️ Project Structure
assessment-1/
│
├── backend/
│   ├── main.py        # FastAPI server
│   ├── match.py       # Resume–JD scoring logic
│   ├── parser.py      # PDF text extraction
│   ├── rag.py         # Vector storage & retrieval
│   ├── chroma_db/     # Persistent vector database
│   ├── .env           # API keys
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
│
└── README.md
⚙️ Tech Stack
Backend

FastAPI

ChromaDB

Sentence Transformers

Google Gemini API

Python

Frontend

React

Axios

🛠️ Installation & Setup
1️⃣ Clone the repository
git clone <your-repo-url>
cd assessment-1
2️⃣ Backend Setup
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # Windows
pip install -r requirements.txt

Create a .env file inside backend:

GOOGLE_API_KEY=your_gemini_api_key

Run the backend:

python -m uvicorn main:app --reload

Backend will run at:

http://127.0.0.1:8000
3️⃣ Frontend Setup

Open a new terminal:

cd frontend
npm install
npm start

Frontend will run at:

http://localhost:3000
📡 API Endpoints
Upload Resume + JD

POST /upload

Form-data:

resume: file
jd: file

Response:

{
  "match_score": 72,
  "strengths": ["python", "react"],
  "gaps": ["kubernetes"],
  "insights": ["Key skills found: python, react"]
}
Ask Question (RAG Chat)

POST /chat

Body:

{
  "question": "Does the candidate know React?"
}

Response:

{
  "answer": "Yes, the candidate has experience with React."
}
