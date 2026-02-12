"""
Document Analysis and Context Enhancement
Provides advanced document understanding for better AI responses
"""
from typing import Dict, Any, List, Optional
import re

class DocumentAnalyzer:
    """
    Analyzes documents for better context awareness
    """
    
    def __init__(self):
        # Healthcare standards keywords
        self.standards_keywords = {
            'ISO 9001': ['quality management', 'continual improvement', 'customer satisfaction', 'process approach'],
            'JCI': ['patient safety', 'quality improvement', 'accreditation', 'international standards'],
            'DNV': ['healthcare accreditation', 'niaho', 'deemed status', 'compliance'],
            'OHAS': ['occupational health', 'safety management', 'workplace safety', 'hazard prevention']
        }
        
        # Document type patterns
        self.document_patterns = {
            'policy': ['policy', 'guideline', 'directive', 'governance'],
            'procedure': ['procedure', 'sop', 'work instruction', 'process'],
            'manual': ['manual', 'handbook', 'guide'],
            'form': ['form', 'template', 'checklist', 'assessment'],
            'report': ['report', 'audit', 'review', 'findings']
        }
    
    def analyze_document_context(self, document_name: str, document_type: str = None, content_preview: str = None) -> Dict[str, Any]:
        """
        Analyze document to extract context
        
        Args:
            document_name: Name of the document
            document_type: Type of document
            content_preview: Preview/snippet of document content
            
        Returns:
            Dictionary with analysis results
        """
        analysis = {
            'document_name': document_name,
            'document_type': document_type,
            'related_standards': [],
            'inferred_type': self._infer_document_type(document_name),
            'keywords': [],
            'compliance_areas': []
        }
        
        # Detect related standards
        text = f"{document_name} {content_preview or ''}".lower()
        for standard, keywords in self.standards_keywords.items():
            if any(keyword in text for keyword in keywords):
                analysis['related_standards'].append(standard)
        
        # Extract keywords
        if content_preview:
            analysis['keywords'] = self._extract_keywords(content_preview)
        
        # Identify compliance areas
        analysis['compliance_areas'] = self._identify_compliance_areas(text)
        
        return analysis
    
    def _infer_document_type(self, document_name: str) -> Optional[str]:
        """Infer document type from name"""
        name_lower = document_name.lower()
        
        for doc_type, patterns in self.document_patterns.items():
            if any(pattern in name_lower for pattern in patterns):
                return doc_type
        
        return 'unknown'
    
    def _extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract important keywords from text"""
        # Simple keyword extraction (can be enhanced with NLP)
        text_lower = text.lower()
        
        # Common healthcare/compliance keywords
        important_keywords = [
            'quality', 'safety', 'compliance', 'accreditation', 'audit',
            'risk', 'patient', 'training', 'documentation', 'procedure',
            'policy', 'standard', 'requirement', 'control', 'improvement'
        ]
        
        found_keywords = [kw for kw in important_keywords if kw in text_lower]
        return found_keywords[:max_keywords]
    
    def _identify_compliance_areas(self, text: str) -> List[str]:
        """Identify compliance areas mentioned in text"""
        compliance_areas = []
        
        area_keywords = {
            'Patient Safety': ['patient safety', 'medication safety', 'surgical safety'],
            'Quality Management': ['quality management', 'quality improvement', 'performance improvement'],
            'Risk Management': ['risk assessment', 'risk management', 'hazard'],
            'Infection Control': ['infection control', 'hygiene', 'sterilization'],
            'Training & Competency': ['training', 'competency', 'education', 'staff development'],
            'Documentation': ['documentation', 'medical records', 'record keeping'],
            'Emergency Preparedness': ['emergency', 'disaster', 'preparedness']
        }
        
        for area, keywords in area_keywords.items():
            if any(keyword in text for keyword in keywords):
                compliance_areas.append(area)
        
        return compliance_areas
    
    def get_document_recommendations(self, document_analysis: Dict[str, Any]) -> List[str]:
        """
        Get recommendations based on document analysis
        
        Args:
            document_analysis: Result from analyze_document_context
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # Recommendations based on document type
        doc_type = document_analysis['inferred_type']
        if doc_type == 'policy':
            recommendations.append("Ensure policy is reviewed annually and approved by appropriate authority")
            recommendations.append("Cross-reference with related procedures")
        elif doc_type == 'procedure':
            recommendations.append("Include step-by-step instructions and responsible parties")
            recommendations.append("Add revision history and effective date")
        elif doc_type == 'form':
            recommendations.append("Ensure all fields are clearly labeled")
            recommendations.append("Include instructions for completion")
        
        # Recommendations based on standards
        for standard in document_analysis['related_standards']:
            if standard == 'ISO 9001':
                recommendations.append("Reference ISO 9001 clauses for alignment")
            elif standard == 'JCI':
                recommendations.append("Ensure compliance with JCI standards and measurement elements")
        
        return recommendations

# Global analyzer instance
document_analyzer = DocumentAnalyzer()
