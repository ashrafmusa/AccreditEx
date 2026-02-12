# Test suite for specialist agents
# Week 2: Agent Specialization - Day 5

"""
Test specialist agent functionality
"""

import asyncio
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

# Import specialist agents
from agents import (
    ComplianceAgent,
    RiskAssessmentAgent,
    TrainingCoordinator
)

load_dotenv()

async def test_compliance_agent():
    """Test ComplianceAgent"""
    print("\n" + "="*60)
    print("🧪 TESTING COMPLIANCE AGENT")
    print("="*60)
    
    # Initialize
    client = AsyncOpenAI(
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1"
    )
    agent = ComplianceAgent(client)
    
    # Test 1: CBAHI compliance check
    print("\n📋 Test 1: CBAHI Compliance Check")
    document = """
    Medication Administration Policy
    - All medications must be verified by two nurses
    - Patient name and ID bracelet must be checked
    - Medication dosage is recorded in patient chart
    """
    
    result = await agent.check_cbahi_compliance(document, "4.2.1")
    print(f"✅ Result: {result.get('response', 'N/A')[:200]}...")
    
    # Test 2: Risk calculation
    print("\n📊 Test 2: Risk Score Calculation")
    print("Calculation: Not in ComplianceAgent (should use RiskAssessmentAgent)")
    
    print("\n✅ ComplianceAgent tests complete!")

async def test_risk_agent():
    """Test RiskAssessmentAgent"""
    print("\n" + "="*60)
    print("🧪 TESTING RISK ASSESSMENT AGENT")
    print("="*60)
    
    # Initialize
    client = AsyncOpenAI(
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1"
    )
    agent = RiskAssessmentAgent(client)
    
    # Test 1: Risk calculation
    print("\n📊 Test 1: Risk Score Calculation")
    likelihood = 4  # Likely
    impact = 5  # Catastrophic
    score = agent.calculate_risk_score(likelihood, impact)
    level = agent.get_risk_level(score)
    print(f"Likelihood: {likelihood}, Impact: {impact}")
    print(f"✅ Score: {score}, Level: {level}")
    assert score == 20, "Score should be 20"
    assert level == "Critical", "Level should be Critical"
    
    # Test 2: Risk analysis
    print("\n⚠️ Test 2: Risk Analysis")
    result = await agent.analyze_risk(
        "Medication storage temperature control failure in pharmacy"
    )
    print(f"✅ Analysis: {result.get('response', 'N/A')[:200]}...")
    
    # Test 3: Risk prioritization
    print("\n📋 Test 3: Risk Prioritization")
    risks = [
        {"name": "Med error", "likelihood": 3, "impact": 4},
        {"name": "Fire hazard", "likelihood": 2, "impact": 5},
        {"name": "Data breach", "likelihood": 4, "impact": 3}
    ]
    prioritized = agent.prioritize_risks(risks)
    print(f"✅ Prioritized {len(prioritized)} risks:")
    for r in prioritized:
        print(f"   - {r['name']}: Level {r['level']} (Score: {r['score']})")
    
    print("\n✅ RiskAssessmentAgent tests complete!")

async def test_training_agent():
    """Test TrainingCoordinator"""
    print("\n" + "="*60)
    print("🧪 TESTING TRAINING COORDINATOR")
    print("="*60)
    
    # Initialize
    client = AsyncOpenAI(
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1"
    )
    agent = TrainingCoordinator(client)
    
    # Test 1: Competency gap analysis
    print("\n🔍 Test 1: Competency Gap Analysis")
    current_skills = ["CPR", "Patient assessment", "Documentation"]
    required_skills = ["CPR", "Patient assessment", "Documentation", "Medication administration", "Emergency response"]
    
    result = await agent.analyze_competency_gap(
        current_skills=current_skills,
        required_skills=required_skills,
        role="Registered Nurse"
    )
    print(f"✅ Gap analysis: {result.get('gaps_identified', 0)} gaps found")
    print(f"   Response: {result.get('response', 'N/A')[:200]}...")
    
    # Test 2: Training priority
    print("\n📊 Test 2: Training Priority Calculation")
    gap1 = {"skill": "Patient safety protocols", "description": "mandatory for accreditation"}
    gap2 = {"skill": "Leadership skills", "description": "beneficial for career growth"}
    
    priority1 = agent.calculate_training_priority(gap1)
    priority2 = agent.calculate_training_priority(gap2)
    print(f"✅ Gap 1: {priority1}")
    print(f"✅ Gap 2: {priority2}")
    assert priority1 == "Critical", "Should be Critical"
    assert priority2 == "Beneficial", "Should be Beneficial"
    
    print("\n✅ TrainingCoordinator tests complete!")

async def run_all_tests():
    """Run all specialist agent tests"""
    print("\n" + "="*60)
    print("🚀 STARTING SPECIALIST AGENTS TEST SUITE")
    print("="*60)
    
    try:
        await test_compliance_agent()
        await test_risk_agent()
        await test_training_agent()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_all_tests())
