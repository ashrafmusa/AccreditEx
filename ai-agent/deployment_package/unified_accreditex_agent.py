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
            base_prompt += f"""
\nCURRENT CONTEXT:
The user is currently navigating the AccreditEx application.
- **Current Page**: {context.get('page_title', 'Unknown')}
- **Route**: {context.get('route', 'Unknown')}
- **User Role**: {context.get('user_role', 'Unknown')}
- **Timestamp**: {context.get('timestamp', datetime.now().isoformat())}

Please tailor your responses to this context.
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
            
            # Initialize conversation history if new thread
            if thread_id not in self.conversations:
                self.conversations[thread_id] = [
                    {"role": "system", "content": self._get_system_prompt(context)}
                ]
            else:
                # Update system prompt with new context if needed (optional, usually keeps initial context)
                # For this implementation, we'll just append the user message
                pass

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
