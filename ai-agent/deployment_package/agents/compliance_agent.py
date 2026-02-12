# Compliance Specialist Agent
# Week 2: Agent Specialization - Day 1

"""
Compliance Agent - CBAHI/JCI/ISO Standards Expert

This specialist agent handles all compliance-related tasks including:
- CBAHI 4th Edition compliance checking
- JCI 7th Edition compliance checking
- ISO 9001:2015 quality management
- Gap analysis and remediation planning
"""

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
    - ISO 9001:2015 (Quality Management)
    """
    
    def __init__(self, groq_client, firebase_client=None):
        super().__init__(groq_client, firebase_client)
        
        # Load standard mappings
        self.cbahi_standards = self._load_cbahi_standards()
        self.jci_standards = self._load_jci_standards()
        self.iso_standards = self._load_iso_standards()
        
        logger.info("📋 ComplianceAgent initialized with CBAHI, JCI, ISO knowledge")
    
    def get_specialist_name(self) -> str:
        """Return specialist name"""
        return "Compliance Specialist"
    
    def get_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Get compliance specialist system prompt"""
        return get_compliance_specialist_prompt()
    
    # ==================== CBAHI Methods ====================
    
    async def check_cbahi_compliance(
        self, 
        document: str, 
        standard: Optional[str] = None,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Check CBAHI compliance for a document or policy
        
        Args:
            document: Document text to check
            standard: Optional specific CBAHI standard (e.g., "4.2.1")
            context: Optional organization context
            
        Returns:
            Compliance check result with gap analysis
        """
        logger.info(f"📋 Checking CBAHI compliance{f' for standard {standard}' if standard else ''}")
        
        # Build targeted prompt
        if standard:
            standard_info = self.map_cbahi_standard(standard)
            message = f"""
            Review this document for compliance with CBAHI {standard}:
            
            **Standard Requirements**:
            {standard_info}
            
            **Document to Review**:
            {document}
            
            Provide:
            1. Compliance status (Compliant/Partially Compliant/Non-Compliant)
            2. Gap analysis if applicable
            3. Specific recommendations
            """
        else:
            message = f"""
            Review this document for general CBAHI 4th Edition compliance:
            
            **Document**:
            {document}
            
            Identify:
            1. Applicable CBAHI standards
            2. Compliance status for each
            3. Critical gaps
            4. Recommendations
            """
        
        # Process request
        result = await self.process_request(message, context)
        
        # Add metadata
        result['standard_type'] = 'CBAHI'
        result['standard_code'] = standard
        result['compliance_check'] = True
        
        return result
    
    async def check_jci_compliance(
        self, 
        document: str, 
        standard: Optional[str] = None,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Check JCI compliance for a document or policy
        
        Args:
            document: Document text to check
            standard: Optional specific JCI standard (e.g., "PCI.1")
            context: Optional organization context
            
        Returns:
            Compliance check result with gap analysis
        """
        logger.info(f"📋 Checking JCI compliance{f' for standard {standard}' if standard else ''}")
        
        # Build targeted prompt
        if standard:
            standard_info = self.map_jci_standard(standard)
            message = f"""
            Review this document for compliance with JCI {standard}:
            
            **Standard Requirements**:
            {standard_info}
            
            **Document to Review**:
            {document}
            
            Provide:
            1. Compliance status
            2. Evidence of compliance or gaps
            3. Action items
            """
        else:
            message = f"""
            Review this document for JCI 7th Edition compliance:
            
            **Document**:
            {document}
            
            Identify relevant JCI standards and assess compliance.
            """
        
        result = await self.process_request(message, context)
        result['standard_type'] = 'JCI'
        result['standard_code'] = standard
        
        return result
    
    def map_cbahi_standard(self, standard_code: str) -> str:
        """
        Map CBAHI standard code to requirements
        
        Args:
            standard_code: e.g., "4.2.1", "4.3.5"
            
        Returns:
            Standard requirements text
        """
        return self.cbahi_standards.get(
            standard_code, 
            f"CBAHI {standard_code} (refer to official CBAHI 4th Edition manual)"
        )
    
    def map_jci_standard(self, standard_code: str) -> str:
        """
        Map JCI standard code to requirements
        
        Args:
            standard_code: e.g., "PCI.1", "IPSG.1"
            
        Returns:
            Standard requirements text
        """
        return self.jci_standards.get(
            standard_code,
            f"JCI {standard_code} (refer to official JCI 7th Edition manual)"
        )
    
    async def generate_gap_analysis(
        self, 
        findings: List[Dict[str, Any]],
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate compliance gap analysis from findings
        
        Args:
            findings: List of compliance findings
            context: Optional organization context
            
        Returns:
            Gap analysis report with priorities
        """
        logger.info(f"📊 Generating gap analysis for {len(findings)} findings")
        
        # Format findings for analysis
        findings_text = "\n\n".join([
            f"**Finding {i+1}**: {f.get('description', 'N/A')}\n"
            f"- Standard: {f.get('standard', 'N/A')}\n"
            f"- Status: {f.get('status', 'N/A')}\n"
            f"- Risk Level: {f.get('risk_level', 'Medium')}"
            for i, f in enumerate(findings)
        ])
        
        message = f"""
        Generate a comprehensive gap analysis for these compliance findings:
        
        {findings_text}
        
        Provide:
        1. **Gap Summary**: Overview of compliance status
        2. **Critical Gaps**: High-priority non-compliance issues
        3. **Action Plan**: Prioritized remediation steps
        4. **Timeline**: Recommended completion dates
        5. **Resource Requirements**: What's needed to close gaps
        """
        
        result = await self.process_request(message, context)
        result['analysis_type'] = 'gap_analysis'
        result['findings_count'] = len(findings)
        
        return result
    
    async def recommend_corrective_actions(
        self,
        gap: str,
        standard: str,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Recommend corrective actions for a compliance gap
        
        Args:
            gap: Description of compliance gap
            standard: Applicable standard (CBAHI/JCI/ISO)
            context: Optional organization context
            
        Returns:
            Corrective action recommendations
        """
        message = f"""
        Provide corrective action recommendations for this compliance gap:
        
        **Gap**: {gap}
        **Standard**: {standard}
        
        Recommend:
        1. **Immediate Actions** (within 1 week)
        2. **Short-term Actions** (within 1 month)
        3. **Long-term Actions** (within 3 months)
        4. **Responsible Parties**: Who should own each action
        5. **Success Metrics**: How to measure completion
        """
        
        result = await self.process_request(message, context)
        result['recommendation_type'] = 'corrective_actions'
        
        return result
    
    # ==================== Standard Mappings ====================
    
    def _load_cbahi_standards(self) -> Dict[str, str]:
        """
        Load CBAHI standard mappings
        
        In production, this would load from a knowledge base or database.
        For now, include key standards inline.
        """
        return {
            "4.1.1": "Patient Identification: Two unique identifiers must be used (name + medical record number or ID)",
            "4.1.2": "Patient Identification Bands: All patients must wear identification bands",
            "4.2.1": "Medication Administration: Five rights (patient, drug, dose, route, time)",
            "4.2.5": "High-Risk Medications: Enhanced protocols for high-risk medications",
            "4.3.1": "Emergency Equipment: Regular checks of emergency carts and equipment",
            "4.4.1": "Infection Control: Hand hygiene compliance monitoring",
            "4.5.1": "Patient Rights: Informed consent processes",
            # Add more as needed
        }
    
    def _load_jci_standards(self) -> Dict[str, str]:
        """Load JCI standard mappings"""
        return {
            "IPSG.1": "International Patient Safety Goals - Patient Identification",
            "IPSG.2": "International Patient Safety Goals - Communication Effectiveness",
            "IPSG.3": "International Patient Safety Goals - Medication Safety",
            "PCI.1": "Prevention and Control of Infections - Hand Hygiene",
            "PCI.2": "Prevention and Control of Infections - PPE Usage",
            # Add more as needed
        }
    
    def _load_iso_standards(self) -> Dict[str, str]:
        """Load ISO 9001:2015 standard mappings"""
        return {
            "4.1": "Understanding the organization and its context",
            "4.2": "Understanding the needs and expectations of interested parties",
            "5.1": "Leadership and commitment",
            "8.1": "Operational planning and control",
            # Add more as needed
        }
    
    def get_compliance_statistics(self, findings: List[Dict]) -> Dict[str, Any]:
        """
        Calculate compliance statistics from findings
        
        Args:
            findings: List of compliance findings
            
        Returns:
            Statistics dictionary
        """
        total = len(findings)
        if total == 0:
            return {"total": 0, "compliance_rate": 0}
        
        compliant = sum(1 for f in findings if f.get('status') == 'compliant')
        non_compliant = sum(1 for f in findings if f.get('status') == 'non-compliant')
        partial = total - compliant - non_compliant
        
        return {
            "total_checks": total,
            "compliant": compliant,
            "non_compliant": non_compliant,
            "partially_compliant": partial,
            "compliance_rate": (compliant / total) * 100,
            "risk_level": "High" if non_compliant > total * 0.3 else "Medium" if non_compliant > 0 else "Low"
        }
