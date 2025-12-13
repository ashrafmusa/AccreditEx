"""
Test Enhanced AI Agent with Firebase Integration

Run this script to test AI responses with Firebase context.

Usage:
    python test_enhanced_agent.py
"""

import asyncio
from enhanced_agent import enhanced_agent
from firebase_client import firebase_client

async def test_agent():
    """Test enhanced AI agent"""
    print("\n🤖 Testing Enhanced AI Agent...\n")
    
    try:
        # Get first user for testing
        users = list(firebase_client.db.collection('users').limit(1).stream())
        
        if not users:
            print("❌ No users found in database. Please add a user first.")
            return
        
        user_id = users[0].id
        user_data = users[0].to_dict()
        print(f"👤 Testing with user: {user_data.get('name')} ({user_data.get('email')})\n")
        
        # Test 1: Simple context-aware chat
        print("1️⃣ Testing context-aware chat...")
        print("   User: What are my active projects?\n")
        
        response = await enhanced_agent.chat(
            message="What are my active projects?",
            user_id=user_id,
            stream=False
        )
        
        print(f"   AI: {response}\n")
        
        # Test 2: Streaming chat
        print("2️⃣ Testing streaming chat...")
        print("   User: Give me a brief summary of my workspace.\n")
        print("   AI: ", end="")
        
        async for chunk in enhanced_agent.chat(
            message="Give me a brief summary of my workspace.",
            user_id=user_id,
            stream=True
        ):
            print(chunk, end="", flush=True)
        
        print("\n")
        
        # Test 3: Project insights
        print("3️⃣ Testing project insights...")
        
        projects = list(firebase_client.db.collection('projects').limit(1).stream())
        
        if projects:
            project_id = projects[0].id
            project_data = projects[0].to_dict()
            print(f"   Analyzing project: {project_data.get('name')}\n")
            
            insights = enhanced_agent.get_project_insights(
                project_id=project_id,
                user_id=user_id
            )
            
            print(f"   📊 Insights:\n{insights['insights']}\n")
        else:
            print("   ⚠️  No projects found to analyze\n")
        
        # Test 4: Document search
        print("4️⃣ Testing AI-powered document search...")
        print("   Query: infection control procedures\n")
        
        search_results = enhanced_agent.search_compliance_documents(
            query="infection control procedures",
            user_id=user_id
        )
        
        print(f"   Found {search_results['count']} documents")
        print(f"\n   AI Analysis:\n{search_results['ai_analysis']}\n")
        
        print("✅ All agent tests completed!\n")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}\n")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_agent())
