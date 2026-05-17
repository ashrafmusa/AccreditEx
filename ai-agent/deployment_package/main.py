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
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn
import os
import logging
import time
from datetime import datetime
import base64
import firebase_admin
from firebase_admin import auth as firebase_auth

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

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI app
# Security: Disable API docs in production (audit finding S-4)
_is_production = os.getenv("ENVIRONMENT", "production").lower() == "production"
app = FastAPI(
    title="AccreditEx AI Agent API",
    description="Context-aware AI agent for healthcare accreditation compliance",
    version="2.0.0",
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
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

# Add rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS - Production Ready
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://accreditex.web.app",
        "https://accreditex.firebaseapp.com",
        "https://accreditex-79c08.web.app",
        "https://accreditex-79c08.firebaseapp.com",
    ] + (["http://localhost:5173", "http://localhost:3000"] if not _is_production else []),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)

# API Key Security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(request: Request, api_key: str = Depends(api_key_header)):
    """Verify authentication via API key OR Firebase ID token.
    
    Dual-auth mode (audit fix S-2):
    1. X-API-Key header → validates against env API_KEY (for backend-to-backend calls)
    2. Authorization: Bearer <token> → validates Firebase ID token (for frontend calls)
    
    Returns a dict with auth info:
    - api_key auth: {"auth_type": "api_key"}
    - firebase auth: {"auth_type": "firebase", "uid": str, "organization_id": str|None}
    """
    # Path 1: API Key authentication
    expected_key = os.getenv("API_KEY")
    if api_key and expected_key and api_key == expected_key:
        return {"auth_type": "api_key"}
    
    # Path 2: Firebase ID Token authentication
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            decoded_token = firebase_auth.verify_id_token(token)
            return {
                "auth_type": "firebase",
                "uid": decoded_token.get("uid"),
                "email": decoded_token.get("email"),
                "organization_id": decoded_token.get("organizationId"),
                "role": decoded_token.get("role"),
            }
        except Exception as e:
            logger.warning(f"Firebase token verification failed: {e}")
            raise HTTPException(status_code=401, detail="Invalid Firebase token")
    
    # Neither auth method succeeded
    if not expected_key:
        logger.error("CRITICAL: API_KEY environment variable is not set!")
        raise HTTPException(status_code=500, detail="Server misconfigured")
    
    raise HTTPException(
        status_code=403,
        detail="Invalid or missing authentication. Provide X-API-Key or Authorization: Bearer <token>"
    )

# Initialize agent
agent = None


def ensure_workflow_response(result: Dict[str, Any], expected_field: str) -> Dict[str, Any]:
    """Normalize workflow responses to stable schema (non-breaking additive guard)."""
    normalized = dict(result or {})
    normalized.setdefault("status", "completed")
    normalized.setdefault("timestamp", datetime.utcnow().isoformat())
    normalized.setdefault(expected_field, normalized.get("response", ""))

    meta = normalized.get("meta") or {}
    if not isinstance(meta, dict):
        meta = {}
    meta.setdefault("route_mode", "endpoint")
    meta.setdefault("schema_validated", True)
    normalized["meta"] = meta
    return normalized


def resolve_request_scope(
    auth_info: Dict[str, Any],
    requested_user_id: Optional[str] = None,
    requested_org_id: Optional[str] = None,
) -> Dict[str, Optional[str]]:
    """Resolve and enforce user/org scope for tenant-safe backend access."""
    auth_type = auth_info.get("auth_type")

    if auth_type == "firebase":
        uid = auth_info.get("uid")
        org_id = auth_info.get("organization_id")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid Firebase token: missing uid")

        # Backward-compatible fallback for users whose custom token claims
        # have not been refreshed with organizationId yet.
        if not org_id:
            try:
                from firebase_client import firebase_client
                user_doc = firebase_client.db.collection("users").document(uid).get()
                if user_doc.exists:
                    user_data = user_doc.to_dict() or {}
                    org_id = user_data.get("organizationId")
            except Exception as scope_error:
                logger.warning(f"Unable to resolve organizationId from users/{uid}: {scope_error}")

        if requested_user_id and requested_user_id != uid:
            raise HTTPException(status_code=403, detail="Cannot access another user's scope")
        if not org_id:
            raise HTTPException(status_code=403, detail="Missing organizationId claim")
        return {"user_id": uid, "organization_id": org_id}

    # API key callers must explicitly provide an organization scope.
    if not requested_org_id:
        raise HTTPException(status_code=400, detail="organization_id is required for API key requests")
    return {"user_id": requested_user_id, "organization_id": requested_org_id}

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
    document_type: str = Field(..., description="Document type to check")
    standard: str = Field(..., description="Target standard or framework")
    content_summary: str = Field(..., description="Document content or summary to analyze")
    requirements: Optional[list[str]] = Field(None, description="Optional specific requirements to verify")
    user_id: Optional[str] = None

class RiskAssessmentRequest(BaseModel):
    """Request for risk assessment"""
    area: str = Field(..., description="Area or workflow being assessed")
    current_status: str = Field(..., description="Current state or findings summary")
    upcoming_review_date: str = Field(..., description="Upcoming review or audit date")
    critical_areas: Optional[list[str]] = Field(None, description="Optional critical concerns to prioritize")
    user_id: Optional[str] = None

class TrainingRequest(BaseModel):
    """Request for training recommendations"""
    role: str = Field(..., description="Staff role")
    department: Optional[str] = Field(None, description="Department or team")
    competency_gaps: Optional[list[str]] = Field(None, description="Explicit competency gaps from the frontend")
    upcoming_accreditation: Optional[str] = Field(None, description="Upcoming accreditation focus from the frontend")
    accreditation_focus: Optional[str] = Field(None, description="Normalized accreditation focus")
    timeline: Optional[str] = Field(None, description="Desired completion timeline")
    gap_description: Optional[str] = None
    current_skills: Optional[list[str]] = None
    user_id: Optional[str] = None

# Week 3: Dedicated AI Workflow Endpoints
class ActionPlanRequest(BaseModel):
    """Request for AI-powered action plan generation"""
    standard_id: str = Field(..., description="Accreditation standard identifier", example="CBAHI-4.1")
    item: str = Field(..., description="Non-compliant item or requirement")
    status: str = Field(..., description="Current status or gap description")
    findings: Optional[str] = Field(None, description="Additional findings or context")
    user_id: Optional[str] = None

class RootCauseAnalysisRequest(BaseModel):
    """Request for root cause analysis"""
    issue_title: str = Field(..., description="Title of the issue or incident")
    description: str = Field(..., description="Detailed description of the issue")
    context: Optional[str] = Field(None, description="Additional context or background")
    affected_areas: Optional[list[str]] = Field(None, description="Areas affected by the issue")
    user_id: Optional[str] = None

class PDCARequest(BaseModel):
    """Request for PDCA cycle improvement suggestions"""
    process_name: str = Field(..., description="Name of the process to improve")
    current_state: str = Field(..., description="Description of current state")
    problem_identified: str = Field(..., description="Identified problem or gap")
    previous_actions: Optional[str] = Field(None, description="Previous corrective actions attempted")
    user_id: Optional[str] = None

class SurveyRiskRequest(BaseModel):
    """Request for survey risk assessment"""
    standard: str = Field(..., description="Accreditation standard (e.g., CBAHI, JCI)")
    organization_area: str = Field(..., description="Area or department being surveyed")
    readiness_level: str = Field(..., description="Current readiness (Low/Medium/High)")
    critical_concerns: Optional[list[str]] = Field(None, description="Critical concerns to address")
    survey_date: Optional[str] = Field(None, description="Planned survey date")
    user_id: Optional[str] = None

class DesignComplianceRequest(BaseModel):
    """Request for design control compliance assessment"""
    design_element: str = Field(..., description="Design element or component being assessed")
    requirement: str = Field(..., description="Applicable compliance requirement")
    current_implementation: str = Field(..., description="Current implementation or status")
    design_phase: Optional[str] = Field(None, description="Design phase (Concept/Development/Validation/Post-Market)")
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
    tags=["chat"],
    summary="Chat with AI Assistant",
    description="Send a message to the AI assistant and receive streaming response with context awareness"
)
@limiter.limit("30/minute")
async def chat(request: Request, chat_request: ChatRequest, auth_info = Depends(verify_api_key)):
    """
    Chat with the AI agent (streaming response)
    Accepts optional context for context-aware responses including forms and templates
    Requires Firebase Bearer auth for frontend requests or the backend API key for trusted service calls
    """
    start_time = time.time()
    
    if not agent:
        performance_monitor.track_error("ServiceUnavailable", "Agent not initialized", {"endpoint": "chat"})
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        performance_monitor.log_info("chat_request_received", message_preview=chat_request.message[:100])

        # Normalize auth scope into context so downstream queries stay tenant-scoped.
        context_payload = dict(chat_request.context or {})
        scope = resolve_request_scope(
            auth_info,
            requested_user_id=context_payload.get("user_id") or chat_request.user_id,
            requested_org_id=context_payload.get("organization_id"),
        )
        if scope.get("user_id"):
            context_payload["user_id"] = scope["user_id"]
        context_payload["organization_id"] = scope["organization_id"]
        chat_request.context = context_payload
        
        # Log enhanced context information
        if chat_request.context and chat_request.context.get('current_data'):
            data = chat_request.context['current_data']
            logger.info(f"📊 Context received:")
            logger.info(f"  - User role: {chat_request.context.get('user_role', 'Unknown')}")
            logger.info(f"  - Templates available: {len(data.get('available_templates', []))}")
            logger.info(f"  - Forms available: {len(data.get('available_forms', []))}")
            logger.info(f"  - AI instructions: {data.get('ai_instructions', {}).get('context_awareness', 'none')}")
        
        # Stream the response
        async def generate():
            full_response = ""
            chunk_count = 0
            async for chunk in agent.chat(
                message=chat_request.message,
                thread_id=chat_request.thread_id,
                context=chat_request.context
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
    
    except HTTPException:
        # Preserve explicit auth/scope HTTP status codes (401/403/400)
        # instead of converting them to a generic 500.
        raise
    except Exception as e:
        duration = time.time() - start_time
        performance_monitor.track_request("chat", success=False)
        performance_monitor.track_response_time("chat", duration)
        performance_monitor.track_error(type(e).__name__, str(e), {"endpoint": "chat"})
        logger.error(f"❌ Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Document compliance endpoint
@app.post("/check-compliance", dependencies=[Depends(verify_api_key)])
@limiter.limit("20/minute")
async def check_compliance(
    request: Request,
    payload: ComplianceCheckRequest,
):
    """Check document compliance against standards"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.check_document_compliance(
            document_type=payload.document_type,
            standard=payload.standard,
            content_summary=payload.content_summary,
            requirements=payload.requirements,
        )
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Compliance check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Risk assessment endpoint
@app.post("/assess-risk", dependencies=[Depends(verify_api_key)])
@limiter.limit("20/minute")
async def assess_risk(
    request: Request,
    payload: RiskAssessmentRequest,
):
    """Assess compliance risk"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.assess_risk(
            area=payload.area,
            current_status=payload.current_status,
            upcoming_review_date=payload.upcoming_review_date,
            critical_areas=payload.critical_areas,
        )
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Risk assessment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Training recommendations endpoint
@app.post("/training-recommendations", dependencies=[Depends(verify_api_key)])
@limiter.limit("15/minute")
async def get_training_recommendations(
    request: Request,
    payload: TrainingRequest,
):
    """Get training recommendations"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        competency_gaps = payload.competency_gaps or payload.current_skills or []
        accreditation_focus = (
            payload.accreditation_focus
            or payload.upcoming_accreditation
            or payload.department
            or "General healthcare accreditation readiness"
        )
        timeline = payload.timeline or "Next accreditation cycle"

        result = await agent.get_training_recommendations(
            role=payload.role,
            competency_gaps=competency_gaps,
            accreditation_focus=accreditation_focus,
            timeline=timeline,
        )
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Training recommendations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────────────────────────
# Week 3: Dedicated AI Workflow Endpoints
# ─────────────────────────────────────────────────────────────

# Action Plan Generation endpoint
@app.post("/generate-action-plan", dependencies=[Depends(verify_api_key)], tags=["workflows"])
@limiter.limit("20/minute")
async def generate_action_plan(request: Request, payload: ActionPlanRequest):
    """Generate actionable compliance action plan"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.generate_action_plan(
            standard_id=payload.standard_id,
            item=payload.item,
            status=payload.status,
            findings=payload.findings,
        )
        return JSONResponse(content=ensure_workflow_response(result, "action_plan"))
    except Exception as e:
        logger.error(f"Action plan generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Root Cause Analysis endpoint
@app.post("/analyze-root-cause", dependencies=[Depends(verify_api_key)], tags=["workflows"])
@limiter.limit("20/minute")
async def analyze_root_cause(request: Request, payload: RootCauseAnalysisRequest):
    """Perform structured root cause analysis"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.analyze_root_cause(
            issue_title=payload.issue_title,
            description=payload.description,
            context=payload.context,
            affected_areas=payload.affected_areas,
        )
        return JSONResponse(content=ensure_workflow_response(result, "root_cause_analysis"))
    except Exception as e:
        logger.error(f"Root cause analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# PDCA Improvement Suggestions endpoint
@app.post("/suggest-pdca-improvements", dependencies=[Depends(verify_api_key)], tags=["workflows"])
@limiter.limit("20/minute")
async def suggest_pdca_improvements(request: Request, payload: PDCARequest):
    """Suggest Plan-Do-Check-Act improvements"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.suggest_pdca_improvements(
            process_name=payload.process_name,
            current_state=payload.current_state,
            problem_identified=payload.problem_identified,
            previous_actions=payload.previous_actions,
        )
        return JSONResponse(content=ensure_workflow_response(result, "pdca_improvements"))
    except Exception as e:
        logger.error(f"PDCA improvement error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Survey Risk Assessment endpoint
@app.post("/assess-survey-risk", dependencies=[Depends(verify_api_key)], tags=["workflows"])
@limiter.limit("20/minute")
async def assess_survey_risk(request: Request, payload: SurveyRiskRequest):
    """Assess readiness risk for upcoming accreditation survey"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.assess_survey_risk(
            standard=payload.standard,
            organization_area=payload.organization_area,
            readiness_level=payload.readiness_level,
            critical_concerns=payload.critical_concerns,
            survey_date=payload.survey_date,
        )
        return JSONResponse(content=ensure_workflow_response(result, "survey_risk_assessment"))
    except Exception as e:
        logger.error(f"Survey risk assessment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Design Control Compliance endpoint
@app.post("/check-design-compliance", dependencies=[Depends(verify_api_key)], tags=["workflows"])
@limiter.limit("20/minute")
async def check_design_compliance(request: Request, payload: DesignComplianceRequest):
    """Assess design control compliance"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await agent.check_design_compliance(
            design_element=payload.design_element,
            requirement=payload.requirement,
            current_implementation=payload.current_implementation,
            design_phase=payload.design_phase,
        )
        return JSONResponse(content=ensure_workflow_response(result, "design_compliance_assessment"))
    except Exception as e:
        logger.error(f"Design compliance error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# NEW: Project Insights endpoint
@app.post("/api/ai/insights", dependencies=[Depends(verify_api_key)])
@limiter.limit("20/minute")
async def get_project_insights(
    request: Request,
    project_id: str,
    user_id: Optional[str] = None,
    organization_id: Optional[str] = None,
    auth_info = Depends(verify_api_key),
):
    """Get AI-generated insights for a specific project"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        scope = resolve_request_scope(auth_info, requested_user_id=user_id, requested_org_id=organization_id)
        org_id = scope.get("organization_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="organization_id is required")
        result = await agent.get_project_insights(
            project_id=project_id,
            user_id=scope.get("user_id") or user_id or "",
            organization_id=org_id,
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
@limiter.limit("30/minute")
async def search_documents_ai(
    request: Request,
    query: str,
    user_id: Optional[str] = None,
    organization_id: Optional[str] = None,
    document_type: Optional[str] = None,
    auth_info = Depends(verify_api_key),
):
    """AI-powered document search with relevance ranking"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        scope = resolve_request_scope(auth_info, requested_user_id=user_id, requested_org_id=organization_id)
        org_id = scope.get("organization_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="organization_id is required")
        result = await agent.search_documents_ai(
            query=query,
            user_id=scope.get("user_id") or user_id or "",
            organization_id=org_id,
            document_type=document_type
        )
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Document search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# NEW: User context endpoint (for debugging)
@app.get("/api/ai/context/{user_id}", dependencies=[Depends(verify_api_key)])
async def get_user_context_endpoint(
    user_id: str,
    request: Request,
    organization_id: Optional[str] = None,
    auth_info = Depends(verify_api_key),
):
    """Get comprehensive user context from Firebase.
    
    Security (audit fix): Firebase-authenticated users can only access
    their own context. API key auth can access any user.
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    scope = resolve_request_scope(auth_info, requested_user_id=user_id, requested_org_id=organization_id)
    
    try:
        from firebase_client import firebase_client
        context = firebase_client.get_user_context(scope["user_id"] or user_id, scope["organization_id"])
        
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
async def get_workspace_analytics_endpoint(
    organization_id: Optional[str] = None,
    auth_info = Depends(verify_api_key),
):
    """Get workspace-wide analytics"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        scope = resolve_request_scope(auth_info, requested_org_id=organization_id)
        org_id = scope.get("organization_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="organization_id is required")
        from firebase_client import firebase_client
        analytics = firebase_client.get_workspace_analytics(org_id)
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
async def get_training_status_ai(
    user_id: str,
    organization_id: Optional[str] = None,
    auth_info = Depends(verify_api_key),
):
    """Get user training status with AI recommendations"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        scope = resolve_request_scope(auth_info, requested_user_id=user_id, requested_org_id=organization_id)
        org_id = scope.get("organization_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="organization_id is required")
        result = await agent.get_user_training_status_ai(
            scope.get("user_id") or user_id,
            org_id,
        )
        
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
@limiter.limit("10/minute")
async def upload_report(
    request: Request,
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
        
        # Generate signed URL (audit fix S-8: no public blobs)
        from datetime import timedelta
        download_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(hours=24),
            method="GET",
        )
        
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

# ─────────────────────────────────────────────────────────────
# Stripe Webhook — updates org plan in Firestore after payment
# Called by Stripe (no auth header) — verified by webhook signature
# ─────────────────────────────────────────────────────────────

STRIPE_PLAN_MAP = {
    # Map Stripe price IDs → AccrediTex plan tier strings
    # Set STRIPE_PRICE_CLINIC, STRIPE_PRICE_HOSPITAL, STRIPE_PRICE_NETWORK in Render env vars
}

def _get_stripe_plan_map() -> dict:
    return {
        os.getenv("STRIPE_PRICE_CLINIC", ""): "starter",
        os.getenv("STRIPE_PRICE_HOSPITAL", ""): "professional",
        os.getenv("STRIPE_PRICE_NETWORK", ""): "enterprise",
    }


@app.post("/stripe/webhook", tags=["stripe"])
async def stripe_webhook(request: Request):
    """
    Stripe webhook endpoint — receives payment events and updates Firestore.
    Events handled:
      - checkout.session.completed → activate paid plan
      - invoice.paid               → renew subscription expiry
      - customer.subscription.deleted → downgrade to free
    """
    import stripe as stripe_lib  # lazy import — only used here

    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    stripe_secret = os.getenv("STRIPE_SECRET_KEY")

    if not webhook_secret or not stripe_secret:
        logger.error("Stripe env vars (STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY) not configured")
        raise HTTPException(status_code=500, detail="Stripe not configured on server")

    stripe_lib.api_key = stripe_secret

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe_lib.Webhook.construct_event(payload, sig_header, webhook_secret)
    except stripe_lib.errors.SignatureVerificationError as e:
        logger.warning(f"Stripe webhook signature failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    from firebase_admin import firestore as fs
    db = fs.client()
    plan_map = _get_stripe_plan_map()
    now = datetime.utcnow().isoformat()

    event_type = event["type"]
    data_obj = event["data"]["object"]

    if event_type == "checkout.session.completed":
        org_id = data_obj.get("metadata", {}).get("organizationId")
        plan = data_obj.get("metadata", {}).get("plan")
        customer_id = data_obj.get("customer")
        sub_id = data_obj.get("subscription")

        if org_id and plan:
            # Security fix (2026-04-17): Verify org-customer binding before updating plan.
            # Prevents an attacker from forging metadata to upgrade a different org's plan.
            # On first checkout the org won't have a stripeCustomerId yet (None or ""),
            # so we allow the first bind. On renewals the IDs must match exactly.
            org_ref = db.collection("organizations").document(org_id)
            org_snap = org_ref.get()
            if not org_snap.exists:
                logger.error(f"Webhook: org not found org={org_id}")
                raise HTTPException(status_code=400, detail="Organization not found")

            stored_customer_id = org_snap.to_dict().get("stripeCustomerId")
            if stored_customer_id and stored_customer_id != customer_id:
                logger.error(
                    f"Webhook: customer mismatch org={org_id} "
                    f"stored={stored_customer_id} event={customer_id}"
                )
                raise HTTPException(status_code=400, detail="Customer ID mismatch")

            from datetime import timedelta
            expires = (datetime.utcnow() + timedelta(days=32)).isoformat()
            org_ref.update({
                "plan": plan,
                "trialActive": False,
                "subscriptionExpiresAt": expires,
                "stripeCustomerId": customer_id,
                "stripeSubscriptionId": sub_id,
                "updatedAt": now,
            })
            logger.info(f"Plan activated: org={org_id} plan={plan}")

    elif event_type == "invoice.paid":
        sub_id = data_obj.get("subscription")
        if sub_id:
            sub = stripe_lib.Subscription.retrieve(sub_id)
            org_id = sub.get("metadata", {}).get("organizationId")
            price_id = sub["items"]["data"][0]["price"]["id"] if sub.get("items", {}).get("data") else None
            plan = plan_map.get(price_id or "")
            period_end = datetime.utcfromtimestamp(sub.get("current_period_end", 0)).isoformat()

            if org_id:
                update = {"subscriptionExpiresAt": period_end, "updatedAt": now}
                if plan:
                    update["plan"] = plan
                db.collection("organizations").document(org_id).update(update)
                logger.info(f"Subscription renewed: org={org_id}")

    elif event_type == "customer.subscription.deleted":
        org_id = data_obj.get("metadata", {}).get("organizationId")
        if org_id:
            db.collection("organizations").document(org_id).update({
                "plan": "free",
                "subscriptionExpiresAt": None,
                "stripeSubscriptionId": None,
                "updatedAt": now,
            })
            logger.info(f"Subscription cancelled: org={org_id} → downgraded to free")

    return {"received": True}


# Run the application
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
