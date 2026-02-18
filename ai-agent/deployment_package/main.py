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
import time
from datetime import datetime
import base64

# Import the unified agent
import sys
import os

# Add current directory to python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from unified_accreditex_agent import UnifiedAccreditexAgent
from monitoring import performance_monitor
from cache import cache

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
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "health",
            "description": "Health check and status endpoints"
        },
        {
            "name": "chat",
            "description": "AI chat and conversation endpoints"
        },
        {
            "name": "compliance",
            "description": "Compliance checking and assessment"
        },
        {
            "name": "risk",
            "description": "Risk assessment and analysis"
        },
        {
            "name": "training",
            "description": "Training recommendations and guidance"
        }
    ]
)

# Configure CORS - Production Ready
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://accreditex.web.app",
        "https://accreditex.firebaseapp.com",
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
    message: str = Field(..., description="User message", min_length=1, max_length=50000, example="How do I prepare for ISO 9001 audit?")
    thread_id: Optional[str] = Field(None, description="Optional thread ID for conversation continuity", example="thread-abc123")
    user_id: Optional[str] = Field(None, description="User ID for context-aware responses")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context (current_page, current_data, forms, templates, etc.)", example={
        "user_id": "user-123",
        "page_title": "Dashboard",
        "route": "/dashboard",
        "user_role": "Quality Manager"
    })

    class Config:
        json_schema_extra = {
            "example": {
                "message": "How do I prepare for ISO 9001 audit?",
                "thread_id": "thread-abc123",
                "context": {
                    "user_id": "user-123",
                    "user_role": "Quality Manager",
                    "page_title": "Dashboard"
                }
            }
        }

class ChatResponse(BaseModel):
    response: str = Field(..., description="AI assistant response")
    thread_id: str = Field(..., description="Thread ID for conversation continuity")
    timestamp: str = Field(..., description="Response timestamp in ISO format")
    tools_used: Optional[list] = Field(None, description="List of tools/functions used")

    class Config:
        json_schema_extra = {
            "example": {
                "response": "To prepare for ISO 9001 audit, you should...",
                "thread_id": "thread-abc123",
                "timestamp": "2026-02-01T10:30:00Z",
                "tools_used": ["firebase_query", "compliance_check"]
            }
        }

# Week 2: Specialist Request Models
class ComplianceCheckRequest(BaseModel):
    """Request for CBAHI/JCI compliance checking"""
    document: str = Field(..., description="Document text to check")
    standard: Optional[str] = Field(None, description="Standard code (CBAHI 4.2.1, JCI PCI.1)")
    user_id: Optional[str] = None

class RiskAssessmentRequest(BaseModel):
    """Request for risk assessment"""
    risk_description: str = Field(..., description="Risk description")
    likelihood: Optional[int] = Field(None, ge=1, le=5, description="1-5")
    impact: Optional[int] = Field(None, ge=1, le=5, description="1-5")
    user_id: Optional[str] = None

class TrainingRequest(BaseModel):
    """Request for training recommendations"""
    role: str = Field(..., description="Staff role")
    gap_description: Optional[str] = None
    current_skills: Optional[list[str]] = None
    user_id: Optional[str] = None

class HealthResponse(BaseModel):
    status: str = Field(..., description="Health status", example="healthy")
    agent_initialized: bool = Field(..., description="Whether AI agent is initialized")
    timestamp: str = Field(..., description="Check timestamp")
    version: str = Field(..., description="API version", example="2.0.0")

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
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["health"],
    summary="Health Check",
    description="Check if the AI agent service is running and initialized properly"
)
async def health_check():
    """
    Health check endpoint to verify service status.
    
    Returns:
        HealthResponse: Current health status and agent initialization state
    """
    return HealthResponse(
        status="healthy" if agent else "unhealthy",
        agent_initialized=agent is not None,
        timestamp=datetime.utcnow().isoformat(),
        version="2.0.0"
    )

# Chat endpoint
@app.post(
    "/chat",
    dependencies=[Depends(verify_api_key)],
    tags=["chat"],
    summary="Chat with AI Assistant",
    description="Send a message to the AI assistant and receive streaming response with context awareness"
)
async def chat(request: ChatRequest):
    """
    Chat with the AI agent (streaming response)
    Accepts optional context for context-aware responses including forms and templates
    Requires X-API-Key header for authentication
    """
    start_time = time.time()
    
    if not agent:
        performance_monitor.track_error("ServiceUnavailable", "Agent not initialized", {"endpoint": "chat"})
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        performance_monitor.log_info("chat_request_received", message_preview=request.message[:100])
        
        # Log enhanced context information
        if request.context and request.context.get('current_data'):
            data = request.context['current_data']
            logger.info(f"📊 Context received:")
            logger.info(f"  - User role: {request.context.get('user_role', 'Unknown')}")
            logger.info(f"  - Templates available: {len(data.get('available_templates', []))}")
            logger.info(f"  - Forms available: {len(data.get('available_forms', []))}")
            logger.info(f"  - AI instructions: {data.get('ai_instructions', {}).get('context_awareness', 'none')}")
        
        # Stream the response
        async def generate():
            full_response = ""
            chunk_count = 0
            async for chunk in agent.chat(
                message=request.message,
                thread_id=request.thread_id,
                context=request.context
            ):
                full_response += chunk
                chunk_count += 1
                yield chunk
            
            # Track performance
            duration = time.time() - start_time
            performance_monitor.track_request("chat", success=True)
            performance_monitor.track_response_time("chat", duration)
            performance_monitor.log_info(
                "chat_completed",
                response_length=len(full_response),
                chunks_sent=chunk_count,
                duration_ms=round(duration * 1000, 2)
            )
        
        return StreamingResponse(
            generate(),
            media_type="text/plain"
        )
    
    except Exception as e:
        duration = time.time() - start_time
        performance_monitor.track_request("chat", success=False)
        performance_monitor.track_response_time("chat", duration)
        performance_monitor.track_error(type(e).__name__, str(e), {"endpoint": "chat"})
        logger.error(f"❌ Chat error: {e}")
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

# AI routing telemetry endpoint
@app.get("/api/ai/routing-metrics", dependencies=[Depends(verify_api_key)])
async def get_ai_routing_metrics():
    """Get specialist routing telemetry and route distribution metrics."""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    try:
        return JSONResponse(content={
            "timestamp": datetime.utcnow().isoformat(),
            "routing_metrics": agent.get_routing_metrics()
        })
    except Exception as e:
        logger.error(f"Routing metrics error: {e}")
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
        "version": "2.2.0",  # Updated version for comprehensive AI
        "status": "running",
        "features": [
            "Comprehensive app-aware AI assistant",
            "Smart form and template provision",
            "Full context awareness (projects, documents, users, departments)",
            "Context-aware chat with Firebase integration",
            "Document compliance checking",
            "Risk assessment",
            "Training recommendations with AI",
            "Project insights and analytics",
            "AI-powered document search",
            "User context and workspace analytics",
            "Report upload (CORS bypass)"
        ],
        "ai_capabilities": [
            "Instant form/template provision by request",
            "Natural language search for documents and forms",
            "Role-based content access",
            "Standards-aware responses (JCI, DNV, OHAS, ISO)",
            "Smart document generation from templates"
        ],
        "endpoints": [
            "POST /chat - Main chat endpoint with enhanced context",
            "POST /api/ai/insights - Get project insights",
            "GET /api/ai/search - AI document search",
            "GET /api/ai/context/{user_id} - User context",
            "GET /api/ai/analytics - Workspace analytics",
            "GET /api/ai/routing-metrics - Specialist routing telemetry",
            "GET /api/ai/training/{user_id} - Training status with AI",
            "POST /check-compliance - Document compliance",
            "POST /assess-risk - Risk assessment",
            "POST /training-recommendations - Training suggestions"
        ]
    }

# Metrics endpoint
@app.get(
    "/metrics",
    tags=["health"],
    summary="Performance Metrics",
    description="Get performance metrics and monitoring data"
)
async def get_metrics():
    """
    Get performance metrics including request stats, response times, and cache performance
    
    Returns:
        Dict with comprehensive metrics data
    """
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": performance_monitor.get_metrics_summary(),
        "cache_stats": cache.get_stats()
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
