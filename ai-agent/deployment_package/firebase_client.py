"""
Firebase Client for AI Agent Backend
Provides direct Firebase database access for context-aware AI responses
Enhanced with caching and performance monitoring

Install: pip install firebase-admin
"""

import firebase_admin
from firebase_admin import credentials, firestore
from typing import Dict, List, Any, Optional
import os
import json
from datetime import datetime, timedelta

# Import caching and monitoring
try:
    from cache import cache
    from monitoring import performance_monitor
except ImportError:
    # Fallback if modules not available
    cache = None
    performance_monitor = None

class FirebaseClient:
    def __init__(self, use_cache: bool = True):
        """
        Initialize Firebase Admin SDK
        
        Args:
            use_cache: Enable caching for Firebase queries (default: True)
        """
        self.use_cache = use_cache and cache is not None
        
        # Use service account from environment or file
        if not firebase_admin._apps:
            # Try JSON credentials first (for Render deployment)
            cred_json = os.getenv('FIREBASE_CREDENTIALS_JSON')
            cred_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'serviceAccountKey.json')
            
            try:
                if cred_json:
                    # Parse JSON credentials from environment variable
                    cred_dict = json.loads(cred_json)
                    cred = credentials.Certificate(cred_dict)
                    print("✅ Firebase initialized with JSON credentials")
                else:
                    # Use credentials file path
                    cred = credentials.Certificate(cred_path)
                    print("✅ Firebase initialized with credentials file")
                
                firebase_admin.initialize_app(cred)
            except Exception as e:
                print(f"⚠️ Firebase initialization warning: {e}")
                print("   Using default credentials or application credentials")
                firebase_admin.initialize_app()
        
        self.db = firestore.client()

    def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive user context from Firebase with caching
        
        Args:
            user_id: User's Firebase document ID
            
        Returns:
            Dictionary with user data, projects, permissions, etc.
        """
        # Check cache first
        if self.use_cache:
            cache_key = f"user_context:{user_id}"
            cached_data = cache.get(cache_key)
            if cached_data:
                if performance_monitor:
                    performance_monitor.track_cache_hit(cache_key)
                return cached_data
            if performance_monitor:
                performance_monitor.track_cache_miss(cache_key)
        
        try:
            if performance_monitor:
                performance_monitor.track_firebase_query('users', 'get_document')
            
            # Get user document
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return {
                    'error': f'User {user_id} not found',
                    'user_data': None
                }
            
            user_data = user_doc.to_dict()
            
            # Get user's projects (as lead)
            projects_as_lead = self.db.collection('projects')\
                .where('projectLeadId', '==', user_id)\
                .limit(50)\
                .stream()
            
            lead_projects = [p.to_dict() for p in projects_as_lead]
            
            # Get user's department
            department = None
            if user_data.get('department'):
                dept_doc = self.db.collection('departments')\
                    .document(user_data['department'])\
                    .get()
                if dept_doc.exists:
                    department = dept_doc.to_dict()
            
            # Get user's recent documents
            recent_docs = self.db.collection('documents')\
                .where('uploadedBy', '==', user_data.get('name', ''))\
                .order_by('uploadedAt', direction=firestore.Query.DESCENDING)\
                .limit(10)\
                .stream()
            
            documents = [doc.to_dict() for doc in recent_docs]
            
            result = {
                'user_data': {
                    'id': user_id,
                    'name': user_data.get('name'),
                    'email': user_data.get('email'),
                    'role': user_data.get('role'),
                    'department': user_data.get('department'),
                    'permissions': user_data.get('permissions', [])
                },
                'assigned_projects': [
                    {
                        'id': p.get('id'),
                        'name': p.get('name'),
                        'status': p.get('status'),
                        'progress': p.get('progress', 0),
                        'programId': p.get('programId')
                    }
                    for p in lead_projects
                ],
                'department_info': department,
                'recent_documents': [
                    {
                        'name': d.get('name', {}).get('en'),
                        'type': d.get('type'),
                        'status': d.get('status')
                    }
                    for d in documents
                ]
            }
            
            # Cache the result
            if self.use_cache:
                cache.set(f"user_context:{user_id}", result, ttl=180)  # 3 minutes
            
            return result
            
        except Exception as e:
            if performance_monitor:
                performance_monitor.track_error("FirebaseError", str(e), {"user_id": user_id})
            print(f"❌ Error fetching user context: {e}")
            return {
                'error': str(e),
                'user_data': None
            }

    def get_project_details(self, project_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed project information
        
        Args:
            project_id: Project document ID
            
        Returns:
            Project data with checklist, CAPAs, surveys, etc.
        """
        try:
            project_ref = self.db.collection('projects').document(project_id)
            project_doc = project_ref.get()
            
            if not project_doc.exists:
                return None
            
            project_data = project_doc.to_dict()
            
            # Calculate compliance statistics
            checklist = project_data.get('checklist', [])
            total_items = len(checklist)
            compliant = len([c for c in checklist if c.get('status') == 'Compliant'])
            non_compliant = len([c for c in checklist if c.get('status') == 'NonCompliant'])
            partial = len([c for c in checklist if c.get('status') == 'PartiallyCompliant'])
            
            return {
                'id': project_id,
                'name': project_data.get('name'),
                'status': project_data.get('status'),
                'progress': project_data.get('progress', 0),
                'statistics': {
                    'total_standards': total_items,
                    'compliant': compliant,
                    'non_compliant': non_compliant,
                    'partially_compliant': partial,
                    'compliance_rate': (compliant / total_items * 100) if total_items > 0 else 0
                },
                'capas': len(project_data.get('capaReports', [])),
                'open_capas': len([c for c in project_data.get('capaReports', []) 
                                  if c.get('status') != 'Finalized']),
                'mock_surveys': len(project_data.get('mockSurveys', [])),
                'critical_findings': len([c for c in checklist 
                                         if c.get('status') == 'NonCompliant' and 
                                         'critical' in c.get('item', '').lower()])
            }
            
        except Exception as e:
            print(f"❌ Error fetching project: {e}")
            return None

    def get_workspace_analytics(self) -> Dict[str, Any]:
        """
        Get workspace-wide analytics for strategic insights
        
        Returns:
            Aggregate statistics across all projects, users, departments
        """
        try:
            # Get all projects
            projects = list(self.db.collection('projects').stream())
            
            # Get all risks
            risks = list(self.db.collection('risks').stream())
            
            # Get all departments
            departments = list(self.db.collection('departments').stream())
            
            # Calculate statistics
            total_projects = len(projects)
            active_projects = len([p for p in projects if p.to_dict().get('status') == 'In Progress'])
            
            high_risks = len([r for r in risks if r.to_dict().get('level') == 'High'])
            critical_risks = len([r for r in risks if r.to_dict().get('level') == 'Critical'])
            
            return {
                'projects': {
                    'total': total_projects,
                    'active': active_projects,
                    'completed': len([p for p in projects if p.to_dict().get('status') == 'Completed']),
                    'on_hold': len([p for p in projects if p.to_dict().get('status') == 'On Hold'])
                },
                'risks': {
                    'total': len(risks),
                    'high': high_risks,
                    'critical': critical_risks
                },
                'departments': {
                    'total': len(departments)
                }
            }
            
        except Exception as e:
            print(f"❌ Error fetching analytics: {e}")
            return {}

    def search_documents(self, query: str, document_type: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search documents by name or type
        
        Args:
            query: Search term
            document_type: Filter by type (Policy, Procedure, Report, etc.)
            limit: Maximum results to return
            
        Returns:
            List of matching documents
        """
        try:
            docs_ref = self.db.collection('documents')
            
            if document_type:
                docs_ref = docs_ref.where('type', '==', document_type)
            
            # Firebase doesn't support full-text search, so we fetch and filter
            docs = docs_ref.limit(100).stream()
            
            results = []
            for doc in docs:
                doc_data = doc.to_dict()
                doc_name = doc_data.get('name', {}).get('en', '').lower()
                
                if query.lower() in doc_name:
                    results.append({
                        'id': doc.id,
                        'name': doc_data.get('name', {}).get('en'),
                        'type': doc_data.get('type'),
                        'status': doc_data.get('status'),
                        'version': doc_data.get('version')
                    })
                    
                    if len(results) >= limit:
                        break
            
            return results
            
        except Exception as e:
            print(f"❌ Error searching documents: {e}")
            return []

    def get_user_training_status(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's training completion status
        
        Args:
            user_id: User's Firebase document ID
            
        Returns:
            Training completion statistics and gaps
        """
        try:
            # Get user document
            user_doc = self.db.collection('users').document(user_id).get()
            if not user_doc.exists:
                return {'error': 'User not found'}
            
            user_data = user_doc.to_dict()
            
            # Get all training modules
            all_training = list(self.db.collection('training').stream())
            
            # Get user's completed training
            completed_ids = user_data.get('completedTraining', [])
            
            return {
                'total_modules': len(all_training),
                'completed': len(completed_ids),
                'completion_rate': (len(completed_ids) / len(all_training) * 100) if all_training else 0,
                'pending_modules': len(all_training) - len(completed_ids)
            }
            
        except Exception as e:
            print(f"❌ Error fetching training status: {e}")
            return {}


# Singleton instance
firebase_client = FirebaseClient()
