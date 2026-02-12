# Context Manager - 3-Tier Context System
# Quick Win 3: Context optimization for token usage reduction

"""
Context Manager provides 3 tiers of context loading:
- Minimal: Basic user info only (~50 tokens)
- Standard: User + recent projects/docs (~200 tokens)
- Full: Complete workspace context (~1000 tokens)

Automatically selects appropriate tier based on message complexity.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from firebase_client import firebase_client

logger = logging.getLogger(__name__)

class ContextManager:
    """
    Manages context loading with 3-tier system for token optimization
    """
    
    def __init__(self):
        self.db = firebase_client.db if firebase_client else None
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    def get_context(self, user_id: str, context_tier: str = 'standard') -> Dict[str, Any]:
        """
        Get context based on tier selection
        
        Args:
            user_id: User identifier
            context_tier: 'minimal', 'standard', or 'full'
        
        Returns:
            Context dictionary appropriate for the tier
        """
        logger.info(f"📦 Loading {context_tier} context for user {user_id}")
        
        if context_tier == 'minimal':
            return self._get_minimal_context(user_id)
        elif context_tier == 'standard':
            return self._get_standard_context(user_id)
        elif context_tier == 'full':
            return self._get_full_context(user_id)
        else:
            logger.warning(f"Unknown context tier: {context_tier}, defaulting to standard")
            return self._get_standard_context(user_id)
    
    def _get_minimal_context(self, user_id: str) -> Dict[str, Any]:
        """
        Minimal context - just user essentials
        Tokens: ~50
        Use case: Simple chat, quick questions
        """
        if not self.db:
            return {'user_id': user_id, 'tier': 'minimal'}
        
        # Check cache
        cache_key = f"minimal_{user_id}"
        if self._is_cached(cache_key):
            logger.info("✅ Using cached minimal context")
            return self.cache[cache_key]['data']
        
        context = {
            'user_id': user_id,
            'tier': 'minimal',
            'timestamp': datetime.now().isoformat()
        }
        
        # Get basic user info
        try:
            user_doc = self.db.collection('users').document(user_id).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                context['user_name'] = user_data.get('name', 'User')
                context['user_role'] = user_data.get('role', 'Unknown')
                context['organization_id'] = user_data.get('organizationId', None)
        except Exception as e:
            logger.error(f"Error loading minimal context: {e}")
        
        # Cache it
        self._cache_data(cache_key, context)
        
        logger.info(f"📊 Minimal context size: {len(str(context))} chars (~50 tokens)")
        return context
    
    def _get_standard_context(self, user_id: str) -> Dict[str, Any]:
        """
        Standard context - user + recent activity
        Tokens: ~200
        Use case: Normal conversations, task assistance
        """
        if not self.db:
            return {'user_id': user_id, 'tier': 'standard'}
        
        # Check cache
        cache_key = f"standard_{user_id}"
        if self._is_cached(cache_key):
            logger.info("✅ Using cached standard context")
            return self.cache[cache_key]['data']
        
        # Start with minimal context
        context = self._get_minimal_context(user_id)
        context['tier'] = 'standard'
        
        try:
            org_id = context.get('organization_id')
            if not org_id:
                return context
            
            # Add assigned projects (limit to 3 most recent)
            projects = []
            projects_ref = self.db.collection(f'organizations/{org_id}/projects') \
                .where('assignedUsers', 'array_contains', user_id) \
                .order_by('createdAt', direction='DESCENDING') \
                .limit(3)
            
            for doc in projects_ref.stream():
                project = doc.to_dict()
                projects.append({
                    'id': doc.id,
                    'name': project.get('name', 'Unnamed Project'),
                    'status': project.get('status', 'Unknown')
                })
            
            context['assigned_projects'] = projects
            
            # Add recent documents (limit to 5 most recent)
            documents = []
            docs_ref = self.db.collection(f'organizations/{org_id}/documents') \
                .order_by('uploadedAt', direction='DESCENDING') \
                .limit(5)
            
            for doc in docs_ref.stream():
                document = doc.to_dict()
                documents.append({
                    'id': doc.id,
                    'name': document.get('name', 'Unnamed Document'),
                    'type': document.get('type', 'Unknown')
                })
            
            context['recent_documents'] = documents
            
        except Exception as e:
            logger.error(f"Error loading standard context: {e}")
        
        # Cache it
        self._cache_data(cache_key, context)
        
        logger.info(f"📊 Standard context size: {len(str(context))} chars (~200 tokens)")
        return context
    
    def _get_full_context(self, user_id: str) -> Dict[str, Any]:
        """
        Full context - complete workspace awareness
        Tokens: ~1000
        Use case: Complex tasks, orchestration, comprehensive analysis
        """
        if not self.db:
            return {'user_id': user_id, 'tier': 'full'}
        
        # Check cache
        cache_key = f"full_{user_id}"
        if self._is_cached(cache_key):
            logger.info("✅ Using cached full context")
            return self.cache[cache_key]['data']
        
        # Start with standard context
        context = self._get_standard_context(user_id)
        context['tier'] = 'full'
        
        try:
            org_id = context.get('organization_id')
            if not org_id:
                return context
            
            # Add all templates (summarized)
            templates_count = len(list(self.db.collection(f'organizations/{org_id}/templates').stream()))
            context['templates_count'] = templates_count
            
            # Add all forms (summarized)
            forms_count = len(list(self.db.collection(f'organizations/{org_id}/forms').stream()))
            context['forms_count'] = forms_count
            
            # Add workspace analytics summary
            analytics = self._get_workspace_analytics_summary(org_id)
            context['analytics'] = analytics
            
            # Add user permissions
            user_doc = self.db.collection('users').document(user_id).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                context['permissions'] = user_data.get('permissions', [])
            
        except Exception as e:
            logger.error(f"Error loading full context: {e}")
        
        # Cache it
        self._cache_data(cache_key, context)
        
        logger.info(f"📊 Full context size: {len(str(context))} chars (~1000 tokens)")
        return context
    
    def _get_workspace_analytics_summary(self, org_id: str) -> Dict[str, Any]:
        """Get high-level analytics summary"""
        try:
            # Count projects by status
            projects_ref = self.db.collection(f'organizations/{org_id}/projects')
            total_projects = len(list(projects_ref.stream()))
            
            # Count pending risks
            risks_ref = self.db.collection(f'organizations/{org_id}/risks').where('status', '==', 'open')
            pending_risks = len(list(risks_ref.stream()))
            
            # Count active users
            users_ref = self.db.collection('users').where('organizationId', '==', org_id)
            total_users = len(list(users_ref.stream()))
            
            return {
                'total_projects': total_projects,
                'pending_risks': pending_risks,
                'total_users': total_users
            }
        except Exception as e:
            logger.error(f"Error getting analytics summary: {e}")
            return {}
    
    def _is_cached(self, cache_key: str) -> bool:
        """Check if data is in cache and not expired"""
        if cache_key not in self.cache:
            return False
        
        cached_time = self.cache[cache_key]['timestamp']
        age = (datetime.now() - cached_time).total_seconds()
        
        if age > self.cache_ttl:
            # Expired
            del self.cache[cache_key]
            return False
        
        return True
    
    def _cache_data(self, cache_key: str, data: Dict[str, Any]):
        """Cache data with timestamp"""
        self.cache[cache_key] = {
            'data': data,
            'timestamp': datetime.now()
        }
    
    def invalidate_cache(self, user_id: str = None):
        """Invalidate cache for specific user or all"""
        if user_id:
            keys_to_delete = [k for k in self.cache.keys() if user_id in k]
            for key in keys_to_delete:
                del self.cache[key]
            logger.info(f"🗑️ Invalidated cache for user {user_id}")
        else:
            self.cache = {}
            logger.info("🗑️ Invalidated all cache")
    
    @staticmethod
    def detect_context_tier(message: str) -> str:
        """
        Auto-detect appropriate context tier from message
        
        Rules:
        - Minimal: Short questions (< 50 chars), simple queries
        - Standard: Normal conversations, specific tasks
        - Full: Complex requests, orchestration keywords
        """
        message_lower = message.lower()
        message_length = len(message)
        
        # Full context keywords
        full_keywords = [
            'audit', 'comprehensive', 'full analysis', 'complete',
            'entire workspace', 'all projects', 'organization',
            'prepare for', 'implementation plan', 'roadmap'
        ]
        
        if any(keyword in message_lower for keyword in full_keywords):
            logger.info("🔍 Context tier: FULL (complex task detected)")
            return 'full'
        
        # Minimal context (short, simple)
        if message_length < 50:
            logger.info("🔍 Context tier: MINIMAL (short message)")
            return 'minimal'
        
        # Default: standard
        logger.info("🔍 Context tier: STANDARD (normal conversation)")
        return 'standard'

# Global instance
context_manager = ContextManager()
