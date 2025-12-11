import os
import json
import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
from datetime import datetime
import logging

# OpenAI SDK (used for Groq)
import openai
from openai import AsyncOpenAI

# Firebase
import firebase_admin
from firebase_admin import credentials, firestore

# Utils
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UnifiedAccreditexAgent:
    """
    Unified Accreditex AI Agent (Groq Edition)
    Uses Groq's high-performance API with Llama 3 for free/fast inference.
    Manages conversation history manually since we are not using the Assistants API.
    """
    
    def __init__(self):
        self.client = None
        self.db = None
        
        # Initialize Groq client using OpenAI SDK
        # Groq is compatible with OpenAI's API structure
        api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
        base_url = "https://api.groq.com/openai/v1" if os.getenv("GROQ_API_KEY") else None
        
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )
        
        # Model selection - use Llama 3.3 70B (current stable model as of Dec 2024)
        # Alternative models: llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768
        # See: https://console.groq.com/docs/models
        self.model = "llama-3.3-70b-versatile" if os.getenv("GROQ_API_KEY") else "gpt-3.5-turbo"
        
        # In-memory conversation history storage (for demo/stateless deployment)
        # In production, this should be in Redis or Firestore
        self.conversations: Dict[str, List[Dict[str, str]]] = {}
        
        # Initialize Firebase (if credentials exist)
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK if credentials are available"""
        try:
            if not firebase_admin._apps:
                cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                    self.db = firestore.client()
                    logger.info("✅ Firebase initialized successfully")
                else:
                    logger.warning(f"⚠️ Firebase credentials not found at {cred_path}")
        except Exception as e:
            logger.error(f"❌ Firebase initialization failed: {e}")

    async def initialize(self):
        """Initialize the agent - mostly a placeholder now as client is init in __init__"""
        logger.info(f"✅ Agent initialized using model: {self.model}")

    async def _get_organization_context(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Fetch relevant organizational data from Firebase"""
        context = {
            "users_count": 0,
            "projects_count": 0,
            "active_projects": [],
            "high_risks": [],
            "recent_documents": [],
            "departments": [],
            "user_role": "Unknown"
        }
        
        if not self.db:
            logger.warning("Firebase not initialized, returning empty context")
            return context
        
        try:
            # Get user role if user_id provided
            if user_id:
                user_doc = self.db.collection('users').document(user_id).get()
                if user_doc.exists:
                    user_data = user_doc.to_dict()
                    context["user_role"] = user_data.get("role", "Unknown")
                    context["user_name"] = user_data.get("name", "User")
            
            # Get projects summary (limit to 5 most recent)
            projects_ref = self.db.collection('projects').order_by('updatedAt', direction=firestore.Query.DESCENDING).limit(5)
            projects = projects_ref.stream()
            for project in projects:
                proj_data = project.to_dict()
                context["active_projects"].append({
                    "id": project.id,
                    "name": proj_data.get("name", "Unnamed"),
                    "progress": proj_data.get("progress", 0),
                    "status": proj_data.get("status", "Unknown")
                })
            context["projects_count"] = len(context["active_projects"])
            
            # Get high-priority risks (limit to 5)
            risks_ref = self.db.collection('risks').where('severity', 'in', ['high', 'critical']).limit(5)
            risks = risks_ref.stream()
            for risk in risks:
                risk_data = risk.to_dict()
                context["high_risks"].append({
                    "id": risk.id,
                    "title": risk_data.get("title", "Unnamed Risk"),
                    "severity": risk_data.get("severity", "Unknown"),
                    "status": risk_data.get("status", "open")
                })
            
            # Get total users count
            users_ref = self.db.collection('users').limit(1)
            users_snapshot = users_ref.stream()
            context["users_count"] = len(list(users_snapshot))
            
            # Get departments
            depts_ref = self.db.collection('departments').limit(10)
            depts = depts_ref.stream()
            for dept in depts:
                dept_data = dept.to_dict()
                context["departments"].append(dept_data.get("name", "Unknown"))
            
            logger.info(f"✅ Retrieved organization context: {context['projects_count']} projects, {len(context['high_risks'])} high risks")
            
        except Exception as e:
            logger.error(f"Error fetching organization context: {e}")
        
        return context

    def _get_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Get the system prompt with dynamic context"""
        
        base_prompt = """
You are the AccreditEx AI Agent, an expert healthcare accreditation consultant.
Your goal is to assist healthcare organizations in preparing for and maintaining accreditation (CBAHI, JCI, etc.).

CORE RESPONSIBILITIES:
1. **Compliance Checking**: Analyze documents against accreditation standards.
2. **Risk Assessment**: Identify potential compliance risks and suggest mitigation.
3. **Training Support**: Recommend training plans based on staff roles and gaps.
4. **General Guidance**: Answer questions about accreditation processes and standards.

TONE AND STYLE:
- Professional, encouraging, and authoritative but accessible.
- Use clear, structured formatting (bullet points, bold text).
- Be proactive: suggest next steps or related checks.
"""

        # Add dynamic context if provided
        if context:
            org_context = context.get('organization', {})
            
            base_prompt += f"""
\nCURRENT ORGANIZATION CONTEXT:
- **User Role**: {context.get('user_role', org_context.get('user_role', 'Unknown'))}
- **Active Projects**: {org_context.get('projects_count', 0)} projects tracked
- **High-Priority Risks**: {len(org_context.get('high_risks', []))} risks requiring attention
- **Team Size**: {org_context.get('users_count', 0)} staff members
- **Departments**: {', '.join(org_context.get('departments', [])[:3])}
"""
            
            if org_context.get('active_projects'):
                base_prompt += "\n**Current Projects:**\n"
                for proj in org_context.get('active_projects', [])[:3]:
                    base_prompt += f"- {proj.get('name', 'Unnamed')}: {proj.get('progress', 0)}% complete ({proj.get('status', 'Unknown')})\n"
            
            if org_context.get('high_risks'):
                base_prompt += "\n**Active High-Priority Risks:**\n"
                for risk in org_context.get('high_risks', [])[:3]:
                    base_prompt += f"- {risk.get('title', 'Unnamed')}: {risk.get('severity', 'Unknown').upper()} severity ({risk.get('status', 'open')})\n"
            
            base_prompt += f"""
\nUSE THIS CONTEXT to provide specific, actionable advice relevant to the organization's current state.
When discussing compliance, reference actual projects and risks where relevant.
"""
        return base_prompt

    async def chat(self, message: str, thread_id: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> AsyncGenerator[str, None]:
        """
        Chat with the agent using streaming responses (Standard Chat Completions)
        """
        try:
            # Generate thread_id if not provided
            if not thread_id:
                thread_id = f"thread_{datetime.now().timestamp()}"
            
            # Fetch organization context from Firebase
            user_id = context.get('user_id') if context else None
            org_context = await self._get_organization_context(user_id)
            
            # Merge organization context with provided context
            enhanced_context = {
                **(context or {}),
                'organization': org_context,
                'user_role': org_context.get('user_role', context.get('user_role', 'Unknown') if context else 'Unknown')
            }
            
            # Initialize conversation history if new thread
            if thread_id not in self.conversations:
                self.conversations[thread_id] = [
                    {"role": "system", "content": self._get_system_prompt(enhanced_context)}
                ]
            else:
                # Update system prompt with fresh context for existing threads
                self.conversations[thread_id][0] = {
                    "role": "system", 
                    "content": self._get_system_prompt(enhanced_context)
                }

            # Append user message
            self.conversations[thread_id].append({"role": "user", "content": message})
            
            # Keep history manageable (last 10 messages + system prompt)
            if len(self.conversations[thread_id]) > 11:
                # Keep system prompt [0] and last 10
                self.conversations[thread_id] = [self.conversations[thread_id][0]] + self.conversations[thread_id][-10:]

            # Stream response
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=self.conversations[thread_id],
                stream=True,
                temperature=0.7,
                max_tokens=1024
            )

            full_response = ""
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield content
            
            # Append assistant response to history
            self.conversations[thread_id].append({"role": "assistant", "content": full_response})
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            yield f"I encountered an error: {str(e)}"

    async def check_document_compliance(self, document_type: str, standard: str, content_summary: str, requirements: Optional[List[str]] = None) -> Dict[str, Any]:
        """Check if a document meets specific standards"""
        prompt = f"""
        Analyze the compliance of this {document_type} against {standard}.
        
        Content Summary:
        {content_summary}
        
        Requirements:
        {', '.join(requirements) if requirements else 'General standard requirements'}
        
        Provide:
        1. Compliance Score (0-100)
        2. Missing Elements
        3. Recommendations
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a compliance auditor."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return {
            "status": "completed",
            "analysis": response.choices[0].message.content,
            "timestamp": datetime.now().isoformat()
        }

    async def assess_risk(self, area: str, current_status: str, upcoming_review_date: str, critical_areas: Optional[List[str]] = None) -> Dict[str, Any]:
        """Assess compliance risk for a specific area"""
        prompt = f"""
        Assess the compliance risk for: {area}
        Current Status: {current_status}
        Review Date: {upcoming_review_date}
        Critical Areas: {', '.join(critical_areas) if critical_areas else 'None specified'}
        
        Provide a risk assessment (Low/Medium/High) and immediate actions needed.
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a risk management expert."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return {
            "risk_level": "Calculated",
            "assessment": response.choices[0].message.content,
            "timestamp": datetime.now().isoformat()
        }

    async def get_training_recommendations(self, role: str, competency_gaps: List[str], accreditation_focus: str, timeline: str) -> Dict[str, Any]:
        """Get training recommendations based on role and gaps"""
        prompt = f"""
        Recommend training for Role: {role}
        Competency Gaps: {', '.join(competency_gaps)}
        Focus: {accreditation_focus}
        Timeline: {timeline}
        
        Suggest 3 specific training modules or activities.
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a healthcare training coordinator."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return {
            "recommendations": response.choices[0].message.content,
            "timestamp": datetime.now().isoformat()
        }
