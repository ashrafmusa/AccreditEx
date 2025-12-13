"""
Test Firebase Connection and Data Retrieval

Run this script to verify Firebase Admin SDK is working correctly.

Usage:
    python test_firebase_connection.py
"""

from firebase_client import firebase_client
import json

def test_connection():
    """Test basic Firebase connection"""
    print("\n🔍 Testing Firebase Connection...\n")
    
    try:
        # Test 1: Get workspace analytics
        print("1️⃣ Fetching workspace analytics...")
        analytics = firebase_client.get_workspace_analytics()
        
        if analytics:
            print("✅ Workspace analytics retrieved:")
            print(f"   - Projects: {analytics.get('projects', {}).get('total', 0)}")
            print(f"   - Active: {analytics.get('projects', {}).get('active', 0)}")
            print(f"   - Departments: {analytics.get('departments', {}).get('total', 0)}")
        else:
            print("⚠️  No analytics data found")
        
        # Test 2: Get first user's context
        print("\n2️⃣ Fetching user context...")
        
        # Try to get first user from Firestore
        users = list(firebase_client.db.collection('users').limit(1).stream())
        
        if users:
            user_id = users[0].id
            user_data = users[0].to_dict()
            print(f"✅ Found user: {user_data.get('name')} ({user_data.get('email')})")
            
            context = firebase_client.get_user_context(user_id)
            
            if context.get('error'):
                print(f"❌ Error: {context['error']}")
            else:
                print(f"✅ User context retrieved:")
                print(f"   - Role: {context['user_data']['role']}")
                print(f"   - Department: {context['user_data']['department']}")
                print(f"   - Assigned Projects: {len(context.get('assigned_projects', []))}")
                print(f"   - Recent Documents: {len(context.get('recent_documents', []))}")
                
                # Show first project if any
                if context.get('assigned_projects'):
                    proj = context['assigned_projects'][0]
                    print(f"\n   First project:")
                    print(f"   - Name: {proj['name']}")
                    print(f"   - Status: {proj['status']}")
                    print(f"   - Progress: {proj['progress']}%")
        else:
            print("⚠️  No users found in database")
        
        # Test 3: Search documents
        print("\n3️⃣ Testing document search...")
        docs = firebase_client.search_documents("policy", limit=5)
        
        if docs:
            print(f"✅ Found {len(docs)} documents matching 'policy':")
            for i, doc in enumerate(docs[:3], 1):
                print(f"   {i}. {doc['name']} ({doc['type']})")
        else:
            print("⚠️  No documents found")
        
        # Test 4: Get project details
        print("\n4️⃣ Fetching project details...")
        
        projects = list(firebase_client.db.collection('projects').limit(1).stream())
        
        if projects:
            project_id = projects[0].id
            project_data = projects[0].to_dict()
            print(f"✅ Found project: {project_data.get('name')}")
            
            details = firebase_client.get_project_details(project_id)
            
            if details:
                print(f"✅ Project details retrieved:")
                print(f"   - Compliance Rate: {details['statistics']['compliance_rate']:.1f}%")
                print(f"   - Total Standards: {details['statistics']['total_standards']}")
                print(f"   - Open CAPAs: {details['open_capas']}")
            else:
                print("❌ Failed to get project details")
        else:
            print("⚠️  No projects found")
        
        print("\n✅ All tests completed!\n")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}\n")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test_connection()
