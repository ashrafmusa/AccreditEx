# Quick Win 1: Specialist Routing - Testing Script

"""
Test script to verify specialist routing is working correctly
"""

import asyncio
from unified_accreditex_agent import UnifiedAccreditexAgent

async def test_specialist_routing():
    """Test the specialist routing feature"""
    
    agent = UnifiedAccreditexAgent()
    
    test_messages = [
        {
            "message": "Can you audit our emergency department policies for CBAHI compliance?",
            "expected_type": "compliance",
            "description": "CBAHI compliance request"
        },
        {
            "message": "Help me assess the risk of medication errors in our ICU",
            "expected_type": "risk",
            "description": "Risk assessment request"
        },
        {
            "message": "Create a training plan for our nursing staff on infection control",
            "expected_type": "training",
            "description": "Training coordination request"
        },
        {
            "message": "What is the difference between CBAHI and JCI accreditation?",
            "expected_type": "general",
            "description": "General information question"
        },
        {
            "message": "Review this document for JCI requirement compliance and identify gaps",
            "expected_type": "compliance",
            "description": "Document compliance check"
        }
    ]
    
    print("=" * 50)
    print("SPECIALIST ROUTING TEST")
    print("=" * 50)
    print()
    
    passed = 0
    failed = 0
    
    for test in test_messages:
        detected_type = agent.detect_task_type(test["message"])
        is_correct = detected_type == test["expected_type"]
        
        status = "✅ PASS" if is_correct else "❌ FAIL"
        passed += 1 if is_correct else 0
        failed += 0 if is_correct else 1
        
        print(f"{status} | {test['description']}")
        print(f"  Message: \"{test['message'][:60]}...\"")
        print(f"  Expected: {test['expected_type']}")
        print(f"  Detected: {detected_type}")
        print()
    
    print("=" * 50)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 50)
    
    if failed == 0:
        print("🎉 All tests passed! Specialist routing is working correctly.")
    else:
        print("⚠️ Some tests failed. Review routing keywords.")

if __name__ == "__main__":
    asyncio.run(test_specialist_routing())
