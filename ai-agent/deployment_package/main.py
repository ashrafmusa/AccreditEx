"""
AccreditEx AI Agent API - Render.com Deployment
FastAPI application for the unified AccreditEx AI agent with context awareness
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, AsyncGenerator
import uvicorn
import os
import logging
from datetime import datetime

# Import the unified agent
from unified_accreditex_agent import UnifiedAccreditexAgent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AccreditEx AI Agent API",
    description="Context-aware AI agent for healthcare accreditation compliance",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://accreditex-79c08.web.app",
        "https://accreditex-79c08.firebaseapp.com",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent
agent = None

# Request/Response Models
class ChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    thread_id: Optional[str] = Field(None, description="Conversation thread ID")
    context: Optional[Dict[str, Any]] = Field(None, description="Application context (route, page, user role)")

class ChatResponse(BaseModel):
    response: str
    thread_id: str
    timestamp: str
    tools_used: Optional[list] = None

class HealthResponse(BaseModel):
    status: str
    agent_initialized: bool
    timestamp: str
    version: str

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize the AI agent on startup"""
    global agent
    try:
        logger.info("Initializing AccreditEx AI Agent...")
        agent = UnifiedAccreditexAgent()
        await agent.initialize()
        logger.info("✅ AI Agent initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize agent: {e}")
        raise

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if agent and agent.agent else "unhealthy",
        agent_initialized=agent is not None and agent.agent is not None,
        timestamp=datetime.utcnow().isoformat(),
        version="2.0.0"
    )

# Chat endpoint
@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Chat with the AI agent (streaming response)
    Accepts optional context for context-aware responses
    """
    if not agent or not agent.agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        logger.info(f"Chat request: {request.message[:50]}...")
        if request.context:
            logger.info(f"Context: {request.context}")
        
        # Stream the response
        async def generate():
            full_response = ""
            async for chunk in agent.chat(
                message=request.message,
                thread_id=request.thread_id,
                context=request.context
            ):
                full_response += chunk
                yield chunk
        
        return StreamingResponse(
            generate(),
            media_type="text/plain"
        )
    
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Document compliance endpoint
@app.post("/check-compliance")
async def check_compliance(
    document_type: str,
    standard: str,
    content_summary: str,
    requirements: Optional[list] = None
):
    """Check document compliance against standards"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.check_document_compliance(
            document_type=document_type,
            standard=standard,
            content_summary=content_summary,
            requirements=requirements
        )
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Compliance check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Risk assessment endpoint
@app.post("/assess-risk")
async def assess_risk(
    area: str,
    current_status: str,
    upcoming_review_date: str,
    critical_areas: Optional[list] = None
):
    """Assess compliance risk"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.assess_risk(
            area=area,
            current_status=current_status,
            upcoming_review_date=upcoming_review_date,
            critical_areas=critical_areas
        )
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Risk assessment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Training recommendations endpoint
@app.post("/training-recommendations")
async def get_training_recommendations(
    role: str,
    competency_gaps: list,
    accreditation_focus: str,
    timeline: str
):
    """Get training recommendations"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.get_training_recommendations(
            role=role,
            competency_gaps=competency_gaps,
            accreditation_focus=accreditation_focus,
            timeline=timeline
        )
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Training recommendations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AccreditEx AI Agent API",
        "version": "2.0.0",
        "status": "running",
        "features": [
            "Context-aware chat",
            "Document compliance checking",
            "Risk assessment",
            "Training recommendations"
        ]
    }

# Run the application
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
