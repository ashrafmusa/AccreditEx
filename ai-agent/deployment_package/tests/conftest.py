"""
Pytest fixtures and configuration for AI Agent tests
"""
import pytest
import os
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, Any
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

@pytest.fixture
def mock_env_vars(monkeypatch):
    """Mock environment variables for testing"""
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    monkeypatch.setenv("API_KEY", "test-api-key")
    monkeypatch.setenv("FIREBASE_CREDENTIALS_PATH", "test-credentials.json")

@pytest.fixture
def mock_firebase_client():
    """Mock Firebase client for testing"""
    client = Mock()
    client.get_user_context.return_value = {
        'user_data': {
            'id': 'test-user-123',
            'name': 'Test User',
            'email': 'test@example.com',
            'role': 'Quality Manager',
            'department': 'Quality Assurance',
            'permissions': ['view_projects', 'edit_documents']
        },
        'assigned_projects': [
            {
                'id': 'proj-1',
                'name': 'ISO 9001 Certification',
                'status': 'In Progress',
                'progress': 75,
                'programId': 'prog-1'
            }
        ],
        'department_info': {
            'name': 'Quality Assurance',
            'head': 'John Doe',
            'memberCount': 12
        },
        'recent_documents': [
            {
                'name': 'Quality Manual v2.0',
                'type': 'Manual',
                'status': 'Approved'
            }
        ]
    }
    
    client.get_workspace_analytics.return_value = {
        'projects': {'total': 15, 'active': 8, 'completed': 7},
        'risks': {'total': 45, 'high': 5, 'critical': 2},
        'departments': {'total': 6}
    }
    
    return client

@pytest.fixture
def mock_openai_client():
    """Mock OpenAI/Groq client for testing"""
    client = AsyncMock()
    
    # Mock streaming response
    async def mock_stream():
        chunks = [
            Mock(choices=[Mock(delta=Mock(content="Hello "))]),
            Mock(choices=[Mock(delta=Mock(content="from "))]),
            Mock(choices=[Mock(delta=Mock(content="AI!"))]),
        ]
        for chunk in chunks:
            yield chunk
    
    client.chat.completions.create.return_value = mock_stream()
    return client

@pytest.fixture
def sample_context() -> Dict[str, Any]:
    """Sample context for testing"""
    return {
        'user_id': 'test-user-123',
        'page_title': 'Dashboard - AccreditEx',
        'route': '/dashboard',
        'user_role': 'Quality Manager',
        'current_data': {
            'app_name': 'AccreditEx',
            'available_templates': [
                {'id': 't1', 'name': 'SOP Template', 'category': 'Procedures'},
                {'id': 't2', 'name': 'Policy Template', 'category': 'Policies'}
            ],
            'available_forms': [
                {'id': 'f1', 'name': 'Incident Report', 'category': 'Safety'},
                {'id': 'f2', 'name': 'Risk Assessment', 'category': 'Risk Management'}
            ],
            'ai_instructions': {
                'context_awareness': 'Full app access',
                'can_provide_forms': True,
                'can_generate_documents': True,
                'available_form_categories': ['Safety', 'Risk Management'],
                'available_template_categories': ['Procedures', 'Policies']
            }
        }
    }

@pytest.fixture
def sample_chat_request():
    """Sample chat request for testing"""
    return {
        'message': 'How do I prepare for ISO 9001 audit?',
        'thread_id': 'test-thread-123',
        'context': {
            'user_id': 'test-user-123',
            'user_role': 'Quality Manager'
        }
    }

@pytest.fixture
async def test_app():
    """Create test FastAPI application"""
    from main import app
    return app
