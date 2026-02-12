# Risk Assessment Specialist Agent
# Week 2: Agent Specialization - Day 2

"""
Risk Assessment Agent - Healthcare Risk Management Expert

This specialist agent handles all risk-related tasks including:
- Risk identification and analysis
- 5x5 risk matrix calculations
- Mitigation strategy development
- Incident investigation and root cause analysis
"""

from typing import Dict, Any, Optional, List, Tuple
import logging
from .base_agent import BaseSpecialistAgent
from specialist_prompts import get_risk_assessment_specialist_prompt

logger = logging.getLogger(__name__)

class RiskAssessmentAgent(BaseSpecialistAgent):
    """
    Specialist agent for healthcare risk assessment
    
    Expertise:
    - Risk identification and categorization
    - 5x5 risk matrix methodology
    - Mitigation planning
    - Incident analysis
    """
    
    # 5x5 Risk Matrix Configuration
    LIKELIHOOD_SCALE = {
        1: {"name": "Rare", "description": "< 1% annual probability"},
        2: {"name": "Unlikely", "description": "1-10% annual probability"},
        3: {"name": "Possible", "description": "10-50% annual probability"},
        4: {"name": "Likely", "description": "50-90% annual probability"},
        5: {"name": "Almost Certain", "description": "> 90% annual probability"}
    }
    
    IMPACT_SCALE = {
        1: {"name": "Negligible", "description": "Minor inconvenience"},
        2: {"name": "Minor", "description": "Temporary harm, quick recovery"},
        3: {"name": "Moderate", "description": "Moderate harm, extended recovery"},
        4: {"name": "Major", "description": "Permanent harm or significant impact"},
        5: {"name": "Catastrophic", "description": "Death or critical failure"}
    }
    
    RISK_LEVELS = {
        "Low": {"range": (1, 4), "color": "green", "priority": 4},
        "Medium": {"range": (5, 9), "color": "yellow", "priority": 3},
        "High": {"range": (10, 15), "color": "orange", "priority": 2},
        "Critical": {"range": (16, 25), "color": "red", "priority": 1}
    }
    
    def __init__(self, groq_client, firebase_client=None):
        super().__init__(groq_client, firebase_client)
        logger.info("⚠️ RiskAssessmentAgent initialized with 5x5 matrix methodology")
    
    def get_specialist_name(self) -> str:
        """Return specialist name"""
        return "Risk Assessment Specialist"
    
    def get_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Get risk assessment specialist system prompt"""
        return get_risk_assessment_specialist_prompt()
    
    # ==================== Risk Calculation Methods ====================
    
    def calculate_risk_score(self, likelihood: int, impact: int) -> int:
        """
        Calculate risk score using 5x5 matrix
        
        Args:
            likelihood: Likelihood rating (1-5)
            impact: Impact rating (1-5)
            
        Returns:
            Risk score (1-25)
        """
        if not (1 <= likelihood <= 5 and 1 <= impact <= 5):
            raise ValueError("Likelihood and Impact must be between 1 and 5")
        
        score = likelihood * impact
        logger.info(f"📊 Risk Score: {likelihood} × {impact} = {score}")
        return score
    
    def get_risk_level(self, score: int) -> str:
        """
        Map risk score to risk level
        
        Args:
            score: Risk score (1-25)
            
        Returns:
            Risk level (Low/Medium/High/Critical)
        """
        for level, config in self.RISK_LEVELS.items():
            min_score, max_score = config["range"]
            if min_score <= score <= max_score:
                logger.info(f"🎯 Risk Level: {level} (score: {score})")
                return level
        
        return "Unknown"
    
    def get_risk_color(self, level: str) -> str:
        """Get risk level color for visualization"""
        return self.RISK_LEVELS.get(level, {}).get("color", "gray")
    
    def get_risk_priority(self, level: str) -> int:
        """Get risk priority (1=highest, 4=lowest)"""
        return self.RISK_LEVELS.get(level, {}).get("priority", 4)
    
    def create_risk_matrix(self, risks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Create risk matrix visualization data
        
        Args:
            risks: List of risk dictionaries with likelihood and impact
            
        Returns:
            Matrix data structure for visualization
        """
        matrix = {}
        
        for risk in risks:
            likelihood = risk.get('likelihood', 3)
            impact = risk.get('impact', 3)
            score = self.calculate_risk_score(likelihood, impact)
            level = self.get_risk_level(score)
            
            key = f"{likelihood},{impact}"
            if key not in matrix:
                matrix[key] = []
            
            matrix[key].append({
                "name": risk.get('name', 'Unnamed Risk'),
                "score": score,
                "level": level,
                "color": self.get_risk_color(level)
            })
        
        return {
            "matrix": matrix,
            "total_risks": len(risks),
            "critical_count": sum(1 for r in risks if self.get_risk_level(self.calculate_risk_score(r.get('likelihood', 3), r.get('impact', 3))) == "Critical")
        }
    
    # ==================== Risk Analysis Methods ====================
    
    async def analyze_risk(
        self,
        risk_description: str,
        context: Optional[Dict] = None,
        suggest_likelihood: bool = True,
        suggest_impact: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze a risk and suggest likelihood/impact ratings
        
        Args:
            risk_description: Description of the risk
            context: Optional organization context
            suggest_likelihood: Whether to suggest likelihood rating
            suggest_impact: Whether to suggest impact rating
            
        Returns:
            Risk analysis with suggested ratings
        """
        logger.info(f"⚠️ Analyzing risk: {risk_description[:50]}...")
        
        message = f"""
        Analyze this healthcare risk and provide ratings:
        
        **Risk Description**:
        {risk_description}
        
        Please provide:
        1. **Likelihood Rating** (1-5): How likely is this risk to occur?
           - 1 (Rare): < 1% annually
           - 2 (Unlikely): 1-10% annually
           - 3 (Possible): 10-50% annually
           - 4 (Likely): 50-90% annually
           - 5 (Almost Certain): > 90% annually
        
        2. **Impact Rating** (1-5): What would be the impact if it occurs?
           - 1 (Negligible): Minor inconvenience
           - 2 (Minor): Temporary harm, quick recovery
           - 3 (Moderate): Moderate harm, extended recovery
           - 4 (Major): Permanent harm or significant impact
           - 5 (Catastrophic): Death or critical failure
        
        3. **Risk Category**: Clinical/Operational/Financial/Reputational
        
        4. **Justification**: Explain your ratings
        """
        
        result = await self.process_request(message, context)
        result['analysis_type'] = 'risk_analysis'
        result['risk_description'] = risk_description
        
        return result
    
    async def generate_mitigation_plan(
        self,
        risk: Dict[str, Any],
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate risk mitigation strategy
        
        Args:
            risk: Risk dictionary with description, likelihood, impact
            context: Optional organization context
            
        Returns:
            Mitigation plan with controls and actions
        """
        risk_name = risk.get('name', 'Unnamed Risk')
        risk_desc = risk.get('description', 'No description')
        likelihood = risk.get('likelihood', 3)
        impact = risk.get('impact', 3)
        
        score = self.calculate_risk_score(likelihood, impact)
        level = self.get_risk_level(score)
        
        logger.info(f"🛡️ Generating mitigation plan for {level} risk")
        
        message = f"""
        Develop a risk mitigation strategy for this {level} risk:
        
        **Risk**: {risk_name}
        **Description**: {risk_desc}
        **Likelihood**: {likelihood} ({self.LIKELIHOOD_SCALE[likelihood]['name']})
        **Impact**: {impact} ({self.IMPACT_SCALE[impact]['name']})
        **Risk Score**: {score}
        **Risk Level**: {level}
        
        Provide a comprehensive mitigation plan with:
        
        1. **Preventive Controls**: Measures to reduce likelihood
        2. **Detective Controls**: Early warning systems
        3. **Corrective Controls**: Response if risk occurs
        4. **Responsibility**: Who owns the mitigation
        5. **Timeline**: When to implement each control
        6. **Success Metrics**: How to measure effectiveness
        7. **Residual Risk**: Expected risk level after mitigation
        """
        
        result = await self.process_request(message, context)
        result['mitigation_plan'] = True
        result['original_risk_level'] = level
        result['risk_score'] = score
        
        return result
    
    async def analyze_incident(
        self,
        incident_data: Dict[str, Any],
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Perform root cause analysis on an incident
        
        Args:
            incident_data: Incident details (what, when, where, who, how)
            context: Optional organization context
            
        Returns:
            Root cause analysis report
        """
        logger.info(f"🔍 Analyzing incident: {incident_data.get('description', 'N/A')}")
        
        incident_desc = incident_data.get('description', 'No description')
        incident_type = incident_data.get('type', 'Unknown')
        incident_date = incident_data.get('date', 'Unknown')
        
        message = f"""
        Perform root cause analysis on this incident:
        
        **Incident Type**: {incident_type}
        **Date**: {incident_date}
        **Description**: {incident_desc}
        
        **Additional Details**:
        {self._format_incident_details(incident_data)}
        
        Provide:
        
        1. **Incident Summary**: What happened?
        2. **Root Cause Analysis**: Why did it happen? (Use 5 Whys or Fishbone)
        3. **Contributing Factors**: What else contributed?
        4. **Impact Assessment**: What was the harm/damage?
        5. **Preventive Actions**: How to prevent recurrence?
        6. **Responsible Parties**: Who should implement actions?
        7. **Follow-up**: How to monitor effectiveness?
        """
        
        result = await self.process_request(message, context)
        result['analysis_type'] = 'root_cause_analysis'
        result['incident_type'] = incident_type
        
        return result
    
    def _format_incident_details(self, incident: Dict[str, Any]) -> str:
        """Format incident details for analysis"""
        details = []
        
        for key, value in incident.items():
            if key not in ['description', 'type', 'date']:
                details.append(f"- **{key.replace('_', ' ').title()}**: {value}")
        
        return "\n".join(details) if details else "No additional details provided"
    
    # ==================== Risk Prioritization ====================
    
    def prioritize_risks(self, risks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Prioritize risks by level and score
        
        Args:
            risks: List of risk dictionaries
            
        Returns:
            Sorted list (highest priority first)
        """
        for risk in risks:
            likelihood = risk.get('likelihood', 3)
            impact = risk.get('impact', 3)
            score = self.calculate_risk_score(likelihood, impact)
            level = self.get_risk_level(score)
            
            risk['score'] = score
            risk['level'] = level
            risk['priority'] = self.get_risk_priority(level)
        
        # Sort by priority (1=highest) then by score (descending)
        sorted_risks = sorted(
            risks,
            key=lambda r: (r.get('priority', 4), -r.get('score', 0))
        )
        
        logger.info(f"📊 Prioritized {len(sorted_risks)} risks")
        return sorted_risks
    
    def get_risk_statistics(self, risks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate risk statistics
        
        Args:
            risks: List of risk dictionaries
            
        Returns:
            Statistics dictionary
        """
        if not risks:
            return {"total": 0}
        
        # Calculate scores and levels
        for risk in risks:
            likelihood = risk.get('likelihood', 3)
            impact = risk.get('impact', 3)
            score = self.calculate_risk_score(likelihood, impact)
            level = self.get_risk_level(score)
            risk['score'] = score
            risk['level'] = level
        
        # Count by level
        critical = sum(1 for r in risks if r['level'] == 'Critical')
        high = sum(1 for r in risks if r['level'] == 'High')
        medium = sum(1 for r in risks if r['level'] == 'Medium')
        low = sum(1 for r in risks if r['level'] == 'Low')
        
        # Average score
        avg_score = sum(r['score'] for r in risks) / len(risks)
        
        return {
            "total_risks": len(risks),
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
            "average_score": round(avg_score, 2),
            "highest_risk": max(risks, key=lambda r: r['score']),
            "action_required": critical + high
        }
