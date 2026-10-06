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
    - CBAHI/JCI/ISO 15189 training requirements
    """
    
    # Training Priority Levels
    PRIORITY_LEVELS = {
        "Critical": {
            "description": "Mandatory for accreditation/patient safety",
            "timeline": "Within 1 week",
            "weight": 1
        },
        "Important": {
            "description": "Required for role competency & quality control",
            "timeline": "Within 1 month",
            "weight": 2
        },
        "Beneficial": {
            "description": "Professional development & continuous improvement",
            "timeline": "Within 3 months",
            "weight": 3
        }
    }
    
    # Training Delivery Methods
    DELIVERY_METHODS = {
        "workshop": {
            "description": "In-person interactive session",
            "duration_range": "2-8 hours",
            "group_size": "10-30"
        },
        "e_learning": {
            "description": "Online self-paced module native to Accreditex",
            "duration_range": "30min-2 hours",
            "group_size": "Unlimited"
        },
        "simulation": {
            "description": "Hands-on practice scenario (e.g., analyzer troubleshooting)",
            "duration_range": "1-4 hours",
            "group_size": "5-15"
        },
        "shadowing": {
            "description": "Observing experienced staff at the bench",
            "duration_range": "4-40 hours",
            "group_size": "1-3"
        },
        "mentoring": {
            "description": "One-on-one coaching",
            "duration_range": "Ongoing",
            "group_size": "1-1"
        }
    }
    
    # Moderate temperature for a balance of structured curriculum and creative instructional design
    # (env: TRAINING_TEMPERATURE)
    CONFIG_PREFIX = "TRAINING"
    DEFAULT_TEMPERATURE = 0.4
    
    def __init__(self, groq_client, firebase_client=None):
        super().__init__(groq_client, firebase_client)
        logger.info("[TRAINING] TrainingCoordinator initialized with healthcare training expertise")
    
    def get_specialist_name(self) -> str:
        """Return specialist name"""
        return "Training Coordinator"
    
    def get_system_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Get training coordinator system prompt"""
        base_prompt = get_training_specialist_prompt()
        
        educational_mandate = (
            "\n\nCRUCIAL CONTEXT: You are operating within Accreditex, an educational platform for clinical governance. "
            "Your output must focus on bridging knowledge gaps in clinical laboratories, emphasizing analytical quality, "
            "patient safety, and standard compliance (e.g., ISO 15189, CBAHI). "
            "\nSYSTEM CONSTRAINT: Do NOT recommend or reference 'Canvas' as a learning management system under any circumstances. "
            "Assume all digital learning is delivered natively through the Accreditex platform."
        )
        return base_prompt + educational_mandate
    
    # ==================== Competency Gap Analysis ====================
    
    async def analyze_competency_gap(
        self,
        current_skills: List[str],
        required_skills: List[str],
        role: str,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Identify competency gaps for a role and structure output as JSON"""
        role = self.validator.sanitize(role, max_length=200, field_name="role")
        current_skills = self.validator.sanitize_list(current_skills)
        required_skills = self.validator.sanitize_list(required_skills)
        logger.info("[TRAINING] Analyzing competency gaps")
        
        gaps = [skill for skill in required_skills if skill not in current_skills]
        
        message = f"""
        Perform a competency gap analysis for this role based on the provided skills.
        
        **Role**: {role}
        **Current Competencies**: {self._format_skills_list(current_skills)}
        **Required Competencies**: {self._format_skills_list(required_skills)}
        **Identified Gaps**: {self._format_skills_list(gaps)}
        
        Output your response strictly as a JSON object matching this schema:
        {{
            "gap_summary": "1-2 sentence overview of the deficiencies",
            "prioritized_gaps": [
                {{
                    "skill": "Name of the missing skill",
                    "priority": "Critical" | "Important" | "Beneficial",
                    "impact_analysis": "How missing this skill affects clinical quality or patient safety",
                    "recommended_training": "Brief description of the training intervention"
                }}
            ],
            "estimated_completion_timeline": "Suggested schedule (e.g., '4 weeks')"
        }}
        """
        
        result = await self.process_request(message, context, response_format={"type": "json_object"})
        
        result['structured_data'] = self.parse_structured_response(
            result, {"gap_summary": str, "prioritized_gaps": list},
            {"prioritized_gaps": ["skill", "priority"]}
        )
            
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
    ) -> Dict[str, Any]:
        """Generate comprehensive, JSON-structured training plan"""
        gaps = [g for g in (gaps or []) if isinstance(g, dict)]
        staff_count = int(staff_count) if isinstance(staff_count, (int, float)) and not isinstance(staff_count, bool) else 0
        logger.info(f"[TRAINING] Generating training plan staff={staff_count} gaps={len(gaps)}")
        
        gaps_formatted = "\n".join([
            f"- **{self.validator.sanitize(gap.get('skill', 'Unknown'), max_length=200)}** "
            f"(Priority: {self.validator.sanitize(gap.get('priority', 'Medium'), max_length=50)})"
            for gap in gaps
        ])
        
        has_budget = isinstance(budget, (int, float)) and not isinstance(budget, bool) and budget > 0
        budget_info = f"\n**Budget**: ${budget:,.2f}" if has_budget else "\n**Budget**: Not specified"
        
        message = f"""
        Develop a comprehensive training plan to address the following competency gaps.
        
        **Training Needs**:
        {gaps_formatted}
        
        **Staff Count**: {staff_count} {budget_info}
        
        Output your response strictly as a JSON object matching this schema:
        {{
            "training_modules": [
                {{
                    "module_name": "Title of training",
                    "learning_objectives": ["Objective 1", "Objective 2"],
                    "delivery_method": "Workshop | E-learning | Simulation | Shadowing",
                    "duration_hours": Number,
                    "assessment_method": "How competency is verified (e.g., written exam, direct observation)"
                }}
            ],
            "implementation_phases": {{
                "phase_1_immediate": ["Action items for Critical gaps"],
                "phase_2_short_term": ["Action items for Important gaps"],
                "phase_3_ongoing": ["Action items for Beneficial gaps"]
            }},
            "resource_requirements": {{
                "trainers_needed": "Internal SMEs or external vendors",
                "materials_and_facilities": "Required equipment/spaces",
                "budget_allocation_estimate": "How to distribute the budget effectively"
            }},
            "evaluation_plan": "How the overall program success will be measured (e.g., via Accreditex dashboards)"
        }}
        """
        
        result = await self.process_request(message, context, response_format={"type": "json_object"})
        
        result['structured_data'] = self.parse_structured_response(
            result, {"training_modules": list, "implementation_phases": dict},
            {"training_modules": ["module_name"]}
        )
            
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
        """Recommend specific training modules for a gap"""
        role = self.validator.sanitize(role, max_length=200, field_name="role")
        gap = self.validator.sanitize(gap, max_length=500, field_name="gap")
        priority = self.validator.sanitize(priority, max_length=50)
        logger.info("[TRAINING] Recommending modules")
        
        message = f"""
        Recommend 2-3 specific training modules to address this competency gap.
        
        **Role**: {role}
        **Competency Gap**: {gap}
        **Priority**: {priority}
        
        Output your response strictly as a JSON object matching this schema:
        {{
            "recommendations": [
                {{
                    "module_title": "Title",
                    "learning_objectives": ["Obj 1", "Obj 2"],
                    "content_outline": ["Topic 1", "Topic 2"],
                    "delivery_method": "{' | '.join(self.DELIVERY_METHODS.keys())}",
                    "estimated_duration_hours": Number,
                    "prerequisites": "Required prior knowledge",
                    "assessment_strategy": "How to verify learning",
                    "cost_estimate_per_person": "Approximate cost in USD"
                }}
            ],
            "educational_rationale": "Why these specific modules are best suited for this gap and role."
        }}
        """
        
        result = await self.process_request(message, context, response_format={"type": "json_object"})
        
        result['structured_data'] = self.parse_structured_response(
            result, {"recommendations": list},
            {"recommendations": ["module_title"]}
        )
            
        result['recommendation_type'] = 'training_modules'
        result['role'] = role
        result['gap'] = gap
        
        return result
    
    async def create_orientation_program(
        self,
        role: str,
        department: str,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Create structured new staff orientation program"""
        role = self.validator.sanitize(role, max_length=200, field_name="role")
        department = self.validator.sanitize(department, max_length=200, field_name="department")
        logger.info("[TRAINING] Creating orientation program")
        
        message = f"""
        Design a comprehensive 4-week orientation program for new staff.
        
        **Role**: {role}
        **Department**: {department}
        
        Output your response strictly as a JSON object matching this schema:
        {{
            "program_title": "Orientation Program Name",
            "weekly_schedule": {{
                "week_1": {{
                    "theme": "Organization & Quality Management Systems",
                    "key_topics": ["Topic 1", "Topic 2"]
                }},
                "week_2": {{
                    "theme": "Department Workflows (e.g., LIS, sample receiving)",
                    "key_topics": ["Topic 1", "Topic 2"]
                }},
                "week_3": {{
                    "theme": "Role-Specific Bench Training & Equipment",
                    "key_topics": ["Topic 1", "Topic 2"]
                }},
                "week_4": {{
                    "theme": "Competency Assessment & Independent Practice",
                    "key_topics": ["Topic 1", "Topic 2"]
                }}
            }},
            "competency_checklists": ["Checklist Item 1", "Checklist Item 2"],
            "trainer_requirements": "Who should mentor this role"
        }}
        """
        
        result = await self.process_request(message, context, response_format={"type": "json_object"})
        
        result['structured_data'] = self.parse_structured_response(
            result, {"program_title": str, "weekly_schedule": dict}
        )
            
        result['program_type'] = 'orientation'
        result['role'] = role
        result['department'] = department
        
        return result

    # ==================== Utilities & Statistics (Synchronous) ====================
    
    def calculate_training_priority(self, gap: Dict[str, Any]) -> str:
        """Calculate training priority for a gap dict"""
        critical_keywords = [
            'safety', 'patient', 'medication', 'emergency',
            'cbahi', 'jci', 'iso', 'accreditation', 'mandatory', 'critical value'
        ]
        
        gap_text = (gap.get('description', '') + ' ' + gap.get('skill', '')).lower()
        has_critical = any(keyword in gap_text for keyword in critical_keywords)
        
        if has_critical:
            return "Critical"
        elif gap.get('affects_role_performance', True):
            return "Important"
        else:
            return "Beneficial"
            
    def get_training_statistics(self, training_records: List[Dict]) -> Dict[str, Any]:
        """Calculate training completion statistics"""
        if not training_records:
            return {"total": 0}
        
        total = len(training_records)
        completed = sum(1 for r in training_records if r.get('status') == 'completed')
        in_progress = sum(1 for r in training_records if r.get('status') == 'in_progress')
        not_started = sum(1 for r in training_records if r.get('status') == 'not_started')
        passed = sum(1 for r in training_records if r.get('passed', False))
        
        return {
            "total_training": total,
            "completed": completed,
            "in_progress": in_progress,
            "not_started": not_started,
            "completion_rate": round((completed / total) * 100, 2) if total > 0 else 0,
            "pass_rate": round((passed / completed) * 100, 2) if completed > 0 else 0,
            "at_risk": not_started + (in_progress if in_progress > total * 0.5 else 0)
        }
        
    def _format_skills_list(self, skills: Optional[List[str]]) -> str:
        """Format a list of skills as a comma separated string"""
        if not skills:
            return "None"
        return ", ".join(skills)
