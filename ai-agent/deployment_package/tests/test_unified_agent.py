"""
Unit tests for UnifiedAccreditexAgent
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from unified_accreditex_agent import UnifiedAccreditexAgent
import asyncio

@pytest.mark.unit
class TestUnifiedAccreditexAgent:
    """Test suite for UnifiedAccreditexAgent class"""
    
    @pytest.mark.asyncio
    async def test_agent_initialization(self, mock_env_vars):
        """Test agent initializes with correct configuration"""
        with patch('unified_accreditex_agent.AsyncOpenAI') as mock_openai, \
             patch('unified_accreditex_agent.firebase_admin'):
            
            agent = UnifiedAccreditexAgent()
            
            assert agent.client is not None
            assert agent.model == "llama-3.3-70b-versatile"
            assert isinstance(agent.conversations, dict)
            assert len(agent.conversations) == 0
    
    @pytest.mark.asyncio
    async def test_initialize(self, mock_env_vars):
        """Test async initialization"""
        with patch('unified_accreditex_agent.AsyncOpenAI'), \
             patch('unified_accreditex_agent.firebase_admin'):
            
            agent = UnifiedAccreditexAgent()
            await agent.initialize()
            # Should not raise any errors
    
    @pytest.mark.asyncio
    async def test_get_system_prompt_basic(self, mock_env_vars):
        """Test system prompt generation without context"""
        with patch('unified_accreditex_agent.AsyncOpenAI'), \
             patch('unified_accreditex_agent.firebase_admin'):
            
            agent = UnifiedAccreditexAgent()
            prompt = agent._get_system_prompt()
            
            assert "AccreditEx AI Assistant" in prompt
            assert "healthcare accreditation" in prompt
            assert "ISO 9001" in prompt
    
    @pytest.mark.asyncio
    async def test_get_system_prompt_with_context(self, mock_env_vars, sample_context):
        """Test system prompt generation with full context"""
        with patch('unified_accreditex_agent.AsyncOpenAI'), \
             patch('unified_accreditex_agent.firebase_admin'):
            
            agent = UnifiedAccreditexAgent()
            context = {
                'user_name': 'Test User',
                'user_role': 'Quality Manager',
                'user_department': 'Quality Assurance',
                'current_data': sample_context['current_data']
            }
            
            prompt = agent._get_system_prompt(context)
            
            assert "Test User" in prompt
            assert "Quality Manager" in prompt
            assert "Quality Assurance" in prompt
            assert "available_templates" in prompt or "Templates Available" in prompt
    
    @pytest.mark.asyncio
    async def test_chat_creates_new_thread(self, mock_env_vars):
        """Test chat creates new conversation thread"""
        with patch('unified_accreditex_agent.AsyncOpenAI') as mock_openai_class, \
             patch('unified_accreditex_agent.firebase_admin'), \
             patch('unified_accreditex_agent.firebase_client') as mock_fb_client:
            
            # Setup mocks
            mock_client = AsyncMock()
            mock_openai_class.return_value = mock_client
            
            async def mock_stream():
                chunks = [
                    MagicMock(choices=[MagicMock(delta=MagicMock(content="Test "))]),
                    MagicMock(choices=[MagicMock(delta=MagicMock(content="response"))]),
                ]
                for chunk in chunks:
                    yield chunk
            
            mock_client.chat.completions.create.return_value = mock_stream()
            
            mock_fb_client.get_user_context.return_value = {
                'user_role': 'Quality Manager',
                'user_name': 'Test User'
            }
            mock_fb_client.get_workspace_analytics.return_value = {}
            
            # Create agent and chat
            agent = UnifiedAccreditexAgent()
            
            response_parts = []
            async for chunk in agent.chat("Test message", thread_id="new-thread"):
                response_parts.append(chunk)
            
            # Verify conversation was created
            assert "new-thread" in agent.conversations
            assert len(agent.conversations["new-thread"]) == 2  # system + user message
    
    @pytest.mark.asyncio
    async def test_chat_maintains_history(self, mock_env_vars):
        """Test chat maintains conversation history"""
        with patch('unified_accreditex_agent.AsyncOpenAI') as mock_openai_class, \
             patch('unified_accreditex_agent.firebase_admin'), \
             patch('unified_accreditex_agent.firebase_client') as mock_fb_client:
            
            # Setup mocks
            mock_client = AsyncMock()
            mock_openai_class.return_value = mock_client
            
            async def mock_stream():
                yield MagicMock(choices=[MagicMock(delta=MagicMock(content="Response"))])
            
            mock_client.chat.completions.create.return_value = mock_stream()
            
            mock_fb_client.get_user_context.return_value = {'user_role': 'Quality Manager'}
            mock_fb_client.get_workspace_analytics.return_value = {}
            
            agent = UnifiedAccreditexAgent()
            
            # First message
            async for _ in agent.chat("First message", thread_id="test-thread"):
                pass
            
            # Second message in same thread
            async for _ in agent.chat("Second message", thread_id="test-thread"):
                pass
            
            # Verify history contains both messages
            assert len(agent.conversations["test-thread"]) == 4  # system + user1 + assistant1 + user2
    
    @pytest.mark.asyncio
    async def test_get_organization_context(self, mock_env_vars, mock_firebase_client):
        """Test organization context fetching"""
        with patch('unified_accreditex_agent.AsyncOpenAI'), \
             patch('unified_accreditex_agent.firebase_admin'), \
             patch('unified_accreditex_agent.firebase_client', mock_firebase_client):
            
            agent = UnifiedAccreditexAgent()
            context = await agent._get_organization_context('test-user-123')
            
            assert context['user_role'] == 'Quality Manager'
            assert context['user_name'] == 'Test User'
            assert len(context['assigned_projects']) > 0
            assert 'workspace_analytics' in context
    
    @pytest.mark.asyncio
    async def test_conversation_history_limit(self, mock_env_vars):
        """Test conversation history is limited to prevent memory issues"""
        with patch('unified_accreditex_agent.AsyncOpenAI') as mock_openai_class, \
             patch('unified_accreditex_agent.firebase_admin'), \
             patch('unified_accreditex_agent.firebase_client') as mock_fb_client:
            
            mock_client = AsyncMock()
            mock_openai_class.return_value = mock_client
            
            async def mock_stream():
                yield MagicMock(choices=[MagicMock(delta=MagicMock(content="Response"))])
            
            mock_client.chat.completions.create.return_value = mock_stream()
            mock_fb_client.get_user_context.return_value = {'user_role': 'Quality Manager'}
            mock_fb_client.get_workspace_analytics.return_value = {}
            
            agent = UnifiedAccreditexAgent()
            
            # Send 15 messages (should exceed limit)
            for i in range(15):
                async for _ in agent.chat(f"Message {i}", thread_id="test-thread"):
                    pass
            
            # History should be limited (system + last 10 messages)
            assert len(agent.conversations["test-thread"]) <= 11

@pytest.mark.unit
def test_model_selection_groq(mock_env_vars):
    """Test model selection with Groq API key"""
    with patch('unified_accreditex_agent.AsyncOpenAI'), \
         patch('unified_accreditex_agent.firebase_admin'):
        
        agent = UnifiedAccreditexAgent()
        assert agent.model == "llama-3.3-70b-versatile"

@pytest.mark.unit
def test_model_selection_openai(mock_env_vars, monkeypatch):
    """Test model selection fallback to OpenAI"""
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
    
    with patch('unified_accreditex_agent.AsyncOpenAI'), \
         patch('unified_accreditex_agent.firebase_admin'):
        
        agent = UnifiedAccreditexAgent()
        assert agent.model == "gpt-3.5-turbo"
