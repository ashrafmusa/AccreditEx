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
from compliance_scoring import calculate_checklist_compliance

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
                
                firebase_admin.initialize_app(cred, {
                    "storageBucket": os.getenv(
                        "FIREBASE_STORAGE_BUCKET",
                        "accreditex-79c08.firebasestorage.app",
                    )
                })
            except Exception as e:
                print(f"⚠️ Firebase initialization warning: {e}")
                print("   Using default credentials or application credentials")
                firebase_admin.initialize_app(options={
                    "storageBucket": os.getenv(
                        "FIREBASE_STORAGE_BUCKET",
                        "accreditex-79c08.firebasestorage.app",
                    )
                })
        
        self.db = firestore.client()

    def _resolve_org_id(self, user_data: Dict[str, Any], organization_id: Optional[str]) -> Optional[str]:
        """Resolve and validate organization scope for tenant-safe queries."""
        user_org = user_data.get('organizationId')
        if not user_org or (organization_id and organization_id != user_org):
            return None
        return user_org

    def get_user_context(self, user_id: str, organization_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get comprehensive user context from Firebase with caching
        
        Args:
            user_id: User's Firebase document ID
            
        Returns:
            Dictionary with user data, projects, permissions, etc.
        """
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
            org_id = self._resolve_org_id(user_data, organization_id)
            if not org_id:
                return {
                    'error': 'Organization scope mismatch or missing organizationId',
                    'user_data': None
                }

            cache_key = f"user_context:{org_id}:{user_id}"
            if self.use_cache and cache is not None:
                cached_data = cache.get(cache_key)
                if cached_data:
                    if performance_monitor:
                        performance_monitor.track_cache_hit(cache_key)
                    return cached_data
                if performance_monitor:
                    performance_monitor.track_cache_miss(cache_key)
            
            # New records index both leads and team members; the lead query retains
            # visibility into older records created before assignedUsers existed.
            projects_ref = self.db.collection('projects')
            assigned_projects = projects_ref\
                .where('organizationId', '==', org_id)\
                .where('assignedUsers', 'array_contains', user_id)\
                .limit(50)\
                .stream()
            legacy_lead_projects = projects_ref\
                .where('organizationId', '==', org_id)\
                .where('projectLeadId', '==', user_id)\
                .limit(50)\
                .stream()

            projects_by_id = {
                project.id: {'id': project.id, **(project.to_dict() or {})}
                for project in [*assigned_projects, *legacy_lead_projects]
            }
            user_projects = list(projects_by_id.values())[:50]
            
            # Get user's department
            department = None
            if user_data.get('department'):
                dept_doc = self.db.collection('departments')\
                    .document(user_data['department'])\
                    .get()
                if dept_doc.exists:
                    dept_data = dept_doc.to_dict()
                    if dept_data.get('organizationId') == org_id:
                        department = dept_data
            
            # Get user's recent documents inside their organization
            recent_docs = self.db.collection('documents')\
                .where('organizationId', '==', org_id)\
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
                    'organizationId': org_id,
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
                    for p in user_projects
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
            if self.use_cache and cache is not None:
                cache.set(cache_key, result, ttl=180)  # 3 minutes
            
            return result
            
        except Exception as e:
            if performance_monitor:
                performance_monitor.track_error("FirebaseError", str(e), {"user_id": user_id})
            print(f"❌ Error fetching user context: {e}")
            return {
                'error': str(e),
                'user_data': None
            }

    def get_project_details(self, project_id: str, organization_id: str) -> Optional[Dict[str, Any]]:
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
            if project_data.get('organizationId') != organization_id:
                return None
            
            checklist = project_data.get('checklist') or []
            statistics = calculate_checklist_compliance(checklist)
            total_items = len(checklist)
            
            return {
                'id': project_id,
                'name': project_data.get('name'),
                'status': project_data.get('status'),
                'progress': project_data.get('progress', 0),
                'statistics': {
                    'total_standards': total_items,
                    **statistics,
                },
                'capas': len(project_data.get('capaReports', [])),
                'open_capas': len([
                    c for c in project_data.get('capaReports', [])
                    if c.get('status') != 'Finalized'
                ]),
                'mock_surveys': len(project_data.get('mockSurveys', [])),
                'critical_findings': len([
                    c for c in checklist
                    if c.get('status') == 'Non-Compliant'
                    and 'critical' in c.get('item', '').lower()
                ])
            }
            
        except Exception as e:
            print(f"❌ Error fetching project: {e}")
            return None

    def get_workspace_analytics(self, organization_id: str) -> Dict[str, Any]:
        """
        Get workspace-wide analytics for strategic insights
        
        Returns:
            Aggregate statistics across all projects, users, departments
        """
        try:
            # Get all projects in organization scope
            projects = list(self.db.collection('projects').where('organizationId', '==', organization_id).stream())
            
            # Get all risks in organization scope
            risks = list(self.db.collection('risks').where('organizationId', '==', organization_id).stream())
            
            # Get all departments in organization scope
            departments = list(self.db.collection('departments').where('organizationId', '==', organization_id).stream())

            # Get all users in organization scope
            users = list(self.db.collection('users').where('organizationId', '==', organization_id).stream())
            
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
                },
                'users': {
                    'total': len(users)
                }
            }
            
        except Exception as e:
            print(f"❌ Error fetching analytics: {e}")
            return {}

    def search_documents(self, query: str, organization_id: str, document_type: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
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
            docs_ref = self.db.collection('documents').where('organizationId', '==', organization_id)
            
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

    def get_user_training_status(self, user_id: str, organization_id: str) -> Dict[str, Any]:
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
            if user_data.get('organizationId') != organization_id:
                return {'error': 'User does not belong to the requested organization'}
            
            # Get active training programs for this organization
            all_training = list(
                self.db.collection('trainingPrograms')
                .where('organizationId', '==', organization_id)
                .stream()
            )
            active_training_ids = {
                training.id
                for training in all_training
                if (training.to_dict() or {}).get('isActive', True)
            }
            
            status_doc = (
                self.db.collection('userTrainingStatuses')
                .document(user_id)
                .get()
            )
            status_data = status_doc.to_dict() or {} if status_doc.exists else {}
            if status_data.get('organizationId') not in (None, organization_id):
                return {'error': 'Training status is outside the requested organization'}
            completed_ids = {
                training_id
                for training_id, status in status_data.items()
                if isinstance(status, dict) and status.get('status') == 'Completed'
            } & active_training_ids
            
            return {
                'total_modules': len(active_training_ids),
                'completed': len(completed_ids),
                'completion_rate': (
                    len(completed_ids) / len(active_training_ids) * 100
                    if active_training_ids else 0
                ),
                'pending_modules': max(0, len(active_training_ids) - len(completed_ids))
            }
            
        except Exception as e:
            print(f"❌ Error fetching training status: {e}")
            return {}


# Singleton instance
firebase_client = FirebaseClient()
