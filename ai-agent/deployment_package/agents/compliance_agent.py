# Compliance Specialist Agent
# Week 2: Agent Specialization - Day 1

"""
Compliance Agent - CBAHI/JCI/ISO Standards Expert

This specialist agent handles all compliance-related tasks including:
- CBAHI 4th Edition compliance checking
- JCI 7th Edition compliance checking
- ISO 15189:2022 (Medical Laboratories) & ISO 9001:2015
- Gap analysis and remediation planning (Educational Focus)
"""

import json
from typing import Dict, Any, Optional, List
import logging
from .base_agent import BaseSpecialistAgent
from specialist_prompts import get_compliance_specialist_prompt

logger = logging.getLogger(__name__)

class ComplianceAgent(BaseSpecialistAgent):
    """
    Specialist agent for healthcare compliance checking
    
    Expertise:
    - CBAHI 4th Edition (Saudi Arabia)
    - JCI 7th Edition (International)
    - ISO 15189:2022 (Medical Laboratories)
    - ISO 9001:2015 (Quality Management)
    """
    
    def __init__(self, groq_client, firebase_client=None):
        super().__init__(groq_client, firebase_client)
        
        # Lower temperature for highly factual, standard-driven responses
        self.temperature = 0.2
        
        # Load standard mappings
        self.cbahi_standards = self._load_cbahi_standards()
        self.jci_standards = self._load_jci_standards()
        self.iso_15189_standards = self._load_iso_15189_standards()
        self.iso_9001_standards = self._load_iso_9001_standards()
        
        logger.info("📋 ComplianceAgent initialized with CBAHI, JCI, and ISO 15189 knowledge")
    
    def get_specialist_name(self) -> str:
        """Return specialist name"""
        return "Compliance Specialist"
    
    def get_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Get compliance specialist system prompt"""
        base_prompt = get_compliance_specialist_prompt()
        educational_mandate = (
            "\nCRUCIAL CONTEXT: You are operating within Accreditex, an educational platform. "
            "When pointing out non-compliance, you must explain the underlying rationale of the standard "
            "(e.g., how it impacts patient safety or analytical quality) to educate the user. Do not just audit; teach."
        )
        return base_prompt + educational_mandate
    
    # ==================== CBAHI Methods ====================
    
    async def check_cbahi_compliance(
        self, 
        document: str, 
        standard: Optional[str] = None,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Check CBAHI compliance for a document or policy"""
        logger.info(f"📋 Checking CBAHI compliance{f' for standard {standard}' if standard else ''}")
        
        if standard:
            standard_info = self.map_cbahi_standard(standard)
            message = f"""
            Review this document for compliance with CBAHI {standard}: {standard_info}.
            
            Document to Review:
            {document}
            
            Output your response strictly as a JSON object matching this schema:
            {{
                "findings": [
                    {{
                        "description": "Brief description of the finding",
                        "standard": "{standard}",
                        "status": "compliant" | "partially-compliant" | "non-compliant",
                        "risk_level": "Low" | "Medium" | "High",
                        "educational_recommendation": "How to fix this and WHY it matters for patient safety"
                    }}
                ],
                "summary_text": "Overall assessment narrative"
            }}
            """
        else:
            message = f"""
            Review this document for general CBAHI 4th Edition compliance.
            
            Document to Review:
            {document}
            
            Output your response strictly as a JSON object matching this schema:
            {{
                "findings": [
                    {{
                        "description": "Brief description",
                        "standard": "Applicable standard code (e.g., 4.2.1)",
                        "status": "compliant" | "partially-compliant" | "non-compliant",
                        "risk_level": "Low" | "Medium" | "High",
                        "educational_recommendation": "How to fix this and WHY it matters"
                    }}
                ],
                "summary_text": "Overall assessment narrative"
            }}
            """
        
        result = await self.process_request(message, context)
        
        # Attempt to parse the LLM's JSON string into a Python dict
        try:
            parsed_response = json.loads(result['response'])
            result['structured_data'] = parsed_response
        except json.JSONDecodeError:
            logger.warning("Failed to parse LLM response into JSON. Returning raw string.")
            result['structured_data'] = None

        result['standard_type'] = 'CBAHI'
        result['standard_code'] = standard
        result['compliance_check'] = True
        
        return result
    
    # ==================== JCI Methods ====================
    # (Similar JSON enforcement applied to JCI)
    
    async def check_jci_compliance(
        self, 
        document: str, 
        standard: Optional[str] = None,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Check JCI compliance for a document or policy"""
        logger.info(f"📋 Checking JCI compliance{f' for standard {standard}' if standard else ''}")
        
        if standard:
            standard_info = self.map_jci_standard(standard)
            message = f"""
            Review this document for compliance with JCI {standard}: {standard_info}.
            
            Document to Review:
            {document}
            
            Output your response strictly as a JSON object matching this schema:
            {{
                "findings": [
                    {{
                        "description": "Brief description",
                        "standard": "{standard}",
                        "status": "compliant" | "partially-compliant" | "non-compliant",
                        "risk_level": "Low" | "Medium" | "High",
                        "educational_recommendation": "How to fix this and the clinical rationale"
                    }}
                ],
                "summary_text": "Overall assessment narrative"
            }}
            """
        else:
            # General JCI prompt omitted for brevity, follows same JSON pattern
            message = f"Review this document for general JCI 7th Edition compliance... (output JSON)"
            
        result = await self.process_request(message, context)
        
        try:
            result['structured_data'] = json.loads(result['response'])
        except json.JSONDecodeError:
            result['structured_data'] = None
            
        result['standard_type'] = 'JCI'
        result['standard_code'] = standard
        
        return result
    
    # ==================== Analysis Methods ====================
    
    async def generate_gap_analysis(
        self, 
        findings: List[Dict[str, Any]],
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generate compliance gap analysis from findings"""
        logger.info(f"📊 Generating gap analysis for {len(findings)} findings")
        
        findings_text = "\n\n".join([
            f"**Finding {i+1}**: {f.get('description', 'N/A')}\n"
            f"- Standard: {f.get('standard', 'N/A')}\n"
            f"- Status: {f.get('status', 'N/A')}\n"
            f"- Risk Level: {f.get('risk_level', 'Medium')}"
            for i, f in enumerate(findings)
        ])
        
        message = f"""
        Generate a comprehensive, educational gap analysis for these compliance findings:
        
        {findings_text}
        
        Provide your response as a structured report containing:
        1. Gap Summary (Overview of compliance status)
        2. Critical Gaps (High-priority non-compliance issues)
        3. Action Plan (Prioritized remediation steps)
        4. Learning Outcomes (What the team should learn from these gaps)
        """
        
        result = await self.process_request(message, context)
        result['analysis_type'] = 'gap_analysis'
        result['findings_count'] = len(findings)
        
        return result
    
    # ==================== Standard Mappings ====================
    
    def _load_cbahi_standards(self) -> Dict[str, str]:
        return {
            "4.1.1": "Patient Identification: Two unique identifiers must be used",
            "4.2.1": "Medication Administration: Five rights (patient, drug, dose, route, time)",
            "4.4.1": "Infection Control: Hand hygiene compliance monitoring",
        }
    
    def _load_jci_standards(self) -> Dict[str, str]:
        return {
            "IPSG.1": "International Patient Safety Goals - Patient Identification",
            "IPSG.3": "International Patient Safety Goals - Medication Safety",
            "PCI.1": "Prevention and Control of Infections - Hand Hygiene",
        }
        
    def _load_iso_15189_standards(self) -> Dict[str, str]:
        """Medical laboratories — Requirements for quality and competence"""
        return {
            "7.2": "Pre-examination processes (Sample collection, transport, and handling)",
            "7.3": "Examination processes (Verification and validation of analytical methods)",
            "7.4": "Post-examination processes (Reporting of results and clinical interpretation)",
            "8.5": "Actions to address risks and opportunities for laboratory improvement",
        }
    
    def _load_iso_9001_standards(self) -> Dict[str, str]:
        return {
            "4.1": "Understanding the organization and its context",
            "5.1": "Leadership and commitment",
        }
        
    def map_cbahi_standard(self, standard_code: str) -> str:
        return self.cbahi_standards.get(standard_code, f"CBAHI {standard_code}")
        
    def map_jci_standard(self, standard_code: str) -> str:
        return self.jci_standards.get(standard_code, f"JCI {standard_code}")

    def get_compliance_statistics(self, findings: List[Dict]) -> Dict[str, Any]:
        """Calculate compliance statistics from findings"""
        total = len(findings)
        if total == 0:
            return {"total": 0, "compliance_rate": 0}
        
        # Standardize strings to lower-case for safe matching
        compliant = sum(1 for f in findings if str(f.get('status', '')).lower() == 'compliant')
        non_compliant = sum(1 for f in findings if str(f.get('status', '')).lower() == 'non-compliant')
        partial = total - compliant - non_compliant
        
        return {
            "total_checks": total,
            "compliant": compliant,
            "non_compliant": non_compliant,
            "partially_compliant": partial,
            "compliance_rate": round((compliant / total) * 100, 2),
            "risk_level": "High" if non_compliant > total * 0.3 else "Medium" if non_compliant > 0 else "Low"
        }
