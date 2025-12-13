"""
FastAPI Routes for Enhanced AI Agent with Firebase Integration

Add these routes to your existing FastAPI backend at:
https://accreditex.onrender.com
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import asyncio

from enhanced_agent import enhanced_agent
from firebase_client import firebase_client

app = FastAPI(title="AccreditEx AI Agent API")

# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    user_id: str
    context: Optional[Dict[str, Any]] = None
    stream: bool = True

class ChatResponse(BaseModel):
    response: str
    user_context: Optional[Dict[str, Any]] = None

class ProjectInsightsRequest(BaseModel):
    project_id: str
    user_id: str

class SearchRequest(BaseModel):
    query: str
    user_id: str
    document_type: Optional[str] = None


# Routes
@app.post("/api/ai/chat")
async def chat_with_ai(request: ChatRequest):
    """
    Enhanced chat endpoint with Firebase context
    
    Example:
        POST /api/ai/chat
        {
            "message": "What are my active projects?",
            "user_id": "user123",
            "stream": true
        }
    """
    try:
        if request.stream:
            # Return streaming response
            async def generate():
                async for chunk in enhanced_agent.chat(
                    message=request.message,
                    user_id=request.user_id,
                    context=request.context,
                    stream=True
                ):
                    yield f"data: {chunk}\n\n"
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(
                generate(),
                media_type="text/event-stream"
            )
        else:
            # Return complete response
            response = await enhanced_agent.chat(
                message=request.message,
                user_id=request.user_id,
                context=request.context,
                stream=False
            )
            
            # Get user context for debugging
            user_context = firebase_client.get_user_context(request.user_id)
            
            return ChatResponse(
                response=response,
                user_context=user_context if not user_context.get('error') else None
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/insights")
async def get_project_insights(request: ProjectInsightsRequest):
    """
    Get AI-generated insights for a specific project
    
    Example:
        POST /api/ai/insights
        {
            "project_id": "proj123",
            "user_id": "user123"
        }
    """
    try:
        insights = enhanced_agent.get_project_insights(
            project_id=request.project_id,
            user_id=request.user_id
        )
        
        if insights.get('error'):
            raise HTTPException(status_code=404, detail=insights['error'])
        
        return insights
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/search")
async def search_documents(
    query: str,
    user_id: str,
    document_type: Optional[str] = None
):
    """
    AI-powered document search with relevance ranking
    
    Example:
        GET /api/ai/search?query=infection+control&user_id=user123
    """
    try:
        results = enhanced_agent.search_compliance_documents(
            query=query,
            user_id=user_id,
            document_type=document_type
        )
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/context/{user_id}")
async def get_user_context(user_id: str):
    """
    Get comprehensive user context (for debugging)
    
    Example:
        GET /api/ai/context/user123
    """
    try:
        context = firebase_client.get_user_context(user_id)
        
        if context.get('error'):
            raise HTTPException(status_code=404, detail=context['error'])
        
        return context
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/analytics")
async def get_workspace_analytics():
    """
    Get workspace-wide analytics
    
    Example:
        GET /api/ai/analytics
    """
    try:
        analytics = firebase_client.get_workspace_analytics()
        return analytics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AccreditEx AI Agent",
        "firebase": "connected" if firebase_client.db else "disconnected"
    }


# Run server (for local testing)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
