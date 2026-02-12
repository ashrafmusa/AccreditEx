"""
API endpoint tests for FastAPI main.py
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

@pytest.mark.integration
class TestAPIEndpoints:
    """Test suite for FastAPI endpoints"""
    
    def test_health_endpoint(self):
        """Test /health endpoint returns correct status"""
        with patch('main.agent') as mock_agent:
            from main import app
            client = TestClient(app)
            
            mock_agent.__bool__ = Mock(return_value=True)
            
            response = client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert "status" in data
            assert "agent_initialized" in data
            assert "version" in data
    
    def test_health_endpoint_unhealthy(self):
        """Test /health endpoint when agent not initialized"""
        with patch('main.agent', None):
            from main import app
            client = TestClient(app)
            
            response = client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "unhealthy"
            assert data["agent_initialized"] is False
    
    def test_chat_endpoint_requires_api_key(self):
        """Test /chat endpoint requires API key"""
        with patch('main.agent') as mock_agent:
            from main import app
            client = TestClient(app)
            
            mock_agent.__bool__ = Mock(return_value=True)
            
            response = client.post("/chat", json={
                "message": "Test message"
            })
            
            assert response.status_code == 403
    
    def test_chat_endpoint_with_valid_api_key(self, mock_env_vars):
        """Test /chat endpoint with valid API key"""
        with patch('main.agent') as mock_agent, \
             patch.dict(os.environ, {"API_KEY": "test-api-key"}):
            
            from main import app
            client = TestClient(app)
            
            # Mock agent chat method
            async def mock_chat(*args, **kwargs):
                yield "Test "
                yield "response"
            
            mock_agent.chat = mock_chat
            mock_agent.__bool__ = Mock(return_value=True)
            
            response = client.post(
                "/chat",
                json={"message": "Test message"},
                headers={"X-API-Key": "test-api-key"}
            )
            
            assert response.status_code == 200
    
    def test_chat_endpoint_with_invalid_api_key(self, mock_env_vars):
        """Test /chat endpoint with invalid API key"""
        with patch('main.agent') as mock_agent, \
             patch.dict(os.environ, {"API_KEY": "correct-key"}):
            
            from main import app
            client = TestClient(app)
            
            mock_agent.__bool__ = Mock(return_value=True)
            
            response = client.post(
                "/chat",
                json={"message": "Test message"},
                headers={"X-API-Key": "wrong-key"}
            )
            
            assert response.status_code == 403
    
    def test_chat_endpoint_agent_not_initialized(self):
        """Test /chat endpoint when agent not initialized"""
        with patch('main.agent', None), \
             patch.dict(os.environ, {"API_KEY": "test-api-key"}):
            
            from main import app
            client = TestClient(app)
            
            response = client.post(
                "/chat",
                json={"message": "Test message"},
                headers={"X-API-Key": "test-api-key"}
            )
            
            assert response.status_code == 503
    
    def test_cors_headers_present(self):
        """Test CORS headers are properly configured"""
        with patch('main.agent'):
            from main import app
            client = TestClient(app)
            
            response = client.options(
                "/health",
                headers={
                    "Origin": "http://localhost:5173",
                    "Access-Control-Request-Method": "GET"
                }
            )
            
            assert "access-control-allow-origin" in response.headers
    
    def test_chat_request_validation(self, mock_env_vars):
        """Test chat request validation"""
        with patch('main.agent') as mock_agent, \
             patch.dict(os.environ, {"API_KEY": "test-api-key"}):
            
            from main import app
            client = TestClient(app)
            
            mock_agent.__bool__ = Mock(return_value=True)
            
            # Missing required field
            response = client.post(
                "/chat",
                json={},
                headers={"X-API-Key": "test-api-key"}
            )
            
            assert response.status_code == 422  # Validation error
    
    def test_chat_with_context(self, mock_env_vars, sample_context):
        """Test chat endpoint with context"""
        with patch('main.agent') as mock_agent, \
             patch.dict(os.environ, {"API_KEY": "test-api-key"}):
            
            from main import app
            client = TestClient(app)
            
            async def mock_chat(*args, **kwargs):
                yield "Response with context"
            
            mock_agent.chat = mock_chat
            mock_agent.__bool__ = Mock(return_value=True)
            
            response = client.post(
                "/chat",
                json={
                    "message": "Test message",
                    "context": sample_context
                },
                headers={"X-API-Key": "test-api-key"}
            )
            
            assert response.status_code == 200

@pytest.mark.integration
class TestAPIDocumentation:
    """Test API documentation endpoints"""
    
    def test_openapi_schema_available(self):
        """Test OpenAPI schema is accessible"""
        with patch('main.agent'):
            from main import app
            client = TestClient(app)
            
            response = client.get("/openapi.json")
            
            assert response.status_code == 200
            schema = response.json()
            assert "openapi" in schema
            assert "info" in schema
    
    def test_docs_endpoint_available(self):
        """Test /docs endpoint is accessible"""
        with patch('main.agent'):
            from main import app
            client = TestClient(app)
            
            response = client.get("/docs")
            
            assert response.status_code == 200
