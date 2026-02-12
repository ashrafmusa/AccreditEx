"""
Integration tests for Firebase Client
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from firebase_client import FirebaseClient

@pytest.mark.integration
class TestFirebaseClient:
    """Test suite for FirebaseClient class"""
    
    def test_firebase_initialization(self, mock_env_vars):
        """Test Firebase client initialization"""
        with patch('firebase_client.firebase_admin') as mock_firebase, \
             patch('firebase_client.credentials') as mock_creds, \
             patch('firebase_client.firestore') as mock_firestore:
            
            mock_firebase._apps = []
            mock_creds.Certificate.return_value = Mock()
            mock_firestore.client.return_value = Mock()
            
            client = FirebaseClient()
            
            assert client.db is not None
            mock_creds.Certificate.assert_called_once()
    
    def test_get_user_context_success(self, mock_env_vars):
        """Test successful user context retrieval"""
        with patch('firebase_client.firebase_admin') as mock_firebase, \
             patch('firebase_client.firestore') as mock_firestore:
            
            # Setup mock Firestore
            mock_db = Mock()
            mock_firestore.client.return_value = mock_db
            
            # Mock user document
            mock_user_doc = Mock()
            mock_user_doc.exists = True
            mock_user_doc.to_dict.return_value = {
                'name': 'Test User',
                'email': 'test@example.com',
                'role': 'Quality Manager',
                'department': 'dept-1',
                'permissions': ['view_projects']
            }
            
            mock_db.collection.return_value.document.return_value.get.return_value = mock_user_doc
            
            # Mock projects query
            mock_project_doc = Mock()
            mock_project_doc.to_dict.return_value = {
                'id': 'proj-1',
                'name': 'ISO 9001',
                'status': 'Active',
                'progress': 75
            }
            
            mock_query = Mock()
            mock_query.where.return_value.limit.return_value.stream.return_value = [mock_project_doc]
            mock_db.collection.return_value = mock_query
            
            client = FirebaseClient()
            context = client.get_user_context('user-123')
            
            assert context['user_data']['name'] == 'Test User'
            assert context['user_data']['role'] == 'Quality Manager'
            assert len(context['assigned_projects']) > 0
    
    def test_get_user_context_user_not_found(self, mock_env_vars):
        """Test user context when user doesn't exist"""
        with patch('firebase_client.firebase_admin'), \
             patch('firebase_client.firestore') as mock_firestore:
            
            mock_db = Mock()
            mock_firestore.client.return_value = mock_db
            
            # Mock non-existent user
            mock_user_doc = Mock()
            mock_user_doc.exists = False
            
            mock_db.collection.return_value.document.return_value.get.return_value = mock_user_doc
            
            client = FirebaseClient()
            context = client.get_user_context('nonexistent-user')
            
            assert 'error' in context
            assert context['user_data'] is None
    
    def test_get_workspace_analytics(self, mock_env_vars):
        """Test workspace analytics retrieval"""
        with patch('firebase_client.firebase_admin'), \
             patch('firebase_client.firestore') as mock_firestore:
            
            mock_db = Mock()
            mock_firestore.client.return_value = mock_db
            
            # Mock collections
            def mock_collection_stream(collection_name):
                if collection_name == 'projects':
                    return [Mock(to_dict=lambda: {'status': 'Active'})] * 10
                elif collection_name == 'risks':
                    return [Mock(to_dict=lambda: {'severity': 'High'})] * 5
                return []
            
            mock_db.collection.return_value.stream.side_effect = lambda: mock_collection_stream('projects')
            
            client = FirebaseClient()
            analytics = client.get_workspace_analytics()
            
            assert analytics is not None
            assert isinstance(analytics, dict)

@pytest.mark.integration
@pytest.mark.requires_firebase
def test_firebase_real_connection():
    """Test real Firebase connection (requires credentials)"""
    import os
    
    if not os.path.exists('serviceAccountKey.json'):
        pytest.skip("Firebase credentials not available")
    
    try:
        client = FirebaseClient()
        assert client.db is not None
    except Exception as e:
        pytest.fail(f"Firebase connection failed: {e}")
