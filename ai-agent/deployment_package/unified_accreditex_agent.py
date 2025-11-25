import os
import json
import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
from datetime import datetime
import logging

# Azure AI Agent Framework
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

# OpenAI
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
    Unified Accreditex AI Agent
    Combines capabilities of the original agent with the new Azure AI Agent Framework
    """
    
    def __init__(self):
        self.client = None
        self.agent = None
        self.db = None
        self.project_client = None
        
        # Initialize OpenAI client
        self.openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
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
        """Initialize the agent"""
        try:
            # For now, we'll use a direct OpenAI implementation as it's more portable for Render
            # This avoids Azure dependency issues in the free tier
            logger.info("Initializing OpenAI-based agent...")
            
            # Define tools/functions
            self.tools = self._get_agent_tools()
            
            # Create the assistant
            self.agent = await self.openai_client.beta.assistants.create(
                name="AccreditEx Agent",
                instructions=self._get_agent_instructions(),
                tools=self.tools,
                model="gpt-4-1106-preview"  # Use Turbo for better performance/cost
            )
            logger.info(f"✅ Agent initialized: {self.agent.id}")
            
        except Exception as e:
            logger.error(f"❌ Agent initialization failed: {e}")
            raise

    def _get_agent_instructions(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Get comprehensive instructions for the healthcare accreditation agent"""
        
        base_instructions = """
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

KNOWLEDGE BASE:
- You have access to general accreditation standards (CBAHI, JCI).
- You understand healthcare policies, SOPs, and KPIs.
"""

        # Add dynamic context if provided
        context_instructions = ""
        if context:
            context_instructions = f"""
\nCURRENT CONTEXT:
The user is currently navigating the AccreditEx application.
- **Current Page**: {context.get('page_title', 'Unknown')}
- **Route**: {context.get('route', 'Unknown')}
- **User Role**: {context.get('user_role', 'Unknown')}
- **Timestamp**: {context.get('timestamp', datetime.now().isoformat())}

Please tailor your responses to this context. For example, if the user is on the "Training" page, focus on training-related advice.
"""

        return base_instructions + context_instructions

    def _get_agent_tools(self):
        """Define the tools available to the agent"""
        return [
            {"type": "code_interpreter"},
            {"type": "retrieval"},
            # Add function definitions here as needed
        ]

    async def chat(self, message: str, thread_id: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> AsyncGenerator[str, None]:
        """
        Chat with the agent using streaming responses
        """
        if not self.agent:
            await self.initialize()

        try:
            # Update agent instructions with current context if provided
            if context:
                await self.openai_client.beta.assistants.update(
                    assistant_id=self.agent.id,
                    instructions=self._get_agent_instructions(context)
                )

            # Create or retrieve thread
            if not thread_id:
                thread = await self.openai_client.beta.threads.create()
                thread_id = thread.id
            
            # Add message to thread
            await self.openai_client.beta.threads.messages.create(
                thread_id=thread_id,
                role="user",
                content=message
            )

            # Run the assistant
            run = await self.openai_client.beta.threads.runs.create(
                thread_id=thread_id,
                assistant_id=self.agent.id,
                stream=True
            )

            # Stream the response
            async for event in run:
                if event.event == "thread.message.delta":
                    # Yield the text delta
                    if event.data.delta.content:
                        yield event.data.delta.content[0].text.value
            
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
        
        # Use simple completion for this task for speed/reliability
        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
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
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
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
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a healthcare training coordinator."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return {
            "recommendations": response.choices[0].message.content,
            "timestamp": datetime.now().isoformat()
        }
