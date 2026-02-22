import os
import json
import asyncio
import time
import hashlib
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

# AccreditEx Unified AI Agent
# Week 1: Quick Wins + Week 2: Agent Specialization

# Import Firebase client
from firebase_client import firebase_client
from monitoring import performance_monitor
from document_analyzer import document_analyzer

# Import specialist prompts (Quick Win 1)
from specialist_prompts import (
    TASK_ROUTING_MAP,
    get_compliance_specialist_prompt,
    get_risk_assessment_specialist_prompt,
    get_training_specialist_prompt,
    get_general_agent_prompt
)

# Import context manager (Quick Win 3)
from context_manager import ContextManager

# Week 2 imports - Specialist Agents
from agents import (
    ComplianceAgent,
    RiskAssessmentAgent,
    TrainingCoordinator
)

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
        
        # Initialize Firebase
        self.db = firebase_client.db
        if self.db:
            logger.info("✅ Firebase database connected")
        else:
            logger.warning("⚠️ Firebase database not initialized!")
        
        # Model configuration — primary + fallback for rate limits
        self.model = "llama-3.3-70b-versatile"
        self.fallback_model = "llama-3.1-8b-instant"
        self.temperature = 0.7
        self.max_tokens = 4096
        
        # Response cache — avoids hitting the API for identical prompts
        self._response_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl = 600  # 10 minutes
        
        # Initialize context manager (3-tier system)
        try:
            self.context_manager = ContextManager()
            logger.info("✅ Context Manager initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Context Manager: {e}")
            # Fallback to basic context handling if needed
            self.context_manager = None
        
        # Initialize specialist agents (Week 2 - Agent Specialization)
        logger.info("🤖 Initializing specialist agents...")
        self.compliance_agent = ComplianceAgent(self.client, firebase_client)
        self.risk_agent = RiskAssessmentAgent(self.client, firebase_client)
        self.training_agent = TrainingCoordinator(self.client, firebase_client)
        logger.info("✅ All specialist agents initialized")
        
        # Conversation history (managed manually since not using Assistants API)
        # In production, this should be in Redis or Firestore
        self.conversations: Dict[str, List[Dict[str, str]]] = {}

        # Routing mode and telemetry (additive, safe)
        self.strict_specialist_routing = os.getenv("STRICT_SPECIALIST_ROUTING", "true").lower() == "true"
        self.routing_metrics: Dict[str, Any] = {
            "total_requests": 0,
            "by_task_type": {
                "compliance": 0,
                "risk": 0,
                "training": 0,
                "general": 0
            },
            "by_route_mode": {
                "specialist": 0,
                "legacy": 0,
                "legacy-fallback": 0
            },
            "failures": 0,
            "avg_latency_ms": {
                "compliance": 0.0,
                "risk": 0.0,
                "training": 0.0,
                "general": 0.0
            },
            "_latency_samples": {
                "compliance": 0,
                "risk": 0,
                "training": 0,
                "general": 0
            }
        }
        
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
        logger.info(f"✅ Agent initialized using model: {self.model} (fallback: {self.fallback_model})")

    # ── Response cache helpers ───────────────────────────────────────
    def _cache_key(self, text: str) -> str:
        return hashlib.sha256(text.encode()).hexdigest()

    def _cache_get(self, key: str) -> Optional[str]:
        entry = self._response_cache.get(key)
        if entry and time.time() < entry['expires']:
            logger.info("✅ Cache HIT — returning cached response (0 tokens used)")
            return entry['value']
        if entry:
            del self._response_cache[key]
        return None

    def _cache_set(self, key: str, value: str):
        self._response_cache[key] = {
            'value': value,
            'expires': time.time() + self._cache_ttl
        }
        # Evict old entries (keep max 200)
        if len(self._response_cache) > 200:
            oldest = min(self._response_cache, key=lambda k: self._response_cache[k]['expires'])
            del self._response_cache[oldest]

    # ── Rate-limit-aware API call ────────────────────────────────────
    async def _create_completion(self, messages, stream=True, max_tokens=None, temperature=None):
        """Call Groq with automatic fallback to lighter model on 429."""
        kwargs = {
            'model': self.model,
            'messages': messages,
            'stream': stream,
            'temperature': temperature or self.temperature,
            'max_tokens': max_tokens or 1024,
        }
        try:
            return await self.client.chat.completions.create(**kwargs)
        except Exception as e:
            error_str = str(e)
            if '429' in error_str or 'rate_limit' in error_str.lower():
                logger.warning(f"⚠️ Rate-limited on {self.model}, falling back to {self.fallback_model}")
                kwargs['model'] = self.fallback_model
                return await self.client.chat.completions.create(**kwargs)
            raise

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

    def detect_task_type(self, message: str) -> str:
        """
        Detect task type from message keywords
        Returns: 'compliance', 'risk', 'training', or 'general'
        """
        message_lower = message.lower()
        
        # Count keyword matches for each type
        type_scores = {}
        for task_type, keywords in TASK_ROUTING_MAP.items():
            score = sum(1 for keyword in keywords if keyword in message_lower)
            if score > 0:
                type_scores[task_type] = score
        
        # Return type with highest score, or 'general' if no matches
        if type_scores:
            detected_type = max(type_scores, key=type_scores.get)
            logger.info(f"🎯 Task type detected: {detected_type} (confidence: {type_scores[detected_type]} keywords)")
            return detected_type
        # Check for compliance keywords
        compliance_keywords = TASK_ROUTING_MAP.get('compliance', [])
        if any(keyword in message_lower for keyword in compliance_keywords):
            logger.info(f"🎯 Task type detected: compliance")
            return 'compliance'
        
        # Check for risk keywords
        risk_keywords = TASK_ROUTING_MAP.get('risk', [])
        if any(keyword in message_lower for keyword in risk_keywords):
            logger.info(f"🎯 Task type detected: risk")
            return 'risk'
        
        # Check for training keywords
        training_keywords = TASK_ROUTING_MAP.get('training', [])
        if any(keyword in message_lower for keyword in training_keywords):
            logger.info(f"🎯 Task type detected: training")
            return 'training'
        
        logger.info(f"🎯 Task type detected: general")
        return 'general'

    def _record_routing_metric(self, task_type: str, route_mode: str, latency_ms: float, success: bool = True):
        """Record routing telemetry for audit and release checks."""
        metrics = self.routing_metrics
        safe_task_type = task_type if task_type in metrics["by_task_type"] else "general"
        safe_route_mode = route_mode if route_mode in metrics["by_route_mode"] else "legacy"

        metrics["total_requests"] += 1
        metrics["by_task_type"][safe_task_type] += 1
        metrics["by_route_mode"][safe_route_mode] += 1

        if not success:
            metrics["failures"] += 1

        sample_count = metrics["_latency_samples"][safe_task_type] + 1
        current_avg = metrics["avg_latency_ms"][safe_task_type]
        metrics["avg_latency_ms"][safe_task_type] = ((current_avg * (sample_count - 1)) + latency_ms) / sample_count
        metrics["_latency_samples"][safe_task_type] = sample_count

    def get_routing_metrics(self) -> Dict[str, Any]:
        """Expose routing telemetry without internal counters."""
        return {
            "strict_specialist_routing": self.strict_specialist_routing,
            "total_requests": self.routing_metrics["total_requests"],
            "by_task_type": dict(self.routing_metrics["by_task_type"]),
            "by_route_mode": dict(self.routing_metrics["by_route_mode"]),
            "failures": self.routing_metrics["failures"],
            "avg_latency_ms": {
                key: round(value, 2)
                for key, value in self.routing_metrics["avg_latency_ms"].items()
            }
        }
    
    async def route_to_specialist(
        self,
        task_type: str,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Route request to appropriate specialist agent (Week 2)
        
        Args:
            task_type: Type of task (compliance/risk/training/general)
            message: User message
            context: Optional context dictionary
            stream: Whether to stream response
            
        Yields:
            Response chunks from specialist
        """
        logger.info(f"📋 Routing to specialist: {task_type}")
        
        # Route to appropriate specialist
        if task_type == 'compliance':
            async for chunk in self.compliance_agent.chat(message, context, stream):
                yield chunk
                
        elif task_type == 'risk':
            async for chunk in self.risk_agent.chat(message, context, stream):
                yield chunk
                
        elif task_type == 'training':
            async for chunk in self.training_agent.chat(message, context, stream):
                yield chunk
                
        else:
            # Fallback to unified agent for general queries
            logger.info("📝 Using unified agent for general query")
            async for chunk in self._general_chat(message, context, stream):
                yield chunk
    
    async def _general_chat(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Handle general (non-specialist) chat queries
        
        Args:
            message: User message
            context: Optional context
            stream: Whether to stream
            
        Yields:
            Response chunks
        """
        # Get general agent prompt
        system_prompt = get_general_agent_prompt()
        
        # Add context if available
        if context:
            org_context = context.get('organization', {})
            if org_context:
                system_prompt += self._format_context_for_prompt(org_context)
        
        # Create messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ]
        
        # Stream response
        stream_response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            stream=stream
        )
        
        if stream:
            async for chunk in stream_response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        else:
            response = stream_response.choices[0].message.content
            yield response
    
    def _format_context_for_prompt(self, org_context: Dict[str, Any]) -> str:
        """Format organization context for system prompt"""
        context_text = "\n\n**Organization Context**:\n"
        
        if org_context.get('user_name'):
            context_text += f"- User: {org_context['user_name']} ({org_context.get('user_role', 'Unknown')})\n"
        
        if org_context.get('projects_count'):
            context_text += f"- Projects: {org_context['projects_count']}\n"
        
        if org_context.get('high_risks'):
            context_text += f"- High Risks: {len(org_context['high_risks'])}\n"
        
        return context_text

    def _get_base_system_prompt(self, context: Optional[Dict[str, Any]] = None, ai_instructions: Optional[Dict[str, Any]] = None, task_type: str = 'general') -> str:
        """
        Get the system prompt with dynamic context and specialist routing
        
        Args:
            context: Application context (user, page, data)
            task_type: Type of task (compliance, risk, training, general)
        """
        
        # Select specialist prompt based on task type
        if task_type == 'compliance':
            base_prompt = get_compliance_specialist_prompt()
            logger.info("📋 Using Compliance Specialist prompt")
        elif task_type == 'risk':
            base_prompt = get_risk_assessment_specialist_prompt()
            logger.info("⚠️ Using Risk Assessment Specialist prompt")
        elif task_type == 'training':
            base_prompt = get_training_specialist_prompt()
            logger.info("🎓 Using Training Coordinator prompt")
        else:
            base_prompt = get_general_agent_prompt()
            logger.info("💬 Using General Agent prompt")
        
        # Add dynamic context if provided
        if context:
            org_context = context.get('organization', {})
            current_data = context.get('current_data', {})
            
            base_prompt += f"""
\nCURRENT ORGANIZATION CONTEXT:
- **User**: {context.get('user_name', org_context.get('user_name', 'Unknown'))}
- **Role**: {context.get('user_role', org_context.get('user_role', 'Unknown'))}
- **Department**: {context.get('user_department', org_context.get('user_department', 'Not specified'))}
"""
            
            # Add forms and templates information if available
            available_templates = current_data.get('available_templates', [])
            available_forms = current_data.get('available_forms', [])
            ai_instructions = current_data.get('ai_instructions', {})
            
            if available_templates or available_forms:
                base_prompt += f"""
\n**📋 AVAILABLE CONTENT & CAPABILITIES**:
- **Templates Available**: {len(available_templates)} (SOPs, Policies, Procedures, Manuals, Checklists)
- **Forms Available**: {len(available_forms)} (Incident Reports, Safety Checklists, Risk Assessments, Training Records, Audit Findings)
- **Context Awareness**: {ai_instructions.get('context_awareness', 'Full app access')}
- **Can Provide Forms**: {ai_instructions.get('can_provide_forms', True)}
- **Can Generate Documents**: {ai_instructions.get('can_generate_documents', True)}

**CRITICAL INSTRUCTIONS FOR FORM/TEMPLATE REQUESTS**:
1. When user asks for ANY form or template (incident report, safety checklist, policy, SOP, etc.):
   - IMMEDIATELY acknowledge you can provide it
   - List the specific form/template that matches their request
   - Offer to provide the complete content with all fields and structure
   - DO NOT say you don't have access - YOU DO HAVE ACCESS!

2. Available Form Categories: {', '.join(ai_instructions.get('available_form_categories', []))}
3. Available Template Categories: {', '.join(ai_instructions.get('available_template_categories', []))}

4. Example responses to form requests:
   - User: "I need an incident report" → "I can provide the Incident Report Form immediately! It includes fields for incident details, witnesses, corrective actions, and follows OHAS compliance requirements. Would you like me to show you the complete form?"
   - User: "Show me safety forms" → "I have several safety-related forms available: Safety Inspection Checklist, Incident Report Form, and Risk Assessment Form. Which one would you like to see?"

**Remember**: You have FULL ACCESS to all {len(available_templates)} templates and {len(available_forms)} forms. Provide them confidently when requested!
"""
            
            # Add assigned projects
            assigned_projects = org_context.get('assigned_projects', [])
            if assigned_projects:
                base_prompt += f"\n**Your Assigned Projects** ({len(assigned_projects)} total):\n"
                for proj in assigned_projects[:5]:  # Show first 5
                    base_prompt += f"- **{proj.get('name', 'Unnamed')}**: {proj.get('progress', 0)}% complete ({proj.get('status', 'Unknown')})\n"
            
            # Add department info
            dept_info = org_context.get('department_info')
            if dept_info:
                base_prompt += f"\n**Department Information**:\n"
                base_prompt += f"- Department: {dept_info.get('name', 'Unknown')}\n"
                base_prompt += f"- Department Head: {dept_info.get('head', 'Unknown')}\n"
                base_prompt += f"- Team Size: {dept_info.get('member_count', 0)} members\n"
            
            # Add recent documents
            recent_docs = org_context.get('recent_documents', [])
            if recent_docs:
                base_prompt += f"\n**Recent Documents** (Last {len(recent_docs)}):\n"
                for doc in recent_docs[:3]:  # Show first 3
                    base_prompt += f"- {doc.get('name', 'Unnamed')} ({doc.get('type', 'Unknown')}, {doc.get('status', 'Unknown')})\n"
            
            # Add workspace analytics
            analytics = org_context.get('workspace_analytics', {})
            if analytics:
                projects = analytics.get('projects', {})
                risks = analytics.get('risks', {})
                base_prompt += f"""
\n**Workspace Overview**:
- Total Projects: {projects.get('total', 0)} ({projects.get('active', 0)} active, {projects.get('completed', 0)} completed)
- High/Critical Risks: {risks.get('high', 0)}/{risks.get('critical', 0)}
- Departments: {analytics.get('departments', {}).get('total', 0)}
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
        Now with specialist routing, tiered context management, caching, and fallback model.
        """
        try:
            # ── Check response cache first (saves 100 % of tokens on repeat requests)
            cache_key = self._cache_key(message)
            cached = self._cache_get(cache_key)
            if cached:
                yield cached
                return

            # Generate thread_id if not provided
            if not thread_id:
                thread_id = f"thread_{datetime.now().timestamp()}"
            
            # Detect task type from message (Quick Win 1)
            task_type = self.detect_task_type(message)
            
            # ── Context loading — SKIP heavy Firebase fetch when frontend
            #    already omitted context (writing / document commands).
            user_id = context.get('user_id') if context else None
            has_context = bool(context and context.get('current_data'))

            if has_context and user_id:
                # Interactive chat — load tiered context
                context_tier = context.get('context_tier') if context else None
                if not context_tier:
                    context_tier = self.context_manager.detect_context_tier(message)
                tiered_context = self.context_manager.get_context(user_id, context_tier)
                logger.info(f"📦 Using {context_tier} context tier ({len(str(tiered_context))} chars)")
                org_context = await self._get_organization_context(user_id)
                enhanced_context = {
                    **(context or {}),
                    **tiered_context,
                    'organization': org_context,
                    'user_role': tiered_context.get('user_role', org_context.get('user_role', 'Unknown'))
                }
            else:
                # Lightweight request (writing commands) — zero context overhead
                enhanced_context = context or {}
                logger.info("⚡ Lightweight request — skipping context fetch")
            
            # Initialize conversation history if new thread
            if thread_id not in self.conversations:
                self.conversations[thread_id] = [
                    {"role": "system", "content": self._get_base_system_prompt(context=enhanced_context if has_context else None, task_type=task_type)}
                ]
            else:
                self.conversations[thread_id][0] = {
                    "role": "system", 
                    "content": self._get_base_system_prompt(context=enhanced_context if has_context else None, task_type=task_type)
                }

            # Append user message
            self.conversations[thread_id].append({"role": "user", "content": message})

            routing_start = time.perf_counter()
            route_mode = "legacy"
            full_response = ""

            # Strict specialist dispatch for specialist task types (safe fallback enabled)
            if self.strict_specialist_routing and task_type in ("compliance", "risk", "training"):
                route_mode = "specialist"
                try:
                    async for chunk in self.route_to_specialist(
                        task_type=task_type,
                        message=message,
                        context=enhanced_context,
                        stream=True
                    ):
                        full_response += chunk
                        yield chunk

                    self.conversations[thread_id].append({"role": "assistant", "content": full_response})
                    latency_ms = (time.perf_counter() - routing_start) * 1000
                    self._record_routing_metric(task_type, route_mode, latency_ms, success=True)
                    self._cache_set(cache_key, full_response)
                    return
                except Exception as specialist_error:
                    logger.error(f"Specialist routing failed, falling back to legacy path: {specialist_error}")
                    latency_ms = (time.perf_counter() - routing_start) * 1000
                    self._record_routing_metric(task_type, route_mode, latency_ms, success=False)
                    route_mode = "legacy-fallback"

            
            # Keep history manageable (last 6 messages + system prompt — reduced from 10)
            if len(self.conversations[thread_id]) > 7:
                self.conversations[thread_id] = [self.conversations[thread_id][0]] + self.conversations[thread_id][-6:]

            # Stream response with automatic fallback on rate limit
            stream = await self._create_completion(
                messages=self.conversations[thread_id],
                stream=True,
                max_tokens=1024,
                temperature=0.7,
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield content
            
            # Append to history + cache
            self.conversations[thread_id].append({"role": "assistant", "content": full_response})
            latency_ms = (time.perf_counter() - routing_start) * 1000
            self._record_routing_metric(task_type, route_mode, latency_ms, success=True)
            self._cache_set(cache_key, full_response)
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            self._record_routing_metric('general', 'legacy', 0.0, success=False)
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

