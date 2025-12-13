"""
AccreditEx AI Agent API - Render.com Deployment
FastAPI application for the unified AccreditEx AI agent with context awareness
"""

from fastapi import FastAPI, HTTPException, Request, File, UploadFile, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, AsyncGenerator
import uvicorn
import os
import logging
from datetime import datetime
import base64

# Import the unified agent
import sys
import os

# Add current directory to python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

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

# Configure CORS - Production Ready
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://accreditex-79c08.web.app",
        "https://accreditex-79c08.firebaseapp.com",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)

# API Key Security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Depends(api_key_header)):
    """Verify API key from request header"""
    expected_key = os.getenv("API_KEY", "dev-key-change-in-production")
    if not api_key or api_key != expected_key:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing API key"
        )
    return api_key

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
        status="healthy" if agent else "unhealthy",
        agent_initialized=agent is not None,
        timestamp=datetime.utcnow().isoformat(),
        version="2.0.0"
    )

# Chat endpoint
@app.post("/chat", dependencies=[Depends(verify_api_key)])
async def chat(request: ChatRequest):
    """
    Chat with the AI agent (streaming response)
    Accepts optional context for context-aware responses
    Requires X-API-Key header for authentication
    """
    if not agent:
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
@app.post("/check-compliance", dependencies=[Depends(verify_api_key)])
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
@app.post("/assess-risk", dependencies=[Depends(verify_api_key)])
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
@app.post("/training-recommendations", dependencies=[Depends(verify_api_key)])
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

# NEW: Project Insights endpoint
@app.post("/api/ai/insights", dependencies=[Depends(verify_api_key)])
async def get_project_insights(project_id: str, user_id: str):
    """Get AI-generated insights for a specific project"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.get_project_insights(
            project_id=project_id,
            user_id=user_id
        )
        
        if result.get('error'):
            raise HTTPException(status_code=404, detail=result['error'])
        
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Project insights error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# NEW: AI-powered document search endpoint
@app.get("/api/ai/search", dependencies=[Depends(verify_api_key)])
async def search_documents_ai(query: str, user_id: str, document_type: Optional[str] = None):
    """AI-powered document search with relevance ranking"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.search_documents_ai(
            query=query,
            user_id=user_id,
            document_type=document_type
        )
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Document search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# NEW: User context endpoint (for debugging)
@app.get("/api/ai/context/{user_id}", dependencies=[Depends(verify_api_key)])
async def get_user_context_endpoint(user_id: str):
    """Get comprehensive user context from Firebase"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        from firebase_client import firebase_client
        context = firebase_client.get_user_context(user_id)
        
        if context.get('error'):
            raise HTTPException(status_code=404, detail=context['error'])
        
        return JSONResponse(content=context)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Context retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# NEW: Workspace analytics endpoint
@app.get("/api/ai/analytics", dependencies=[Depends(verify_api_key)])
async def get_workspace_analytics_endpoint():
    """Get workspace-wide analytics"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        from firebase_client import firebase_client
        analytics = firebase_client.get_workspace_analytics()
        return JSONResponse(content=analytics)
    except Exception as e:
        logger.error(f"Analytics retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# NEW: Training status with AI recommendations
@app.get("/api/ai/training/{user_id}", dependencies=[Depends(verify_api_key)])
async def get_training_status_ai(user_id: str):
    """Get user training status with AI recommendations"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.get_user_training_status_ai(user_id)
        
        if result.get('error'):
            raise HTTPException(status_code=404, detail=result['error'])
        
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Training status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Upload report to Firebase Storage (bypasses browser CORS)
@app.post("/upload-report", dependencies=[Depends(verify_api_key)])
async def upload_report(
    project_id: str = File(...),
    file_data: str = File(...),
    file_name: str = File(...)
):
    """
    Upload PDF report to Firebase Storage from backend
    Bypasses browser CORS restrictions
    """
    try:
        import firebase_admin
        from firebase_admin import credentials, storage
        
        # Initialize Firebase Admin if not already done
        if not firebase_admin._apps:
            cred_json = os.getenv('FIREBASE_CREDENTIALS_JSON')
            if cred_json:
                # Parse credentials from environment variable (Render.com)
                import json
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': 'accreditex-79c08.firebasestorage.app'
                })
            else:
                # Try default credentials (will work if GOOGLE_APPLICATION_CREDENTIALS is set)
                firebase_admin.initialize_app(options={
                    'storageBucket': 'accreditex-79c08.firebasestorage.app'
                })
        
        # Decode base64 file data
        file_bytes = base64.b64decode(file_data)
        
        # Get storage bucket
        bucket = storage.bucket()
        
        # Create blob path
        blob_path = f"reports/{project_id}/{file_name}"
        blob = bucket.blob(blob_path)
        
        # Upload file
        blob.upload_from_string(
            file_bytes,
            content_type='application/pdf'
        )
        
        # Make public and get URL
        blob.make_public()
        download_url = blob.public_url
        
        logger.info(f"Report uploaded successfully: {blob_path}")
        
        return JSONResponse(content={
            "success": True,
            "downloadUrl": download_url,
            "path": blob_path
        })
        
    except Exception as e:
        logger.error(f"Report upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AccreditEx AI Agent API",
        "version": "2.1.0",  # Updated version
        "status": "running",
        "features": [
            "Context-aware chat with Firebase integration",
            "Document compliance checking",
            "Risk assessment",
            "Training recommendations with AI",
            "Project insights and analytics",
            "AI-powered document search",
            "User context and workspace analytics",
            "Report upload (CORS bypass)"
        ],
        "new_endpoints": [
            "POST /api/ai/insights - Get project insights",
            "GET /api/ai/search - AI document search",
            "GET /api/ai/context/{user_id} - User context",
            "GET /api/ai/analytics - Workspace analytics",
            "GET /api/ai/training/{user_id} - Training status with AI"
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
