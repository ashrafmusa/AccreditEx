# Base Specialist Agent
# Week 2: Agent Specialization - Day 1 (Updated with Markdown Skill Injection)

"""
Abstract base class for all specialist agents.
Provides common functionality, strict JSON enforcement, API fallback routing, 
and automatic Markdown formatting injection.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, AsyncGenerator
import logging
from datetime import datetime

# Import the markdown skill we just created. 
# Adjust the import path depending on where you saved the Markdown Formatting Skill file.
from skills import get_markdown_formatting_skill

logger = logging.getLogger(__name__)

class BaseSpecialistAgent(ABC):
    """
    Abstract base class for specialist agents
    
    All specialist agents (Compliance, Risk, Training) inherit from this class
    and must implement the abstract methods.
    """
    
    def __init__(self, groq_client, firebase_client=None):
        """
        Initialize base agent
        
        Args:
            groq_client: AsyncOpenAI client for Groq API
            firebase_client: Optional Firebase client for data access
        """
        self.client = groq_client
        self.db = firebase_client.db if firebase_client and hasattr(firebase_client, 'db') else None
        
        # Primary reasoning model
        self.model = "qwen/qwen3-32b"
        # Ultra-fast fallback model for rate limit handling (429s)
        self.fallback_model = "llama-3.1-8b-instant"
        
        self.temperature = 0.7
        self.max_tokens = 1536
        
        logger.info(f"🤖 {self.__class__.__name__} initialized")
    
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
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Chat with the specialist agent (streaming)
        """
        try:
            # Use the combined prompt with the Markdown skill injected
            system_prompt = self.get_full_prompt(context)
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            logger.info(f"💬 {self.get_specialist_name()} processing chat request")
            
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
                    logger.warning(f"⚠️ Rate limited on {self.model}, falling back to {self.fallback_model}")
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
                
        except Exception as e:
            logger.error(f"❌ Error in {self.get_specialist_name()}: {e}")
            yield f"Error: {str(e)}"
    
    async def process_request(
        self, 
        message: str, 
        context: Optional[Dict[str, Any]] = None,
        response_format: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Process a request and return structured response.
        Supports native JSON mode via response_format kwarg.
        """
        try:
            # Use the combined prompt with the Markdown skill injected
            system_prompt = self.get_full_prompt(context)
            
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
            
            logger.info(f"📋 {self.get_specialist_name()} processing structured request (JSON Mode: {bool(response_format)})")
            
            # Get response (non-streaming for structured output) with fallback
            try:
                response = await self.client.chat.completions.create(**api_params)
            except Exception as rate_err:
                err_str = str(rate_err).lower()
                if '429' in err_str or 'rate_limit' in err_str or 'rate limit' in err_str:
                    logger.warning(f"⚠️ Rate limited on {self.model}, falling back to {self.fallback_model}")
                    api_params["model"] = self.fallback_model
                    response = await self.client.chat.completions.create(**api_params)
                else:
                    raise
            
            content = response.choices[0].message.content
            
            return {
                "specialist": self.get_specialist_name(),
                "response": content,
                "timestamp": datetime.now().isoformat(),
                "model": api_params["model"],  # logs which model ultimately succeeded
                "context": context
            }
            
        except Exception as e:
            logger.error(f"❌ Error in {self.get_specialist_name()}: {e}")
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
    
    def log_interaction(self, message: str, response: str, context: Optional[Dict] = None):
        """Log specialist interaction for analytics"""
        logger.info(f"""
        📊 Specialist Interaction:
        - Agent: {self.get_specialist_name()}
        - Message length: {len(message)} chars
        - Response length: {len(response)} chars
        - Context: {bool(context)}
        """)
    
    def validate_context(self, context: Optional[Dict]) -> bool:
        """Validate context structure"""
        if context is None:
            return True
        
        if not isinstance(context, dict):
            logger.warning(f"⚠️ Invalid context type: {type(context)}")
            return False
        
        return True
