"""
NexusAI - FastAPI Backend Server
================================
REST API for the Domain-Specific AI Chatbot.

Endpoints:
    POST /chat          - Send a message and get AI response
    POST /train         - Train/retrain the ML model
    GET  /stats         - Get model statistics
    GET  /categories    - Get available FAQ categories
    GET  /history/{id}  - Get session chat history
    POST /settings      - Update model parameters
    DELETE /session/{id} - Clear a session
"""

import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uuid

# Add parent directory to path for model import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from model.nlp_engine import NLPEngine

# === App Configuration ===
app = FastAPI(
    title="NexusAI - Domain-Specific AI Chatbot",
    description="A premium AI chatbot powered by local ML models (TF-IDF + NLP)",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Initialize NLP Engine ===
DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "faq_dataset.json"
)

engine = NLPEngine(data_path=DATA_PATH)


# === Request/Response Models ===
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    session_id: Optional[str] = Field(default=None, description="Session ID for memory")


class ChatResponse(BaseModel):
    response: str
    confidence: float
    method: str
    matched_question: Optional[str]
    category: Optional[str]
    session_id: str
    model_params: dict
    top_matches: list


class SettingsRequest(BaseModel):
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0)
    confidence_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)


class TrainResponse(BaseModel):
    status: str
    stats: dict


# === API Endpoints ===

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "app": "NexusAI",
        "version": "1.0.0",
        "status": "operational",
        "model_trained": engine.is_trained
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to the AI chatbot.
    
    The message goes through the following pipeline:
    1. Text preprocessing (tokenization, stopword removal, lemmatization)
    2. TF-IDF vectorization
    3. Cosine similarity matching against FAQ dataset
    4. If confidence >= threshold: return best FAQ match
    5. If confidence < threshold: generate response from partial matches
    6. Store interaction in session memory
    """
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())

        # Get response from NLP engine
        result = engine.get_response(request.message, session_id)

        return ChatResponse(
            response=result["response"],
            confidence=result["confidence"],
            method=result["method"],
            matched_question=result.get("matched_question"),
            category=result.get("category"),
            session_id=session_id,
            model_params=result["model_params"],
            top_matches=result["top_matches"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")


@app.post("/train", response_model=TrainResponse)
async def train():
    """
    Train or retrain the ML model.
    Reloads the FAQ dataset and retrains the TF-IDF vectorizer.
    """
    try:
        engine.load_data(DATA_PATH)
        stats = engine.train()
        return TrainResponse(
            status="success",
            stats=stats
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")


@app.get("/stats")
async def get_stats():
    """Get model statistics and training information."""
    return engine.get_stats()


@app.get("/categories")
async def get_categories():
    """Get available FAQ categories."""
    return {"categories": engine.get_categories()}


@app.get("/history/{session_id}")
async def get_history(session_id: str):
    """Get chat history for a session."""
    history = engine.memory.get_history(session_id)
    return {"session_id": session_id, "history": history}


@app.post("/settings")
async def update_settings(request: SettingsRequest):
    """
    Update model parameters.
    
    - temperature: Controls randomness (0.0 = deterministic, 2.0 = very random)
    - top_p: Nucleus sampling threshold (0.0-1.0)
    - confidence_threshold: Minimum similarity score for FAQ matching
    """
    params = engine.set_parameters(
        temperature=request.temperature,
        top_p=request.top_p,
        confidence_threshold=request.confidence_threshold
    )
    return {"status": "updated", "parameters": params}


@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Clear a session's chat history."""
    engine.memory.clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}


@app.get("/search/{category}")
async def search_category(category: str):
    """Search FAQ entries by category."""
    results = engine.search_by_category(category)
    return {"category": category, "results": results, "count": len(results)}


# === Run Server ===
if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 60)
    print("  NexusAI - Domain-Specific AI Chatbot Server")
    print("  Starting on http://localhost:8000")
    print("=" * 60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
