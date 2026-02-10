# Resume Screening Application

An AI-powered resume screening tool that analyzes resumes against job descriptions using advanced language models and semantic search. The application extracts key information from PDFs, stores embeddings in a vector database, and provides intelligent matching and analysis.

## Features

- **PDF Processing**: Upload and extract text from resume and job description PDFs
- **Semantic Search**: Uses embeddings to find relevant resume sections matching job requirements
- **AI Analysis**: Leverages OpenRouter API with GPT-4 Turbo for intelligent analysis
- **Match Scoring**: Calculates match percentage between resume and job description
- **Strengths & Gaps**: Identifies candidate strengths and skill gaps
- **Interactive Chat**: Ask follow-up questions about resume-job fit
- **Vector Database**: ChromaDB for efficient semantic search

## Technology Stack

**Backend:**
- FastAPI - Modern Python web framework
- Uvicorn - ASGI server
- PDFPlumber - PDF text extraction
- ChromaDB - Vector database for embeddings
- Sentence-Transformers - Text embeddings
- Groq API - Fast LLM model integration

**Frontend:**
- React - JavaScript UI library
- Modern CSS

**Database:**
- ChromaDB - Vector database for resume embeddings

## Installation

### Prerequisites
- Python 3.10+
- Node.js 14+
- Groq API key (get from [console.groq.com](https://console.groq.com))

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory:
```
GROQ_API_KEY=your-groq-api-key-here
```

5. Start the backend server:
```bash
python main.py
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Start the development server:
```bash
npm start
```

The frontend will open at `http://localhost:3000`

## Usage

1. **Upload Documents**:
   - Click the upload section in the UI
   - Select a resume PDF and job description PDF
   - Click "Analyze" to process

2. **View Results**:
   - Match score percentage
   - List of strengths
   - Skill gaps identified
   - AI-generated insights

3. **Ask Questions**:
   - Use the chat interface to ask follow-up questions
   - Get context-aware responses about the resume-job match

## API Endpoints

### Resume Upload
```
POST /upload
```
Upload PDF documents for analysis

**Request:**
- `resume` (file): Resume PDF
- `job_description` (file): Job description PDF

**Response:**
```json
{
  "message": "Files uploaded successfully",
  "resume_text": "...",
  "job_description_text": "..."
}
```

### Chat
```
POST /chat
```
Get analysis and insights about resume-job fit

**Request:**
```json
{
  "user_message": "Your question here",
  "context": "Resume and job description context"
}
```

**Response:**
```json
{
  "answer": "AI-generated response"
}
```

## Project Structure

```
assessment-1/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── rag.py              # ChromaDB and embeddings
│   ├── parser.py           # PDF parsing logic
│   ├── match.py            # Resume-job matching
│   ├── requirements.txt     # Python dependencies
│   ├── .env                # Environment variables (not committed)
│   └── chroma_db/          # ChromaDB storage
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
├── sample_files/           # Sample resume and job description
└── README.md              # This file
```

## Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```
GROQ_API_KEY=your-groq-api-key-here
```

### API Configuration

The application uses:
- **Model**: Groq LLM API
- **Base URL**: `https://api.groq.com/openai/v1/chat/completions`
- **Backend URL**: `http://127.0.0.1:8000`
- **Frontend URL**: `http://localhost:3000`

## File Formats

- **Supported PDF formats**: Standard PDF documents
- **Recommended file size**: < 10 MB per file
- **Text encoding**: UTF-8

## Troubleshooting

### Backend won't start
- Ensure Python virtual environment is activated
- Check API key is correctly set in `.env`
- Verify port 8000 is not in use

### API Key Error
- Verify `GROQ_API_KEY` is set in `.env`
- Check API key is valid from console.groq.com
- Ensure you have sufficient API quota on Groq

### CORS Issues
- Make sure frontend is running on `http://localhost:3000`
- Check backend CORS configuration in `main.py`

### ChromaDB Errors
- Clear `chroma_db/` directory if experiencing issues
- Re-run the application to reinitialize the database

## Development

### Running in Development Mode

**Backend with Uvicorn:**
```bash
cd backend
python main.py
```

**Frontend with hot-reload:**
```bash
cd frontend
npm start
```

Both servers will be available:
- Backend: `http://127.0.0.1:8000`
- Frontend: `http://localhost:3000`

## Performance Notes

- First analysis may take 10-30 seconds (embedding generation)
- Subsequent queries use cached embeddings for faster responses
- Vector database is persisted in `backend/chroma_db/`

## Future Enhancements

- Batch resume processing
- Multiple job description comparison
- Resume formatting analysis
- Interview preparation suggestions
- Export analysis results as PDF

