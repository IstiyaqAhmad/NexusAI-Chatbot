"""
NexusAI - FastAPI Backend Server
================================
REST API for the Domain-Specific AI Chatbot + Smart AI Platform Recommender.

Endpoints:
    POST /chat              - Send a message and get AI response
    POST /train             - Train/retrain the ML model
    GET  /stats             - Get model statistics
    GET  /categories        - Get available FAQ categories
    GET  /history/{id}      - Get session chat history
    POST /settings          - Update model parameters
    DELETE /session/{id}    - Clear a session
    
    # Smart AI Recommender
    POST /recommend         - Get AI platform recommendations
    GET  /recommend/trending - Get trending AI tools
    GET  /recommend/categories - Get all recommendation categories
    GET  /recommend/free    - Get best free tools
    GET  /recommend/tools/{id} - Get tools by category
    POST /recommend/favorite - Add a favorite tool
    GET  /recommend/user-stats - Get user interaction stats
    GET  /recommend/engine-stats - Get recommendation engine stats
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
from model.recommendation_engine import RecommendationEngine

# === App Configuration ===
app = FastAPI(
    title="NexusAI - AI Chatbot + Smart Recommender",
    description="Premium AI chatbot & ML-powered platform recommender (TF-IDF + KNN)",
    version="2.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Initialize Engines ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_PATH = os.path.join(BASE_DIR, "data", "faq_dataset.json")
AI_TOOLS_PATH = os.path.join(BASE_DIR, "data", "ai_tools_dataset.json")

engine = NLPEngine(data_path=DATA_PATH)
recommender = RecommendationEngine(dataset_path=AI_TOOLS_PATH)


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


class RecommendRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="Task description")


class FavoriteRequest(BaseModel):
    tool_name: str = Field(..., min_length=1, description="Tool name to favorite")


# === Chatbot API Endpoints ===

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "app": "NexusAI",
        "version": "2.0.0",
        "status": "operational",
        "model_trained": engine.is_trained,
        "recommender_trained": recommender.is_trained
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


# ============================================================
# Smart AI Platform Recommender Endpoints
# ============================================================

@app.post("/recommend")
async def get_recommendation(request: RecommendRequest):
    """
    Get AI platform recommendations based on a task description.
    Uses TF-IDF + Cosine Similarity + KNN for intelligent matching.
    """
    try:
        result = recommender.recommend(request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")


@app.get("/recommend/trending")
async def get_trending():
    """Get trending AI tools across all categories."""
    return {"trending": recommender.get_trending_tools()}


@app.get("/recommend/categories")
async def get_recommend_categories():
    """Get all recommendation categories."""
    return {"categories": recommender.get_all_categories()}


@app.get("/recommend/free")
async def get_free_tools():
    """Get best free AI tools across categories."""
    return {"free_tools": recommender.get_free_tools()}


@app.get("/recommend/tools/{category_id}")
async def get_tools_by_category(category_id: str):
    """Get all tools for a specific category."""
    result = recommender.get_tools_by_category(category_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/recommend/favorite")
async def add_favorite(request: FavoriteRequest):
    """Add a tool to user favorites."""
    recommender.add_favorite(request.tool_name)
    return {"status": "added", "tool": request.tool_name}


@app.get("/recommend/user-stats")
async def get_user_stats():
    """Get user interaction statistics."""
    return recommender.get_user_stats()


@app.get("/recommend/engine-stats")
async def get_engine_stats():
    """Get recommendation engine statistics."""
    return recommender.get_engine_stats()


# === Run Server ===
if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 60)
    print("  NexusAI - AI Chatbot + Smart Platform Recommender")
    print("  Starting on http://localhost:8000")
    print("=" * 60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
