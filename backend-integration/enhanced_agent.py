"""
Enhanced AI Agent with Firebase Database Access
Integrates Firebase client for context-aware responses

Usage:
    from enhanced_agent import EnhancedAgent
    
    agent = EnhancedAgent()
    response = agent.chat(
        message="What are my active projects?",
        user_id="user123",
        context={"page": "dashboard"}
    )
"""

from typing import Dict, Any, Optional, AsyncIterator
from firebase_client import firebase_client
import anthropic
import os

class EnhancedAgent:
    def __init__(self):
        """Initialize enhanced AI agent with Firebase access"""
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.firebase = firebase_client
        
    def _build_enhanced_context(self, user_id: str, additional_context: Optional[Dict] = None) -> str:
        """
        Build comprehensive context from Firebase data
        
        Args:
            user_id: User's Firebase document ID
            additional_context: Extra context from frontend
            
        Returns:
            Formatted context string for AI prompt
        """
        # Get user context from Firebase
        user_context = self.firebase.get_user_context(user_id)
        
        # Get workspace analytics
        analytics = self.firebase.get_workspace_analytics()
        
        # Build context string
        context_parts = ["# System Context\n"]
        
        # User information
        if user_context.get('user_data'):
            user = user_context['user_data']
            context_parts.append(f"""
## User Information
- Name: {user.get('name')}
- Role: {user.get('role')}
- Department: {user.get('department')}
- Permissions: {', '.join(user.get('permissions', []))}
""")
        
        # User's projects
        if user_context.get('assigned_projects'):
            context_parts.append("\n## User's Assigned Projects\n")
            for proj in user_context['assigned_projects']:
                context_parts.append(f"- {proj['name']} ({proj['status']}, {proj['progress']}% complete)\n")
        
        # Department info
        if user_context.get('department_info'):
            dept = user_context['department_info']
            context_parts.append(f"""
## Department Information
- Department: {dept.get('name')}
- Head: {dept.get('head')}
- Team Size: {dept.get('memberCount', 0)} members
""")
        
        # Recent activity
        if user_context.get('recent_documents'):
            context_parts.append("\n## Recent Documents\n")
            for doc in user_context['recent_documents'][:5]:
                context_parts.append(f"- {doc['name']} ({doc['type']}, {doc['status']})\n")
        
        # Workspace analytics
        if analytics:
            context_parts.append(f"""
## Workspace Overview
- Total Projects: {analytics.get('projects', {}).get('total', 0)}
- Active Projects: {analytics.get('projects', {}).get('active', 0)}
- High/Critical Risks: {analytics.get('risks', {}).get('high', 0)}/{analytics.get('risks', {}).get('critical', 0)}
- Departments: {analytics.get('departments', {}).get('total', 0)}
""")
        
        # Additional frontend context
        if additional_context:
            context_parts.append(f"\n## Current Context\n")
            context_parts.append(f"- Page: {additional_context.get('page_title', 'Unknown')}\n")
            context_parts.append(f"- Route: {additional_context.get('route', 'Unknown')}\n")
        
        return "\n".join(context_parts)
    
    async def chat(
        self, 
        message: str, 
        user_id: str,
        context: Optional[Dict] = None,
        stream: bool = False
    ) -> AsyncIterator[str] | str:
        """
        Chat with AI agent using enhanced Firebase context
        
        Args:
            message: User's message
            user_id: User's Firebase document ID
            context: Additional context from frontend
            stream: Whether to stream response
            
        Returns:
            AI response (streaming or complete)
        """
        # Build enhanced context
        enhanced_context = self._build_enhanced_context(user_id, context)
        
        # Create system prompt
        system_prompt = f"""You are AccreditEx AI Assistant, an expert in healthcare accreditation compliance.

{enhanced_context}

You have access to the user's complete workspace data above. Use this information to provide:
- Personalized recommendations based on their specific projects
- Role-appropriate guidance considering their permissions
- Department-specific compliance insights
- Proactive suggestions based on their recent activity

Always reference specific data when relevant (project names, document status, etc.) to show you understand their context."""

        # Create message
        messages = [{
            "role": "user",
            "content": message
        }]
        
        # Call Claude API
        if stream:
            async with self.client.messages.stream(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                system=system_prompt,
                messages=messages
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        else:
            response = await self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                system=system_prompt,
                messages=messages
            )
            return response.content[0].text
    
    def get_project_insights(self, project_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get AI-generated insights for a specific project
        
        Args:
            project_id: Project's Firebase document ID
            user_id: Requesting user's ID (for access control)
            
        Returns:
            Project insights including recommendations, risks, priorities
        """
        # Get project details from Firebase
        project = self.firebase.get_project_details(project_id)
        
        if not project:
            return {'error': 'Project not found'}
        
        # Build insight prompt
        prompt = f"""Analyze this accreditation project and provide strategic insights:

Project: {project['name']}
Status: {project['status']}
Progress: {project['progress']}%

Compliance Statistics:
- Total Standards: {project['statistics']['total_standards']}
- Compliant: {project['statistics']['compliant']}
- Non-Compliant: {project['statistics']['non_compliant']}
- Partially Compliant: {project['statistics']['partially_compliant']}
- Compliance Rate: {project['statistics']['compliance_rate']:.1f}%

CAPAs:
- Total: {project['capas']}
- Open: {project['open_capas']}

Critical Findings: {project['critical_findings']}
Mock Surveys: {project['mock_surveys']}

Provide:
1. Top 3 priorities to improve compliance
2. Risk assessment (What could prevent successful accreditation?)
3. Recommended next actions
4. Timeline concerns (if any)
"""

        # Get AI response
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            'project_id': project_id,
            'project_name': project['name'],
            'insights': response.content[0].text,
            'statistics': project['statistics']
        }
    
    def search_compliance_documents(
        self, 
        query: str, 
        user_id: str,
        document_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search documents with AI-powered relevance ranking
        
        Args:
            query: Search query
            user_id: User's Firebase document ID (for access control)
            document_type: Optional filter by document type
            
        Returns:
            Ranked search results with AI explanations
        """
        # Search Firebase
        results = self.firebase.search_documents(query, document_type)
        
        if not results:
            return {
                'query': query,
                'results': [],
                'message': 'No documents found matching your search'
            }
        
        # Get AI to rank and explain results
        results_text = "\n".join([
            f"{i+1}. {doc['name']} ({doc['type']}, v{doc['version']})"
            for i, doc in enumerate(results)
        ])
        
        prompt = f"""User searched for: "{query}"

Found documents:
{results_text}

Rank these documents by relevance to the search query and explain why each is relevant."""

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            'query': query,
            'results': results,
            'ai_analysis': response.content[0].text,
            'count': len(results)
        }


# Singleton instance
enhanced_agent = EnhancedAgent()
