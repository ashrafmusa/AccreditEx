# Specialist Agents Package
# Week 2: Agent Specialization

"""
This package contains specialist agent classes for different healthcare domains.
Each specialist extends BaseSpecialistAgent and provides domain-specific expertise.

Available Specialists:
- ComplianceAgent: CBAHI/JCI compliance checking
- RiskAssessmentAgent: Healthcare risk analysis
- TrainingCoordinator: Staff training and competency development
"""

from .base_agent import BaseSpecialistAgent
from .compliance_agent import ComplianceAgent
from .risk_assessment_agent import RiskAssessmentAgent
from .training_coordinator import TrainingCoordinator

__all__ = [
    'BaseSpecialistAgent',
    'ComplianceAgent',
    'RiskAssessmentAgent',
    'TrainingCoordinator'
]
