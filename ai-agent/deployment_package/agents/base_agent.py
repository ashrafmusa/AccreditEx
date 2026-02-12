# Base Specialist Agent
# Week 2: Agent Specialization - Day 1

"""
Abstract base class for all specialist agents.
Provides common functionality and interface that all specialists must implement.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, AsyncGenerator
import logging
from datetime import datetime

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
        self.model = "llama-3.3-70b-versatile"
        self.temperature = 0.7
        self.max_tokens = 2048
        
        logger.info(f"🤖 {self.__class__.__name__} initialized")
    
    @abstractmethod
    def get_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Get the specialist-specific system prompt
        
        Args:
            context: Optional context (user, organization, etc.)
            
        Returns:
            System prompt string for this specialist
        """
        pass
    
    @abstractmethod
    def get_specialist_name(self) -> str:
        """
        Get the name of this specialist
        
        Returns:
            Specialist name (e.g., "Compliance Specialist")
        """
        pass
    
    async def chat(
        self, 
        message: str, 
        context: Optional[Dict[str, Any]] = None,
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Chat with the specialist agent (streaming)
        
        Args:
            message: User message
            context: Optional context dictionary
            stream: Whether to stream responses
            
        Yields:
            Response chunks
        """
        try:
            # Get specialist system prompt
            system_prompt = self.get_system_prompt(context)
            
            # Prepare messages
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            logger.info(f"💬 {self.get_specialist_name()} processing request")
            
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
                
        except Exception as e:
            logger.error(f"❌ Error in {self.get_specialist_name()}: {e}")
            yield f"Error: {str(e)}"
    
    async def process_request(
        self, 
        message: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process a request and return structured response
        
        Args:
            message: User message
            context: Optional context dictionary
            
        Returns:
            Structured response dictionary
        """
        try:
            # Get specialist system prompt
            system_prompt = self.get_system_prompt(context)
            
            # Prepare messages
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            logger.info(f"📋 {self.get_specialist_name()} processing structured request")
            
            # Get response (non-streaming for structured output)
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                stream=False
            )
            
            content = response.choices[0].message.content
            
            return {
                "specialist": self.get_specialist_name(),
                "response": content,
                "timestamp": datetime.now().isoformat(),
                "model": self.model,
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
        """
        Format specialist response with metadata
        
        Args:
            content: Response content
            metadata: Optional metadata dictionary
            
        Returns:
            Formatted response
        """
        response = {
            "specialist": self.get_specialist_name(),
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        
        if metadata:
            response["metadata"] = metadata
        
        return response
    
    def log_interaction(self, message: str, response: str, context: Optional[Dict] = None):
        """
        Log specialist interaction for analytics
        
        Args:
            message: User message
            response: Specialist response
            context: Optional context
        """
        logger.info(f"""
        📊 Specialist Interaction:
        - Agent: {self.get_specialist_name()}
        - Message length: {len(message)} chars
        - Response length: {len(response)} chars
        - Context: {bool(context)}
        """)
    
    def validate_context(self, context: Optional[Dict]) -> bool:
        """
        Validate context structure
        
        Args:
            context: Context dictionary to validate
            
        Returns:
            True if valid, False otherwise
        """
        if context is None:
            return True
        
        if not isinstance(context, dict):
            logger.warning(f"⚠️ Invalid context type: {type(context)}")
            return False
        
        return True
