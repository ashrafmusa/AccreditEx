import os
import json
import asyncio
import time
import hashlib
import re
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
from agent_utils import build_workspace_snapshot, build_grounding_prompt, grounding_from_context, build_lightweight_chat_prompt
from skills.response_standard import STANDARD_RESPONSE_RULES, TRUNCATED_RESPONSE_MARKER, FAILED_RESPONSE_MARKER, apply_response_language, build_standard_response, response_token_budget

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
        self.last_llm_error: Optional[str] = None
        self.db = None
        
        # Initialize Groq client using OpenAI SDK
        # Groq is compatible with OpenAI's API structure
        api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
        base_url = "https://api.groq.com/openai/v1" if os.getenv("GROQ_API_KEY") else None
        
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )
        self._model_substitutions: Dict[str, str] = {}
        self._install_model_resolver()
        
        # Initialize Firebase
        self.db = firebase_client.db
        if self.db:
            logger.info("✅ Firebase database connected")
        else:
            logger.warning("⚠️ Firebase database not initialized!")
        
        # Model configuration — primary + fallback for rate limits
        self.model = os.getenv("GROQ_MODEL") or os.getenv("MODEL_NAME") or "openai/gpt-oss-120b"
        self.fast_model = os.getenv("FAST_MODEL") or "openai/gpt-oss-20b"
        self.fallback_model = os.getenv("GROQ_FALLBACK_MODEL") or os.getenv("FALLBACK_MODEL") or self.fast_model
        self._available_models = None
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

    # ── Model availability resolver ──────────────────────────────────
    _MODEL_PREFERENCE = (
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3-32b",
    )
    _RETIRED_MODELS = {
        "llama-3.1-8b-instant": "openai/gpt-oss-20b",
        "llama-3.3-70b-versatile": "openai/gpt-oss-120b",
        "llama-3.1-70b-versatile": "openai/gpt-oss-120b",
        "meta-llama/llama-4-scout-17b-16e-instruct": "openai/gpt-oss-120b",
    }
    _NON_CHAT_MARKERS = ("whisper", "guard", "tts", "playai", "orpheus", "embed")

    def _install_model_resolver(self) -> None:
        """Wrap chat.completions.create so a missing model falls back to one the key can access."""
        original_create = self.client.chat.completions.create

        async def create_with_resolution(*args, **kwargs):
            if isinstance(kwargs.get('messages'), list):
                kwargs['messages'] = apply_response_language(kwargs['messages'])
            requested = kwargs.get('model')
            requested = self._RETIRED_MODELS.get(requested, requested)
            kwargs["model"] = requested
            # Explicit fallback IDs must never resolve back to the exhausted primary.
            fallback = getattr(self, "fallback_model", None)
            is_fallback = requested == self._RETIRED_MODELS.get(fallback, fallback)
            if is_fallback or requested in self._MODEL_PREFERENCE:
                self._model_substitutions.pop(requested, None)
            elif requested in self._model_substitutions:
                kwargs['model'] = self._model_substitutions[requested]
            try:
                return await original_create(*args, **kwargs)
            except Exception as e:
                text = str(e).lower()
                is_missing = getattr(e, 'status_code', None) == 404 or 'model_not_found' in text
                if not (is_missing and requested):
                    raise
                if is_fallback or requested in self._MODEL_PREFERENCE:
                    raise
                replacement = await self._discover_model(exclude=kwargs.get('model'))
                if not replacement:
                    raise
                logger.warning(f"⚠️ Model {kwargs.get('model')} unavailable, switching to {replacement}")
                self._model_substitutions[requested] = replacement
                kwargs['model'] = replacement
                return await original_create(*args, **kwargs)

        self.client.chat.completions.create = create_with_resolution

    async def _discover_model(self, exclude: Optional[str] = None) -> Optional[str]:
        """Pick the best chat model this API key can actually access."""
        try:
            listing = await self.client.models.list()
            available = [m.id for m in listing.data if m.id != exclude]
        except Exception as e:
            logger.error(f"Could not list available models: {type(e).__name__}")
            return None
        chat_models = [m for m in available if not any(x in m.lower() for x in self._NON_CHAT_MARKERS)]
        for preferred in self._MODEL_PREFERENCE:
            if preferred in chat_models:
                return preferred
        return chat_models[0] if chat_models else None

    async def _supported_model(self, requested: str) -> str:
        requested = self._RETIRED_MODELS.get(requested, requested)
        if self._available_models is None:
            try:
                listing = await self.client.models.list()
                self._available_models = {item.id for item in listing.data}
            except Exception as error:
                raise RuntimeError("AI model availability could not be verified.") from error
        if requested not in self._available_models:
            raise RuntimeError("Configured AI model is unavailable.")
        return requested

    # ── Rate-limit-aware API call ────────────────────────────────────
    async def _create_completion(self, messages, stream=False, max_tokens=None, temperature=None, model=None):
        """Call Groq with automatic fallback to lighter model on 429."""
        kwargs = {
            'model': await self._supported_model(model or self.model),
            'messages': messages,
            'stream': stream,
            'temperature': temperature or self.temperature,
            'max_tokens': max_tokens or 1024,
        }
        try:
            result = await self.client.chat.completions.create(**kwargs)
            self.last_llm_error = None
            return result
        except Exception as e:
            self.last_llm_error = f"{type(e).__name__} status={getattr(e, 'status_code', None)}"
            error_str = str(e)
            if getattr(e, "status_code", None) == 429 or '429' in error_str or 'rate_limit' in error_str.lower():
                requested_fallback = self.fallback_model
                if self._RETIRED_MODELS.get(requested_fallback, requested_fallback) == kwargs["model"]:
                    requested_fallback = self.model if kwargs["model"] != self._RETIRED_MODELS.get(self.model, self.model) else self.fast_model
                fallback = await self._supported_model(requested_fallback)
                if fallback == kwargs["model"]:
                    self.last_llm_error = "All configured models exhausted: fallback duplicates primary"
                    raise RuntimeError("All configured AI models are unavailable; please retry later.") from e
                logger.warning(f"Rate-limited on {kwargs['model']}, falling back to {fallback}")
                kwargs['model'] = fallback
                try:
                    result = await self.client.chat.completions.create(**kwargs)
                    self.last_llm_error = None
                    return result
                except Exception as e2:
                    self.last_llm_error = f"All configured models exhausted: fallback {type(e2).__name__} status={getattr(e2, 'status_code', None)}"
                    raise RuntimeError("All configured AI models are unavailable; please retry later.") from e2
            raise

    def _estimate_quality_confidence(self, text: str) -> float:
        """Simple deterministic quality score for workflow output confidence."""
        if not text:
            return 0.4
        length = len(text)
        sections = 0
        for marker in ("1.", "2.", "3.", "-", "**"):
            if marker in text:
                sections += 1

        if length > 1200 and sections >= 4:
            return 0.9
        if length > 700 and sections >= 3:
            return 0.82
        if length > 350:
            return 0.74
        return 0.62

    def _build_workflow_response(
        self,
        field_name: str,
        content: str,
        response_type: Optional[str] = None,
        title: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Build the standard AI response payload (keeps the legacy field for old clients)."""
        return build_standard_response(
            response_type or field_name,
            content,
            title=title,
            model=self.model,
            legacy_field=field_name,
            extra=extra,
        )

    async def _get_organization_context(self, user_id: Optional[str] = None, organization_id: Optional[str] = None) -> Dict[str, Any]:
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
                user_context = firebase_client.get_user_context(user_id, organization_id)
                
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
            if organization_id:
                analytics = firebase_client.get_workspace_analytics(organization_id)
            else:
                analytics = {}
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

        # Explicit "log/create a risk or CAPA" requests need the conversational path,
        # which carries the action-card instructions; specialists return JSON reports.
        if re.search(
            r"\b(log|add|register|create|raise|open|propose)\b[^.?!]{0,40}\b(risk|capa)\b",
            message_lower,
        ):
            logger.info("🎯 Task type detected: general (action request)")
            return 'general'

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
        if context and context.get("current_data"):
            specialist = {"compliance": self.compliance_agent, "risk": self.risk_agent,
                          "training": self.training_agent}.get(task_type)
            if specialist:
                messages = [{"role": "system", "content": specialist.get_full_prompt(context) + STANDARD_RESPONSE_RULES},
                            {"role": "user", "content": message}]
                response = await self._create_completion(
                    messages=messages, stream=stream, model=self.fast_model,
                    max_tokens=response_token_budget(True, apply_response_language(messages)))
                if stream:
                    async for chunk in response:
                        if chunk.choices[0].finish_reason == "length":
                            yield TRUNCATED_RESPONSE_MARKER
                            return
                        if chunk.choices[0].delta.content:
                            yield chunk.choices[0].delta.content
                else:
                    yield response.choices[0].message.content
                return
        
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
        system_prompt = get_general_agent_prompt() + build_workspace_snapshot(context)
        # Add context if available
        if context:
            org_context = context.get('organization', {})
            if org_context:
                system_prompt += self._format_context_for_prompt(org_context)
        
        # Create messages
        messages = [
            {"role": "system", "content": system_prompt + STANDARD_RESPONSE_RULES},
            {"role": "user", "content": message}
        ]
        
        # Stream response
        stream_response = await self._create_completion(
            model=self.fast_model,
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
        if context is not None and not context.get("current_data"):
            return build_lightweight_chat_prompt(context, task_type)
        
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
            
            # Live workspace snapshot sent from the user's own session (authoritative)
            ws_projects = current_data.get('workspace_projects') or []
            if ws_projects or current_data.get('total_projects') is not None:
                base_prompt += "\n**LIVE WORKSPACE SNAPSHOT (authoritative - answer from this data, never claim you lack access to it)**:\n"
                base_prompt += (
                    f"- Projects: {current_data.get('total_projects', len(ws_projects))} | "
                    f"Documents: {current_data.get('total_documents', 0)} | "
                    f"Departments: {current_data.get('total_departments', 0)} | "
                    f"Users: {current_data.get('total_users', 0)} | "
                    f"Open risks: {current_data.get('open_risks_count', 0)}\n"
                )
                for p in ws_projects[:25]:
                    total = p.get('checklist_total', 0) or 0
                    done = p.get('compliant', 0) or 0
                    pct = round(100 * done / total) if total else 0
                    base_prompt += (
                        f"- {str(p.get('name', 'Unnamed'))[:80]} [{p.get('status', '?')}]: "
                        f"{pct}% compliant ({done}/{total} items; partial {p.get('partial', 0)}, "
                        f"non-compliant {p.get('non_compliant', 0)}, not started {p.get('not_started', 0)})"
                        f"{', lead: ' + str(p['lead']) if p.get('lead') else ', no lead assigned'}\n"
                    )

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
        return base_prompt + build_grounding_prompt(grounding_from_context(context)) + STANDARD_RESPONSE_RULES

    async def chat(self, message: str, thread_id: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> AsyncGenerator[str, None]:
        """
        Chat with the agent using streaming responses (Standard Chat Completions)
        Now with specialist routing, tiered context management, caching, and fallback model.
        """
        try:
            scope_org = (context or {}).get('organization_id') or 'anon'
            scope_user = (context or {}).get('user_id') or 'anon'
            lightweight = context is not None and not context.get("current_data")

            # Cache only context-free requests, and namespace by tenant+user so
            # one organization can never be served another's cached answer.
            cacheable = not lightweight and not (context and (context.get('current_data') or grounding_from_context(context) is not None))
            cache_key = self._cache_key(f"{scope_org}|{scope_user}|{message}")
            if cacheable:
                cached = self._cache_get(cache_key)
                if cached:
                    yield cached
                    return

            # Namespace threads by tenant+user so client-supplied IDs can't cross tenants
            if not thread_id:
                thread_id = f"thread_{datetime.now().timestamp()}"
            thread_id = f"{scope_org}:{scope_user}:{thread_id}"
            if not lightweight and len(self.conversations) > 500 and thread_id not in self.conversations:
                self.conversations.pop(next(iter(self.conversations)))
            
            # Detect task type from message (Quick Win 1)
            task_type = self.detect_task_type(message)
            
            # ── Context loading — SKIP heavy Firebase fetch when frontend
            #    already omitted context (writing / document commands).
            user_id = context.get('user_id') if context else None
            organization_id = context.get('organization_id') if context else None
            has_context = bool(context and context.get('current_data'))

            if has_context and user_id:
                # Interactive chat — load tiered context
                context_tier = context.get('context_tier') if context else None
                if not context_tier:
                    context_tier = self.context_manager.detect_context_tier(message)
                tiered_context = self.context_manager.get_context(user_id, context_tier, organization_id)
                logger.info(f"📦 Using {context_tier} context tier ({len(str(tiered_context))} chars)")
                org_context = await self._get_organization_context(user_id, organization_id)
                enhanced_context = {
                    **(context or {}),
                    **tiered_context,
                    'organization': org_context,
                    'user_role': tiered_context.get('user_role', org_context.get('user_role', 'Unknown'))
                }
                # Tiered context must not replace the caller's selected source evidence.
                enhanced_context["current_data"] = {
                    **(tiered_context.get("current_data") or {}),
                    **(context.get("current_data") or {}),
                }
            else:
                # Lightweight request (writing commands) — zero context overhead
                enhanced_context = context or {}
                logger.info("⚡ Lightweight request — skipping context fetch")
            
            # Document commands are stateless, even when a frontend reuses a chat thread.
            if lightweight:
                messages = [
                    {"role": "system", "content": self._get_base_system_prompt(context=enhanced_context, task_type=task_type)}
                ]
            elif thread_id not in self.conversations:
                self.conversations[thread_id] = [
                    {"role": "system", "content": self._get_base_system_prompt(context=enhanced_context, task_type=task_type)}
                ]
                messages = self.conversations[thread_id]
            else:
                self.conversations[thread_id][0] = {
                    "role": "system", 
                    "content": self._get_base_system_prompt(context=enhanced_context, task_type=task_type)
                }
                messages = self.conversations[thread_id]

            # Append user message
            messages.append({"role": "user", "content": message})

            routing_start = time.perf_counter()
            route_mode = "legacy"
            full_response = ""

            # Strict specialist dispatch for specialist task types (safe fallback enabled)
            if not lightweight and self.strict_specialist_routing and task_type in ("compliance", "risk", "training"):
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

                    if TRUNCATED_RESPONSE_MARKER in full_response or FAILED_RESPONSE_MARKER in full_response:
                        return
                    self.conversations[thread_id].append({"role": "assistant", "content": full_response})
                    latency_ms = (time.perf_counter() - routing_start) * 1000
                    self._record_routing_metric(task_type, route_mode, latency_ms, success=True)
                    if cacheable:
                        self._cache_set(cache_key, full_response)
                    return
                except Exception as specialist_error:
                    logger.error(f"Specialist routing failed, falling back to legacy path: {specialist_error}")
                    latency_ms = (time.perf_counter() - routing_start) * 1000
                    self._record_routing_metric(task_type, route_mode, latency_ms, success=False)
                    route_mode = "legacy-fallback"

            
            # Keep history manageable (last 6 messages + system prompt — reduced from 10)
            if len(messages) > 7:
                messages = [messages[0]] + messages[-6:]
                self.conversations[thread_id] = messages

            # Stream response with automatic fallback on rate limit
            stream = await self._create_completion(
                model=self.fast_model if has_context else self.model,
                messages=messages,
                stream=True,
                max_tokens=response_token_budget(has_context, apply_response_language(messages)),
                temperature=0.7,
            )

            async for chunk in stream:
                if chunk.choices[0].finish_reason == "length":
                    logger.error("AI response exceeded its token budget; refusing to cache incomplete content")
                    yield TRUNCATED_RESPONSE_MARKER
                    return
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield content
            
            # Append to history + cache
            if not lightweight:
                messages.append({"role": "assistant", "content": full_response})
            latency_ms = (time.perf_counter() - routing_start) * 1000
            self._record_routing_metric(task_type, route_mode, latency_ms, success=True)
            if cacheable:
                self._cache_set(cache_key, full_response)
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            self._record_routing_metric('general', 'legacy', 0.0, success=False)
            yield FAILED_RESPONSE_MARKER

    async def check_document_compliance(self, document_type: str, standard: str, content_summary: str, requirements: Optional[List[str]] = None, ai_grounding: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
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
        
        response = await self._create_completion(
            messages=[
                {"role": "system", "content": "You are a compliance auditor. Never invent statistics or scores that are not supported by the provided content." + build_grounding_prompt(ai_grounding) + STANDARD_RESPONSE_RULES},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500
        )
        
        return self._build_workflow_response(
            "analysis",
            response.choices[0].message.content,
            response_type="compliance_check",
        )

    async def assess_risk(self, area: str, current_status: str, upcoming_review_date: str, critical_areas: Optional[List[str]] = None, ai_grounding: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Assess compliance risk for a specific area"""
        prompt = f"""
        Assess the compliance risk for: {area}
        Current Status: {current_status}
        Review Date: {upcoming_review_date}
        Critical Areas: {', '.join(critical_areas) if critical_areas else 'None specified'}
        
        Provide a risk assessment (Low/Medium/High) and immediate actions needed.
        """
        
        response = await self._create_completion(
            messages=[
                {"role": "system", "content": "You are a risk management expert. Never invent statistics that are not supported by the provided information." + build_grounding_prompt(ai_grounding) + STANDARD_RESPONSE_RULES},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500
        )
        
        return self._build_workflow_response(
            "assessment",
            response.choices[0].message.content,
            response_type="risk_assessment",
            extra={"risk_level": "Calculated"},
        )

    async def get_training_recommendations(self, role: str, competency_gaps: List[str], accreditation_focus: str, timeline: str, ai_grounding: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Get training recommendations based on role and gaps"""
        prompt = f"""
        Recommend training for Role: {role}
        Competency Gaps: {', '.join(competency_gaps)}
        Focus: {accreditation_focus}
        Timeline: {timeline}
        
        Suggest 3 specific training modules or activities.
        """
        
        response = await self._create_completion(
            messages=[
                {"role": "system", "content": "You are a healthcare training coordinator." + build_grounding_prompt(ai_grounding) + STANDARD_RESPONSE_RULES},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500
        )
        
        return self._build_workflow_response(
            "recommendations",
            response.choices[0].message.content,
            response_type="training_recommendations",
        )

    # ─────────────────────────────────────────────────────────────
    # Week 3: Dedicated AI Workflow Methods
    # ─────────────────────────────────────────────────────────────

    async def generate_action_plan(self, standard_id: str, item: str, status: str, findings: Optional[str] = None, ai_grounding: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate actionable compliance action plan"""
        system_prompt = f"""You are an expert compliance consultant helping create actionable action plans.

Your role is to:
1. Analyze non-compliant items
2. Provide specific, measurable, achievable actions
3. Suggest timelines and responsible parties
4. Identify required resources

Format response in clear sections with bullet points."""

        prompt = f"""Generate a detailed action plan for this compliance issue:

**Standard**: {standard_id}
**Non-Compliant Item**: {item}
**Current Status**: {status}
{f"**Additional Findings**: {findings}" if findings else ""}

Provide:
1. Root cause analysis
2. Specific corrective actions (3-5 actions)
3. Timeline for each action
4. Responsible parties
5. Success metrics
6. Required resources"""

        response = await self._create_completion(
            messages=[
                {"role": "system", "content": system_prompt + build_grounding_prompt(ai_grounding) + STANDARD_RESPONSE_RULES},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2048
        )

        return self._build_workflow_response(
            "action_plan",
            response.choices[0].message.content,
        )

    async def analyze_root_cause(self, issue_title: str, description: str, context: Optional[str] = None, affected_areas: Optional[List[str]] = None, ai_grounding: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Perform structured root cause analysis"""
        system_prompt = """You are a Root Cause Analysis expert using the "5 Whys" methodology and Fishbone Diagram thinking.

Your role is to:
1. Identify immediate causes
2. Dig deeper with systematic questioning
3. Identify systemic or process issues
4. Provide evidence-based recommendations"""

        affected = ", ".join(affected_areas) if affected_areas else "Not specified"
        prompt = f"""Perform root cause analysis for this issue:

**Issue Title**: {issue_title}
**Description**: {description}
{f"**Context**: {context}" if context else ""}
**Affected Areas**: {affected}

Use the 5 Whys methodology and provide:
1. Immediate cause
2. 5 Whys analysis (structured)
3. Root cause(s)
4. Contributing factors
5. Preventive and corrective actions
6. Implementation plan"""

        response = await self._create_completion(
            messages=[
                {"role": "system", "content": system_prompt + build_grounding_prompt(ai_grounding) + STANDARD_RESPONSE_RULES},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2048
        )

        return self._build_workflow_response(
            "root_cause_analysis",
            response.choices[0].message.content,
        )

    async def suggest_pdca_improvements(self, process_name: str, current_state: str, problem_identified: str, previous_actions: Optional[str] = None, ai_grounding: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Suggest Plan-Do-Check-Act improvements"""
        system_prompt = """You are a Quality Improvement specialist trained in PDCA (Plan-Do-Check-Act) methodology.

Your role is to:
1. Analyze the current process state
2. Design targeted improvements
3. Plan data collection and verification
4. Enable continuous improvement cycles"""

        prompt = f"""Suggest PDCA cycle improvements for this process:

**Process Name**: {process_name}
**Current State**: {current_state}
**Problem Identified**: {problem_identified}
{f"**Previous Actions Attempted**: {previous_actions}" if previous_actions else ""}

Provide a PDCA cycle with:
1. **PLAN**: What needs to change? (2-3 specific changes)
2. **DO**: How will you implement? (timeline, responsible parties)
3. **CHECK**: How will you verify effectiveness? (metrics, data to collect)
4. **ACT**: How will you standardize? (documentation, training, monitoring)
5. **Expected Outcomes**: What will success look like?"""

        response = await self._create_completion(
            messages=[
                {"role": "system", "content": system_prompt + build_grounding_prompt(ai_grounding) + STANDARD_RESPONSE_RULES},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2048
        )

        return self._build_workflow_response(
            "pdca_improvements",
            response.choices[0].message.content,
        )

    async def assess_survey_risk(self, standard: str, organization_area: str, readiness_level: str, critical_concerns: Optional[List[str]] = None, survey_date: Optional[str] = None, ai_grounding: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Assess readiness risk for upcoming accreditation survey"""
        system_prompt = f"""You are an accreditation survey readiness expert specializing in {standard} standards.

Your role is to:
1. Assess current readiness against standards
2. Identify high-risk areas
3. Prioritize corrective actions
4. Prepare for survey scenarios"""

        concerns = ", ".join(critical_concerns) if critical_concerns else "None specified"
        prompt = f"""Assess survey readiness risk:

**Standard**: {standard}
**Organization Area**: {organization_area}
**Current Readiness Level**: {readiness_level}
**Critical Concerns**: {concerns}
{f"**Survey Date**: {survey_date}" if survey_date else ""}

Provide:
1. **Readiness Assessment**: Overall readiness (Low/Medium/High) with justification
2. **High-Risk Areas**: Top 3-5 areas most likely to be cited
3. **Compliance Gaps**: Specific non-conformities that surveyors may find
4. **Priority Actions**: Immediate actions to take before survey
5. **Recommended Timeline**: Realistic completion dates
6. **Mock Survey Scenarios**: Likely surveyor questions and recommended responses"""

        response = await self._create_completion(
            messages=[
                {"role": "system", "content": system_prompt + build_grounding_prompt(ai_grounding) + STANDARD_RESPONSE_RULES},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2048
        )

        return self._build_workflow_response(
            "survey_risk_assessment",
            response.choices[0].message.content,
        )

    async def check_design_compliance(self, design_element: str, requirement: str, current_implementation: str, design_phase: Optional[str] = None, ai_grounding: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Assess design control compliance"""
        system_prompt = """You are a Design Control and Quality Assurance expert in healthcare.

Your role is to:
1. Evaluate design against requirements
2. Identify compliance gaps
3. Recommend design changes
4. Ensure traceability to requirements"""

        phase_info = f"Design Phase: {design_phase}" if design_phase else ""
        prompt = f"""Assess design control compliance:

**Design Element**: {design_element}
**Applicable Requirement**: {requirement}
**Current Implementation**: {current_implementation}
{phase_info}

Provide:
1. **Compliance Status**: Compliant/Non-Compliant/Conditionally Compliant
2. **Gap Analysis**: What's missing or needs improvement?
3. **Risk Assessment**: What are the compliance and patient safety risks?
4. **Design Changes Recommended**: Specific modifications needed
5. **Verification Plan**: How to verify compliance after changes
6. **Validation Plan**: How to prove design meets requirements
7. **Traceability**: Link back to original requirements"""

        response = await self._create_completion(
            messages=[
                {"role": "system", "content": system_prompt + build_grounding_prompt(ai_grounding) + STANDARD_RESPONSE_RULES},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2048
        )

        return self._build_workflow_response(
            "design_compliance_assessment",
            response.choices[0].message.content,
        )

    async def get_project_insights(self, project_id: str, user_id: str, organization_id: str) -> Dict[str, Any]:
        """
        Get AI-generated insights for a specific project using Firebase data
        """
        try:
            project = firebase_client.get_project_details(project_id, organization_id)
            
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
                    {"role": "system", "content": "You are an expert healthcare accreditation consultant providing strategic project insights." + STANDARD_RESPONSE_RULES},
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

    async def search_documents_ai(self, query: str, user_id: str, organization_id: str, document_type: Optional[str] = None) -> Dict[str, Any]:
        """
        AI-powered document search with relevance ranking
        """
        try:
            # Search Firebase
            results = firebase_client.search_documents(query, organization_id, document_type)
            
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
                    {"role": "system", "content": "You are a document management expert helping users find relevant compliance documents." + STANDARD_RESPONSE_RULES},
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

    async def get_user_training_status_ai(self, user_id: str, organization_id: str) -> Dict[str, Any]:
        """
        Get user's training status with AI recommendations
        """
        try:
            training_status = firebase_client.get_user_training_status(user_id, organization_id)
            
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
                    {"role": "system", "content": "You are a healthcare training coordinator providing personalized training recommendations." + STANDARD_RESPONSE_RULES},
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
