# Training Coordinator Specialist Agent
# Week 2: Agent Specialization - Day 3

"""
Training Coordinator Agent - Healthcare Education & Competency Expert

This specialist agent handles all training-related tasks including:
- Competency gap analysis
- Training plan development
- Module recommendations
- Training priority assessment
"""

from typing import Dict, Any, Optional, List
import logging
from .base_agent import BaseSpecialistAgent
from specialist_prompts import get_training_specialist_prompt

logger = logging.getLogger(__name__)

class TrainingCoordinator(BaseSpecialistAgent):
    """
    Specialist agent for healthcare training coordination
    
    Expertise:
    - Staff competency assessment
    - Training needs analysis
    - Curriculum development
    - CBAHI/JCI training requirements
    """
    
    # Training Priority Levels
    PRIORITY_LEVELS = {
        "Critical": {
            "description": "Mandatory for accreditation/patient safety",
            "timeline": "Within 1 week",
            "weight": 1
        },
        "Important": {
            "description": "Required for role competency",
            "timeline": "Within 1 month",
            "weight": 2
        },
        "Beneficial": {
            "description": "Professional development",
            "timeline": "Within 3 months",
            "weight": 3
        }
    }
    
    # Training Module Categories
    TRAINING_CATEGORIES = {
        "mandatory_compliance": [
            "Fire safety",
            "Infection control",
            "Patient rights",
            "Emergency preparedness"
        ],
        "clinical_skills": [
            "CPR/BLS",
            "Medication administration",
            "Emergency response",
            "Patient assessment"
        ],
        "quality_safety": [
            "Incident reporting",
            "Risk management",
            "PDCA methodology",
            "Root cause analysis"
        ],
        "accreditation_prep": [
            "CBAHI requirements",
            "JCI standards",
            "Mock surveys",
            "Documentation"
        ],
        "leadership": [
            "Quality improvement",
            "Team management",
            "Conflict resolution",
            "Communication"
        ]
    }
    
    # Training Delivery Methods
    DELIVERY_METHODS = {
        "workshop": {
            "description": "In-person interactive session",
            "duration_range": "2-8 hours",
            "group_size": "10-30"
        },
        "e_learning": {
            "description": "Online self-paced module",
            "duration_range": "30min-2 hours",
            "group_size": "Unlimited"
        },
        "simulation": {
            "description": "Hands-on practice scenario",
            "duration_range": "1-4 hours",
            "group_size": "5-15"
        },
        "shadowing": {
            "description": "Observing experienced staff",
            "duration_range": "4-40 hours",
            "group_size": "1-3"
        },
        "mentoring": {
            "description": "One-on-one coaching",
            "duration_range": "Ongoing",
            "group_size": "1-1"
        }
    }
    
    def __init__(self, groq_client, firebase_client=None):
        super().__init__(groq_client, firebase_client)
        logger.info("🎓 TrainingCoordinator initialized with healthcare training expertise")
    
    def get_specialist_name(self) -> str:
        """Return specialist name"""
        return "Training Coordinator"
    
    def get_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Get training coordinator system prompt"""
        return get_training_specialist_prompt()
    
    # ==================== Competency Gap Analysis ====================
    
    async def analyze_competency_gap(
        self,
        current_skills: List[str],
        required_skills: List[str],
        role: str,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Identify competency gaps for a role
        
        Args:
            current_skills: List of current competencies
            required_skills: List of required competencies
            role: Staff role (e.g., "Registered Nurse", "Lab Technician")
            context: Optional organization context
            
        Returns:
            Gap analysis with prioritized training needs
        """
        logger.info(f"🔍 Analyzing competency gaps for role: {role}")
        
        # Identify gaps
        gaps = [skill for skill in required_skills if skill not in current_skills]
        
        message = f"""
        Perform competency gap analysis for this role:
        
        **Role**: {role}
        
        **Current Competencies**:
        {self._format_skills_list(current_skills)}
        
        **Required Competencies**:
        {self._format_skills_list(required_skills)}
        
        **Identified Gaps**:
        {self._format_skills_list(gaps)}
        
        Provide:
        1. **Gap Summary**: Overview of competency deficiencies
        2. **Priority Assessment**: Rate each gap as Critical/Important/Beneficial
        3. **Impact Analysis**: How these gaps affect role performance
        4. **Training Recommendations**: What training addresses each gap
        5. **Timeline**: Suggested completion schedule
        """
        
        result = await self.process_request(message, context)
        result['analysis_type'] = 'competency_gap'
        result['role'] = role
        result['gaps_identified'] = len(gaps)
        
        return result
    
    async def generate_training_plan(
        self,
        gaps: List[Dict[str, Any]],
        staff_count: int,
        budget: Optional[float] = None,
        context: Optional[Dict] = None
    ) ->Dict[str, Any]:
        """
        Generate comprehensive training plan
        
        Args:
            gaps: List of competency gaps with priorities
            staff_count: Number of staff to train
            budget: Optional training budget
            context: Optional organization context
            
        Returns:
            Detailed training plan
        """
        logger.info(f"📋 Generating training plan for {staff_count} staff, {len(gaps)} gaps")
        
        gaps_formatted = "\n".join([
            f"{i+1}. **{gap.get('skill', 'Unknown')}** "
            f"(Priority: {gap.get('priority', 'Medium')})"
            for i, gap in enumerate(gaps)
        ])
        
        budget_info = f"\n**Budget**: ${budget:,.2f}" if budget else ""
        
        message = f"""
        Develop a comprehensive training plan:
        
        **Training Needs**:
        {gaps_formatted}
        
        **Staff Count**: {staff_count}{budget_info}
        
        Create a training plan with:
        
        ## 1. Training Modules
        For each competency gap, specify:
        - **Module Name**
        - **Learning Objectives**
        - **Delivery Method** (Workshop/E-learning/Simulation/Shadowing)
        - **Duration**
        - **Delivery Format** (In-person/Online/Hybrid)
        - **Assessment Method**
        
        ## 2. Implementation Phases
        - **Phase 1**: Critical training (immediate)
        - **Phase 2**: Important training (1-3 months)
        - **Phase 3**: Beneficial training (ongoing)
        
        ## 3. Resource Requirements
        - **Trainers**: Internal SMEs or external providers
        - **Materials**: Manuals, videos, equipment
        - **Budget Estimate**: Per-person cost
        - **Facilities**: Classroom, simulation lab, etc.
        
        ## 4. Schedule
        - When to conduct each module
        - How to minimize operational disruption
        - Rotation schedules if needed
        
        ## 5. Evaluation Plan
        - **Pre-assessment**: Baseline competency
        - **Post-assessment**: Knowledge verification
        - **Competency Demonstration**: Practical test
        - **Follow-up**: 30/60/90 day check-ins
        """
        
        result = await self.process_request(message, context)
        result['plan_type'] = 'training_plan'
        result['staff_count'] = staff_count
        result['modules_count'] = len(gaps)
        
        return result
    
    async def recommend_modules(
        self,
        role: str,
        gap: str,
        priority: str = "Important",
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Recommend specific training modules for a gap
        
        Args:
            role: Staff role
            gap: Specific competency gap
            priority: Gap priority (Critical/Important/Beneficial)
            context: Optional organization context
            
        Returns:
            Module recommendations
        """
        logger.info(f"📚 Recommending modules for {role}: {gap}")
        
        message = f"""
        Recommend training modules to address this competency gap:
        
        **Role**: {role}
        **Competency Gap**: {gap}
        **Priority**: {priority}
        
        Recommend 2-3 training modules with:
        
        1. **Module Title**
        2. **Learning Objectives** (3-5 specific outcomes)
        3. **Content Outline** (Main topics covered)
        4. **Delivery Method**: {', '.join(self.DELIVERY_METHODS.keys())}
        5. **Duration**: Estimated hours
        6. **Prerequisites**: What's needed before this training
        7. **Assessment**: How to verify learning
        8. **Resources**: Materials, equipment, trainers needed
        9. **Cost Estimate**: Approximate per-person cost
        
        Prioritize:
        - Practical, hands-on content
        - Healthcare-specific scenarios
        - Meets accreditation requirements
        - Cost-effective delivery
        """
        
        result = await self.process_request(message, context)
        result['recommendation_type'] = 'training_modules'
        result['role'] = role
        result['gap'] = gap
        
        return result
    
    def calculate_training_priority(self, gap: Dict[str, Any]) -> str:
        """
        Calculate training priority for a gap
        
        Args:
            gap: Gap dictionary with details
            
        Returns:
            Priority level (Critical/Important/Beneficial)
        """
        # Check for critical indicators
        critical_keywords = [
            'safety', 'patient', 'medication', 'emergency',
            'cbahi', 'jci', 'accreditation', 'mandatory'
        ]
        
        gap_text = (
            gap.get('description', '') + ' ' +
            gap.get('skill', '')
        ).lower()
        
        has_critical = any(keyword in gap_text for keyword in critical_keywords)
        
        if has_critical:
            return "Critical"
        elif gap.get('affects_role_performance', False):
            return "Important"
        else:
            return "Beneficial"
    
    # ==================== Training Statistics ====================
    
    def get_training_statistics(self, training_records: List[Dict]) -> Dict[str, Any]:
        """
        Calculate training completion statistics
        
        Args:
            training_records: List of training records
            
        Returns:
            Statistics dictionary
        """
        if not training_records:
            return {"total": 0}
        
        total = len(training_records)
        completed = sum(1 for r in training_records if r.get('status') == 'completed')
        in_progress = sum(1 for r in training_records if r.get('status') == 'in_progress')
        not_started = sum(1 for r in training_records if r.get('status') == 'not_started')
        
        # Calculate scores
        passed = sum(1 for r in training_records if r.get('passed', False))
        
        return {
            "total_training": total,
            "completed": completed,
            "in_progress": in_progress,
            "not_started": not_started,
            "completion_rate": (completed / total) * 100 if total > 0 else 0,
            "pass_rate": (passed / completed) * 100 if completed > 0 else 0,
            "at_risk": not_started + (in_progress if in_progress > total * 0.5 else 0)
        }
    
    def _format_skills_list(self, skills: List[str]) -> str:
        """Format skills list for display"""
        if not skills:
            return "- None"
        return "\n".join([f"- {skill}" for skill in skills])
    
    async def create_orientation_program(
        self,
        role: str,
        department: str,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Create new staff orientation program
        
        Args:
            role: New staff role
            department: Department
            context: Optional organization context
            
        Returns:
            Orientation program plan
        """
        logger.info(f"🎯 Creating orientation for {role} in {department}")
        
        message = f"""
        Design a comprehensive orientation program for new staff:
        
        **Role**: {role}
        **Department**: {department}
        
        Create a structured orientation covering:
        
        ## Week 1: Organization & Safety
        - Hospital mission, vision, values
        - Fire safety, emergency procedures
        - Infection control basics
        - Patient rights and confidentiality
        
        ## Week 2: Department Orientation
        - Department structure and team
        - Workflows and processes
        - Equipment and systems training
        - Quality and safety protocols
        
        ## Week 3-4: Role-Specific Training
        - Core competencies for {role}
        - Hands-on skills practice
        - Shadowing experienced staff
        - Documentation requirements
        
        ## Assessment & Follow-up
        - Competency checklist
        - 30/60/90 day check-ins
        - Feedback and support
        
        Specify: Schedule, trainers, materials, assessment methods
        """
        
        result = await self.process_request(message, context)
        result['program_type'] = 'orientation'
        result['role'] = role
        result['department'] = department
        
        return result
