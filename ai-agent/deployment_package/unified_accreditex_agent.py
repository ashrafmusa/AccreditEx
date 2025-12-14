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

# Import Firebase client
from firebase_client import firebase_client

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
        """Fetch comprehensive organizational data using enhanced Firebase client"""
        context = {
            "users_count": 0,
            "projects_count": 0,
            "active_projects": [],
            "assigned_projects": [],
            "high_risks": [],
            "recent_documents": [],
            "departments": [],
            "department_info": None,
            "user_role": "Unknown",
            "user_name": "User",
            "user_department": None,
            "user_permissions": [],
            "workspace_analytics": {}
        }
        
        if not self.db:
            logger.warning("Firebase not initialized, returning empty context")
            return context
        
        try:
            # Get comprehensive user context from Firebase client
            if user_id:
                user_context = firebase_client.get_user_context(user_id)
                
                if not user_context.get('error'):
                    # Extract user data
                    user_data = user_context.get('user_data', {})
                    context["user_role"] = user_data.get("role", "Unknown")
                    context["user_name"] = user_data.get("name", "User")
                    context["user_department"] = user_data.get("department")
                    context["user_permissions"] = user_data.get("permissions", [])
                    
                    # Extract assigned projects
                    context["assigned_projects"] = user_context.get('assigned_projects', [])
                    context["projects_count"] = len(context["assigned_projects"])
                    
                    # Extract department info
                    dept_info = user_context.get('department_info')
                    if dept_info:
                        context["department_info"] = {
                            "name": dept_info.get("name"),
                            "head": dept_info.get("head"),
                            "member_count": dept_info.get("memberCount", 0)
                        }
                    
                    # Extract recent documents
                    context["recent_documents"] = user_context.get('recent_documents', [])
                    
                    logger.info(f"✅ Retrieved user context: {context['user_name']} ({context['user_role']}) with {len(context['assigned_projects'])} projects")
            
            # Get workspace analytics
            analytics = firebase_client.get_workspace_analytics()
            if analytics:
                context["workspace_analytics"] = analytics
                context["active_projects"] = [{
                    "total": analytics.get('projects', {}).get('total', 0),
                    "active": analytics.get('projects', {}).get('active', 0),
                    "completed": analytics.get('projects', {}).get('completed', 0)
                }]
                
                # Get high/critical risks from analytics
                context["high_risks"] = [{
                    "total": analytics.get('risks', {}).get('total', 0),
                    "high": analytics.get('risks', {}).get('high', 0),
                    "critical": analytics.get('risks', {}).get('critical', 0)
                }]
                
                context["users_count"] = analytics.get('users', {}).get('total', 0)
                context["departments"] = [f"{analytics.get('departments', {}).get('total', 0)} departments"]
                
                logger.info(f"✅ Retrieved workspace analytics: {analytics.get('projects', {}).get('total', 0)} total projects")
            
        except Exception as e:
            logger.error(f"Error fetching organization context: {e}")
            import traceback
            traceback.print_exc()
        
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

RESPONSE FORMAT:
**ALWAYS format your responses in Markdown** for better readability:
- Use **## Headings** for main sections
- Use **### Sub-headings** for subsections
- Use **bold** for emphasis on key terms
- Use bullet points (- ) or numbered lists (1. ) for structured information
- Use `code formatting` for technical terms or standards references
- Use > blockquotes for important warnings or key takeaways
- Add line breaks between sections for clarity

Example structure:
## Analysis Summary
Brief overview of the issue...

### Key Findings
1. **First finding**: Explanation...
2. **Second finding**: Explanation...

### Recommendations
- **Immediate Actions**: What to do now
- **Follow-up Steps**: Next steps

> **Important**: Critical note or warning

TONE AND STYLE:
- Professional, encouraging, and authoritative but accessible.
- Use clear, structured formatting with proper Markdown.
- Be proactive: suggest next steps or related checks.
- Always provide actionable, specific advice.
"""

        # Add dynamic context if provided
        if context:
            # Check if frontend context (preferred)
            current_data = context.get('current_data', {})
            org_context = context.get('organization', {})
            
            # Use frontend data if available, fallback to organization context
            user_name = current_data.get('user_name', org_context.get('user_name', 'Unknown'))
            user_role = context.get('user_role', org_context.get('user_role', 'Unknown'))
            user_department = current_data.get('user_department', org_context.get('user_department', 'Not specified'))
            
            base_prompt += f"""
\nCURRENT ORGANIZATION CONTEXT:
- **User**: {user_name}
- **Role**: {user_role}
- **Department**: {user_department}
"""
            
            # Add assigned projects (frontend format first, fallback to org_context)
            assigned_projects = current_data.get('assigned_projects', org_context.get('assigned_projects', []))
            if assigned_projects:
                base_prompt += f"\n**Your Assigned Projects** ({len(assigned_projects)} total):\n"
                for proj in assigned_projects[:5]:  # Show first 5
                    base_prompt += f"- **{proj.get('name', 'Unnamed')}**: {proj.get('progress', 0)}% complete ({proj.get('status', 'Unknown')})\n"
            
            # Add department info (frontend format first)
            dept_info = current_data.get('department_info', org_context.get('department_info'))
            if dept_info:
                base_prompt += f"\n**Department Information**:\n"
                base_prompt += f"- Department: {dept_info.get('name', 'Unknown')}\n"
                if dept_info.get('head'):
                    base_prompt += f"- Department Head: {dept_info.get('head')}\n"
                if dept_info.get('member_count'):
                    base_prompt += f"- Team Size: {dept_info.get('member_count', 0)} members\n"
            
            # Add recent documents (frontend format first)
            recent_docs = current_data.get('recent_documents', org_context.get('recent_documents', []))
            if recent_docs:
                base_prompt += f"\n**Recent Documents** (Last {len(recent_docs)}):\n"
                for doc in recent_docs[:3]:  # Show first 3
                    base_prompt += f"- {doc.get('name', 'Unnamed')} ({doc.get('type', 'Unknown')}, {doc.get('status', 'Unknown')})\n"
            
            # Add workspace analytics (frontend provides total counts directly)
            total_projects = current_data.get('total_projects', 0)
            total_users = current_data.get('total_users', 0)
            total_departments = current_data.get('total_departments', 0)
            active_projects = current_data.get('active_projects_count', 0)
            
            # Fallback to organization analytics if frontend data not available
            if not total_projects:
                analytics = org_context.get('workspace_analytics', {})
                projects = analytics.get('projects', {})
                risks = analytics.get('risks', {})
                total_projects = projects.get('total', 0)
                active_projects = projects.get('active', 0)
                total_departments = analytics.get('departments', {}).get('total', 0)
            
            if total_projects > 0 or total_users > 0:
                base_prompt += f"""
\n**Workspace Overview**:
- Total Projects: {total_projects} ({active_projects} active)
- Total Users: {total_users}
- Total Departments: {total_departments}
"""
            
            base_prompt += f"""
\n**IMPORTANT**: Use this context to provide personalized, data-driven advice:
- Reference the user's actual projects by name when relevant
- Consider their role and permissions when making recommendations
- Highlight risks or issues in their specific projects
- Provide department-specific compliance guidance
- Reference recent documents they've worked on

Always be specific and actionable, using real data from their workspace.
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
            
            # PRIORITY: Use frontend context if provided (it already has all the data!)
            if context and context.get('current_data'):
                logger.info(f"✅ Using frontend context: {context.get('current_data', {}).get('total_projects', 0)} projects")
                enhanced_context = context
            else:
                # Fallback: Fetch organization context from Firebase (legacy path)
                logger.info("⚠️ No frontend context, fetching from Firebase...")
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

    async def get_project_insights(self, project_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get AI-generated insights for a specific project using Firebase data
        """
        try:
            project = firebase_client.get_project_details(project_id)
            
            if not project:
                return {'error': 'Project not found'}
            
            # Build comprehensive insight prompt
            prompt = f"""Analyze this accreditation project and provide strategic insights:

**Project**: {project['name']}
**Status**: {project['status']}
**Progress**: {project['progress']}%

**Compliance Statistics**:
- Total Standards: {project['statistics']['total_standards']}
- Compliant: {project['statistics']['compliant']}
- Non-Compliant: {project['statistics']['non_compliant']}
- Partially Compliant: {project['statistics']['partially_compliant']}
- Compliance Rate: {project['statistics']['compliance_rate']:.1f}%

**CAPAs**:
- Total: {project['capas']}
- Open: {project['open_capas']}

**Critical Findings**: {project['critical_findings']}
**Mock Surveys**: {project['mock_surveys']}

Provide a comprehensive analysis with:
1. **Top 3 Priorities** to improve compliance (be specific)
2. **Risk Assessment**: What could prevent successful accreditation?
3. **Recommended Next Actions**: Concrete steps to take now
4. **Timeline Concerns**: Any deadlines or scheduling issues to address

Format your response in clear Markdown with headings and bullet points."""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert healthcare accreditation consultant providing strategic project insights."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2048
            )
            
            return {
                'project_id': project_id,
                'project_name': project['name'],
                'insights': response.choices[0].message.content,
                'statistics': project['statistics'],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating project insights: {e}")
            return {'error': str(e)}

    async def search_documents_ai(self, query: str, user_id: str, document_type: Optional[str] = None) -> Dict[str, Any]:
        """
        AI-powered document search with relevance ranking
        """
        try:
            # Search Firebase
            results = firebase_client.search_documents(query, document_type)
            
            if not results:
                return {
                    'query': query,
                    'results': [],
                    'message': 'No documents found matching your search'
                }
            
            # Get AI to rank and explain results
            results_text = "\n".join([
                f"{i+1}. {doc['name']} ({doc['type']}, v{doc['version']})"
                for i, doc in enumerate(results)
            ])
            
            prompt = f"""User searched for: "{query}"

Found documents:
{results_text}

Rank these documents by relevance to the search query and explain why each is relevant.
Format with clear headings and bullet points."""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a document management expert helping users find relevant compliance documents."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=1024
            )
            
            return {
                'query': query,
                'results': results,
                'ai_analysis': response.choices[0].message.content,
                'count': len(results),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in AI document search: {e}")
            return {'error': str(e)}

    async def get_user_training_status_ai(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's training status with AI recommendations
        """
        try:
            training_status = firebase_client.get_user_training_status(user_id)
            
            if training_status.get('error'):
                return training_status
            
            # Generate AI recommendations
            prompt = f"""Analyze this training status and provide recommendations:

**Training Completion**:
- Total Modules: {training_status['total_modules']}
- Completed: {training_status['completed']}
- Completion Rate: {training_status['completion_rate']:.1f}%
- Pending: {training_status['pending_modules']}

Provide:
1. **Assessment**: Brief evaluation of training progress
2. **Priority Modules**: Which pending training should be completed first
3. **Timeline**: Suggested completion schedule
4. **Impact**: How this training affects compliance readiness

Format with clear Markdown headings."""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a healthcare training coordinator providing personalized training recommendations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1024
            )
            
            return {
                **training_status,
                'ai_recommendations': response.choices[0].message.content,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting training status: {e}")
            return {'error': str(e)}

