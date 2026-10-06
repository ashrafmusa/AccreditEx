# Risk Assessment Specialist Agent
# Week 2: Agent Specialization - Day 2

"""
Risk Assessment Agent - Healthcare Risk Management Expert

This specialist agent handles all risk-related tasks including:
- Risk identification and analysis
- 5x5 risk matrix calculations
- Mitigation strategy development (Hierarchy of Controls)
- Incident investigation and root cause analysis (Ishikawa/SEIPS)
"""

import json
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
    - Hierarchy of Controls mitigation planning
    - Root Cause Analysis (Ishikawa 6Ms / 5 Whys)
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
        1: {"name": "Negligible", "description": "Minor inconvenience, no patient harm"},
        2: {"name": "Minor", "description": "Temporary harm, quick recovery, minor financial loss"},
        3: {"name": "Moderate", "description": "Moderate harm, extended recovery, operational disruption"},
        4: {"name": "Major", "description": "Permanent harm, significant financial/reputational damage"},
        5: {"name": "Catastrophic", "description": "Death, critical failure, facility closure"}
    }
    
    RISK_LEVELS = {
        "Low": {"range": (1, 4), "color": "green", "priority": 4},
        "Medium": {"range": (5, 9), "color": "yellow", "priority": 3},
        "High": {"range": (10, 15), "color": "orange", "priority": 2},
        "Critical": {"range": (16, 25), "color": "red", "priority": 1}
    }
    
    def __init__(self, groq_client, firebase_client=None):
        super().__init__(groq_client, firebase_client)
        # Risk assessment requires analytical consistency
        self.temperature = 0.2
        logger.info("⚠️ RiskAssessmentAgent initialized with 5x5 matrix and LSS methodologies")
    
    def get_specialist_name(self) -> str:
        return "Risk Assessment Specialist"
    
    def get_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Get risk assessment specialist system prompt with educational mandate"""
        base_prompt = get_risk_assessment_specialist_prompt()
        
        educational_mandate = (
            "\n\nCRUCIAL CONTEXT: You are operating within Accreditex, an educational platform for clinical laboratories. "
            "Your output must not only solve the problem but teach the user *why*. "
            "Apply Lean Six Sigma principles, emphasize systemic work-system flaws over individual blame, "
            "and clearly separate clinical lab phases (Pre-analytical, Analytical, Post-analytical) where applicable."
        )
        return base_prompt + educational_mandate
    
    # ==================== Risk Calculation Methods ====================
    # (Synchronous math and mapping methods remain unchanged but highly effective)
    
    def calculate_risk_score(self, likelihood: int, impact: int) -> int:
        """Calculate risk score using 5x5 matrix"""
        if not (1 <= likelihood <= 5 and 1 <= impact <= 5):
            raise ValueError("Likelihood and Impact must be between 1 and 5")
        
        score = likelihood * impact
        logger.debug(f"📊 Risk Score: {likelihood} × {impact} = {score}")
        return score
    
    def get_risk_level(self, score: int) -> str:
        """Map risk score to risk level"""
        for level, config in self.RISK_LEVELS.items():
            min_score, max_score = config["range"]
            if min_score <= score <= max_score:
                return level
        return "Unknown"
    
    def get_risk_color(self, level: str) -> str:
        """Get risk level color for visualization"""
        return self.RISK_LEVELS.get(level, {}).get("color", "gray")
    
    def get_risk_priority(self, level: str) -> int:
        """Get risk priority (1=highest, 4=lowest)"""
        return self.RISK_LEVELS.get(level, {}).get("priority", 4)
    
    def create_risk_matrix(self, risks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create structured risk matrix visualization data"""
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
    
    # ==================== Risk Analysis Methods (LLM-Powered) ====================
    
    async def analyze_risk(
        self,
        risk_description: str,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Analyze a risk and definitively suggest likelihood/impact ratings"""
        logger.info(f"⚠️ Analyzing risk: {risk_description[:50]}...")
        
        message = f"""
        Analyze this healthcare clinical/operational risk and provide precise matrix ratings.
        
        **Risk Description**:
        {risk_description}
        
        Output your response strictly as a JSON object matching this schema:
        {{
            "likelihood_rating": 1-5 (Integer),
            "likelihood_justification": "Why this frequency was chosen",
            "impact_rating": 1-5 (Integer),
            "impact_justification": "Why this severity was chosen",
            "risk_category": "Pre-analytical | Analytical | Post-analytical | IT/Infrastructure | Personnel",
            "educational_insight": "A 1-sentence teaching point on why this risk occurs systemically."
        }}
        """
        
        result = await self.process_request(message, context, response_format={"type": "json_object"})
        
        try:
            parsed_data = json.loads(result['response'])
            
            # Auto-calculate the derived metrics based on the LLM's assessment
            l_rating = parsed_data.get("likelihood_rating", 3)
            i_rating = parsed_data.get("impact_rating", 3)
            score = self.calculate_risk_score(l_rating, i_rating)
            
            parsed_data["calculated_score"] = score
            parsed_data["calculated_level"] = self.get_risk_level(score)
            
            result['structured_data'] = parsed_data
            
        except json.JSONDecodeError:
            logger.error("Failed to parse analyze_risk LLM response into JSON.")
            result['structured_data'] = None
            
        result['analysis_type'] = 'risk_assessment'
        return result
    
    async def generate_mitigation_plan(
        self,
        risk: Dict[str, Any],
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generate risk mitigation strategy using Hierarchy of Controls"""
        risk_name = risk.get('name', 'Unnamed Risk')
        risk_desc = risk.get('description', 'No description')
        likelihood = risk.get('likelihood', 3)
        impact = risk.get('impact', 3)
        score = self.calculate_risk_score(likelihood, impact)
        level = self.get_risk_level(score)
        
        logger.info(f"🛡️ Generating mitigation plan for {level} risk")
        
        message = f"""
        Develop a systemic risk mitigation strategy for this {level} risk using the Hierarchy of Controls.
        
        **Risk**: {risk_name}
        **Description**: {risk_desc}
        **Current Score**: {score} ({level})
        
        Output your response strictly as a JSON object matching this schema:
        {{
            "hierarchy_of_controls": {{
                "elimination_or_substitution": "How to physically remove the hazard (if possible)",
                "engineering_controls": "System/physical changes to isolate people from the hazard (e.g., Poka-Yoke)",
                "administrative_controls": "Changes to work processes, policies, or training",
                "ppe": "Personal protective equipment (if applicable)"
            }},
            "implementation_timeline": [
                {{"phase": "Immediate (0-7 days)", "action": "string"}},
                {{"phase": "Long-term (1-3 months)", "action": "string"}}
            ],
            "projected_residual_risk_score": 1-25 (Integer predicting the new score post-mitigation),
            "success_metric": "KPI to track effectiveness"
        }}
        """
        
        result = await self.process_request(message, context, response_format={"type": "json_object"})
        
        try:
            result['structured_data'] = json.loads(result['response'])
        except json.JSONDecodeError:
            result['structured_data'] = None
            
        result['mitigation_plan'] = True
        result['original_risk_level'] = level
        
        return result
    
    async def analyze_incident(
        self,
        incident_data: Dict[str, Any],
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Perform root cause analysis utilizing Ishikawa (Fishbone) structure"""
        logger.info(f"🔍 Analyzing incident: {incident_data.get('description', 'N/A')[:50]}")
        
        incident_desc = incident_data.get('description', 'No description')
        incident_type = incident_data.get('type', 'Unknown')
        
        message = f"""
        Perform a Root Cause Analysis (RCA) on the following incident using the Ishikawa (Fishbone) 6M framework.
        
        **Incident Type**: {incident_type}
        **Description**: {incident_desc}
        **Additional Details**:
        {self._format_incident_details(incident_data)}
        
        Output your response strictly as a JSON object matching this schema:
        {{
            "incident_summary": "1-2 sentence objective summary",
            "ishikawa_analysis": {{
                "man_personnel": ["factors related to staff (fatigue, training, competence)"],
                "machine_equipment": ["factors related to analyzers, IT, or physical tools"],
                "method_process": ["issues with SOPs, workflow, or policies"],
                "material": ["reagents, samples, consumables"],
                "measurement": ["calibration, QC, inspection issues"],
                "milieu_environment": ["lighting, layout, 5S status, culture"]
            }},
            "primary_root_cause": "The single most systemic failure point identified",
            "preventive_actions": ["Action 1", "Action 2"],
            "educational_takeaway": "Why blaming human error is insufficient here."
        }}
        """
        
        result = await self.process_request(message, context, response_format={"type": "json_object"})
        
        try:
            result['structured_data'] = json.loads(result['response'])
        except json.JSONDecodeError:
            result['structured_data'] = None
            
        result['analysis_type'] = 'root_cause_analysis'
        return result
    
    def _format_incident_details(self, incident: Dict[str, Any]) -> str:
        """Format incident details for analysis"""
        details = [f"- **{k.replace('_', ' ').title()}**: {v}" for k, v in incident.items() if k not in ['description', 'type', 'date']]
        return "\n".join(details) if details else "No additional details provided"

    # ==================== Risk Prioritization and Statistics ====================
    # (These remain robust as originally written, leveraging the sync methods)
    
    def prioritize_risks(self, risks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Prioritize risks by level and score"""
        for risk in risks:
            score = self.calculate_risk_score(risk.get('likelihood', 3), risk.get('impact', 3))
            level = self.get_risk_level(score)
            risk.update({
                'score': score,
                'level': level,
                'priority': self.get_risk_priority(level)
            })
            
        return sorted(risks, key=lambda r: (r.get('priority', 4), -r.get('score', 0)))
    
    def get_risk_statistics(self, risks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate aggregate risk statistics"""
        if not risks:
            return {"total": 0}
            
        for risk in risks:
            score = self.calculate_risk_score(risk.get('likelihood', 3), risk.get('impact', 3))
            risk['score'] = score
            risk['level'] = self.get_risk_level(score)
            
        return {
            "total_risks": len(risks),
            "critical": sum(1 for r in risks if r['level'] == 'Critical'),
            "high": sum(1 for r in risks if r['level'] == 'High'),
            "medium": sum(1 for r in risks if r['level'] == 'Medium'),
            "low": sum(1 for r in risks if r['level'] == 'Low'),
            "average_score": round(sum(r['score'] for r in risks) / len(risks), 2),
            "highest_risk": max(risks, key=lambda r: r['score']),
            "action_required": sum(1 for r in risks if r['level'] in ['Critical', 'High'])
        }
