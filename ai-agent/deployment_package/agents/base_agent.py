# Base Specialist Agent
# Week 2: Agent Specialization - Day 1 (Updated with Markdown Skill Injection)

"""
Abstract base class for all specialist agents.
Provides common functionality, strict JSON enforcement, API fallback routing, 
and automatic Markdown formatting injection.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, AsyncGenerator, Iterable, Mapping, Tuple
import hashlib
import json
import logging
import time
from datetime import datetime

from agent_utils import (
    AgentConfig,
    AgentLogger,
    InputValidator,
    RateLimiter,
    RateLimitExceeded,
    ResponseValidator,
)

# Import the markdown skill we just created. 
# Adjust the import path depending on where you saved the Markdown Formatting Skill file.
from skills.markdown_formatting import get_markdown_formatting_skill

logger = logging.getLogger(__name__)

class BaseSpecialistAgent(ABC):
    """
    Abstract base class for specialist agents
    
    All specialist agents (Compliance, Risk, Training) inherit from this class
    and must implement the abstract methods.
    """
    
    # Env var prefix / default temperature; overridden by subclasses
    CONFIG_PREFIX: Optional[str] = None
    DEFAULT_TEMPERATURE: float = 0.7

    def __init__(self, groq_client, firebase_client=None):
        """
        Initialize base agent
        
        Args:
            groq_client: AsyncOpenAI client for Groq API
            firebase_client: Optional Firebase client for data access
        """
        self.client = groq_client
        self.db = firebase_client.db if firebase_client and hasattr(firebase_client, 'db') else None
        
        self.config = AgentConfig.from_env(self.CONFIG_PREFIX, self.DEFAULT_TEMPERATURE)
        self.model = self.config.model
        # Fast fallback model for rate limit handling (429s)
        self.fallback_model = self.config.fallback_model
        self.temperature = self.config.temperature
        self.max_tokens = self.config.max_tokens
        
        self.validator = InputValidator(self.config.max_input_length)
        self.rate_limiter = RateLimiter(
            self.config.rate_limit_requests, self.config.rate_limit_window_seconds
        )
        self._cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
        self.log = AgentLogger(self.__class__.__name__)
        
        self.log.info("initialized", model=self.model, fallback_model=self.fallback_model)
    
    @abstractmethod
    def get_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Get the specialist-specific system prompt. (Implemented by child classes).
        """
        pass
    
    @abstractmethod
    def get_specialist_name(self) -> str:
        """
        Get the name of this specialist.
        """
        pass
        
    # ==================== Cache / rate limiting / validation helpers ====================

    @staticmethod
    def _resolve_user_id(user_id: Optional[str], context: Optional[Dict[str, Any]]) -> str:
        if user_id:
            return str(user_id)
        if isinstance(context, dict) and context.get("user_id"):
            return str(context["user_id"])
        return "anonymous"

    def _cache_key(self, system_prompt: str, message: str,
                   response_format: Optional[Dict[str, str]]) -> str:
        raw = json.dumps(
            [self.model, self.temperature, self.max_tokens, system_prompt, message, response_format],
            sort_keys=True, default=str,
        )
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def _cache_get(self, key: str) -> Optional[Dict[str, Any]]:
        entry = self._cache.get(key)
        if not entry:
            return None
        stored_at, value = entry
        if time.monotonic() - stored_at > self.config.cache_ttl_seconds:
            self._cache.pop(key, None)
            return None
        return dict(value)

    def _cache_set(self, key: str, value: Dict[str, Any]) -> None:
        if self.config.cache_ttl_seconds <= 0:
            return
        if len(self._cache) >= self.config.cache_max_entries:
            now = time.monotonic()
            for k in [k for k, (t, _) in self._cache.items() if now - t > self.config.cache_ttl_seconds]:
                self._cache.pop(k, None)
            if len(self._cache) >= self.config.cache_max_entries:
                self._cache.pop(min(self._cache, key=lambda k: self._cache[k][0]), None)
        self._cache[key] = (time.monotonic(), dict(value))

    def clear_cache(self) -> None:
        """Drop all cached responses."""
        self._cache.clear()

    def parse_structured_response(
        self,
        result: Dict[str, Any],
        required: Mapping[str, Any],
        list_item_keys: Optional[Mapping[str, Iterable[str]]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Parse result['response'] as JSON and validate against the expected schema.
        Returns the parsed dict, or None when missing/invalid (errors are logged
        and stored in result['validation_errors']).
        """
        raw = result.get("response")
        if not isinstance(raw, str):
            return None
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            self.log.warning("llm_response_not_json")
            return None
        valid, errors = ResponseValidator.validate(parsed, required, list_item_keys)
        if not valid:
            self.log.warning("llm_response_schema_invalid", errors="; ".join(errors))
            result["validation_errors"] = errors
            return None
        return parsed

    def get_full_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Constructs the final prompt by combining the specialist's core prompt 
        with the global JSON-compatible Markdown formatting skill.
        """
        specialist_prompt = self.get_system_prompt(context)
        markdown_skill = get_markdown_formatting_skill()
        
        return f"{specialist_prompt}\n\n{markdown_skill}"
    
    async def chat(
        self, 
        message: str, 
        context: Optional[Dict[str, Any]] = None,
        stream: bool = True,
        user_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Chat with the specialist agent (streaming)
        """
        try:
            self.rate_limiter.check(self._resolve_user_id(user_id, context))
            message = self.validator.sanitize(message, field_name="message", allow_empty=False)

            # Use the combined prompt with the Markdown skill injected
            system_prompt = self.get_full_prompt(context)
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            self.log.info("chat_request", agent=self.get_specialist_name())
            
            # Stream response with automatic fallback on 429
            try:
                stream_response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    stream=stream
                )
            except Exception as rate_err:
                err_str = str(rate_err).lower()
                if '429' in err_str or 'rate_limit' in err_str or 'rate limit' in err_str:
                    self.log.warning("model_rate_limited_fallback", model=self.model, fallback=self.fallback_model)
                    stream_response = await self.client.chat.completions.create(
                        model=self.fallback_model,
                        messages=messages,
                        temperature=self.temperature,
                        max_tokens=self.max_tokens,
                        stream=stream
                    )
                else:
                    raise
            
            if stream:
                async for chunk in stream_response:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            else:
                response = stream_response.choices[0].message.content
                yield response
                
        except RateLimitExceeded as e:
            self.log.warning("rate_limited", user_id=e.user_id)
            yield f"Error: {str(e)}"
        except Exception as e:
            self.log.error("chat_failed", agent=self.get_specialist_name(), error=e)
            yield f"Error: {str(e)}"
    
    async def process_request(
        self, 
        message: str, 
        context: Optional[Dict[str, Any]] = None,
        response_format: Optional[Dict[str, str]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a request and return structured response.
        Supports native JSON mode via response_format kwarg.
        Identical requests are served from a TTL cache; API calls are rate limited per user.
        """
        try:
            # Use the combined prompt with the Markdown skill injected
            system_prompt = self.get_full_prompt(context)
            
            cache_key = self._cache_key(system_prompt, message, response_format)
            cached = self._cache_get(cache_key)
            if cached is not None:
                self.log.info("cache_hit", agent=self.get_specialist_name())
                cached["cached"] = True
                return cached
            
            self.rate_limiter.check(self._resolve_user_id(user_id, context))
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            # Base API call parameters
            api_params = {
                "model": self.model,
                "messages": messages,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
                "stream": False
            }
            
            # If a JSON format is requested, append it to the parameters
            if response_format:
                api_params["response_format"] = response_format
            
            self.log.info("structured_request", agent=self.get_specialist_name(), json_mode=bool(response_format))
            
            # Get response (non-streaming for structured output) with fallback
            try:
                response = await self.client.chat.completions.create(**api_params)
            except Exception as rate_err:
                err_str = str(rate_err).lower()
                if '429' in err_str or 'rate_limit' in err_str or 'rate limit' in err_str:
                    self.log.warning("model_rate_limited_fallback", model=self.model, fallback=self.fallback_model)
                    api_params["model"] = self.fallback_model
                    response = await self.client.chat.completions.create(**api_params)
                else:
                    raise
            
            content = response.choices[0].message.content
            
            result = {
                "specialist": self.get_specialist_name(),
                "response": content,
                "timestamp": datetime.now().isoformat(),
                "model": api_params["model"],  # logs which model ultimately succeeded
                "context": context
            }
            self._cache_set(cache_key, result)
            return result
            
        except RateLimitExceeded as e:
            self.log.warning("rate_limited", user_id=e.user_id)
            return {
                "specialist": self.get_specialist_name(),
                "error": str(e),
                "rate_limited": True,
                "retry_after": e.retry_after,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            self.log.error("request_failed", agent=self.get_specialist_name(), error=e)
            return {
                "specialist": self.get_specialist_name(),
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def format_response(self, content: str, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Format specialist response with metadata"""
        response = {
            "specialist": self.get_specialist_name(),
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        
        if metadata:
            response["metadata"] = metadata
        
        return response
    
    def log_interaction(self, message: str, response: str, context: Optional[Dict] = None) -> None:
        """Log specialist interaction for analytics"""
        self.log.info(
            "interaction",
            agent=self.get_specialist_name(),
            message_chars=len(message),
            response_chars=len(response),
            has_context=bool(context),
        )
    
    def validate_context(self, context: Optional[Dict]) -> bool:
        """Validate context structure"""
        if context is None:
            return True
        
        if not isinstance(context, dict):
            self.log.warning("invalid_context_type", type=type(context).__name__)
            return False
        
        return True
