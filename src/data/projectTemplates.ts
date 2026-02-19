import { ProjectTemplate } from '@/types/templates';
import { AccreditationProgram } from '@/types';

// Template definitions with program name identifiers (not IDs)
const baseTemplates = [
  // JCI (Joint Commission International) Template
  {
    id: 'template-jci-full',
    name: 'JCI Full Accreditation',
    description: 'Complete JCI accreditation preparation with all standards and requirements',
    programName: 'JCI', // Use program name instead of ID
    category: 'accreditation',
    estimatedDuration: 365,
    icon: '🏥',
    tags: ['jci', 'international', 'comprehensive'],
    checklist: [
      // International Patient Safety Goals (IPSG)
      {
        title: 'IPSG.1 - Identify Patients Correctly',
        description: 'Implement at least two patient identifiers for all procedures',
        category: 'International Patient Safety Goals',
        requiredEvidence: ['Patient identification policy', 'Staff training records', 'Audit results'],
        estimatedHours: 40,
        priority: 'high'
      },
      {
        title: 'IPSG.2 - Improve Effective Communication',
        description: 'Standardize verbal and telephone order processes',
        category: 'International Patient Safety Goals',
        requiredEvidence: ['Communication protocol', 'Read-back verification records', 'Training documentation'],
        estimatedHours: 35,
        priority: 'high'
      },
      {
        title: 'IPSG.3 - Improve Safety of High-Alert Medications',
        description: 'Develop processes for managing high-alert medications',
        category: 'International Patient Safety Goals',
        requiredEvidence: ['High-alert medication list', 'Storage protocols', 'Double-check procedures'],
        estimatedHours: 50,
        priority: 'high'
      },
      {
        title: 'IPSG.4 - Ensure Correct Site Surgery',
        description: 'Implement surgical site marking and verification processes',
        category: 'International Patient Safety Goals',
        requiredEvidence: ['Site marking protocol', 'Time-out procedure', 'Verification checklist'],
        estimatedHours: 45,
        priority: 'high'
      },
      {
        title: 'IPSG.5 - Reduce Risk of Healthcare-Associated Infections',
        description: 'Implement hand hygiene program and infection control measures',
        category: 'International Patient Safety Goals',
        requiredEvidence: ['Hand hygiene policy', 'Compliance monitoring data', 'Training records'],
        estimatedHours: 60,
        priority: 'high'
      },
      {
        title: 'IPSG.6 - Reduce Risk of Patient Harm from Falls',
        description: 'Implement fall risk assessment and prevention program',
        category: 'International Patient Safety Goals',
        requiredEvidence: ['Fall risk assessment tool', 'Prevention protocols', 'Incident reports'],
        estimatedHours: 40,
        priority: 'high'
      },
      // Access to Care and Continuity of Care (ACC)
      {
        title: 'ACC.1 - Hospital Admission Process',
        description: 'Standardize patient admission criteria and processes',
        category: 'Access to Care',
        requiredEvidence: ['Admission policy', 'Screening criteria', 'Process flowchart'],
        estimatedHours: 30,
        priority: 'medium'
      },
      {
        title: 'ACC.2 - Continuity of Care Planning',
        description: 'Develop discharge planning and follow-up processes',
        category: 'Access to Care',
        requiredEvidence: ['Discharge planning policy', 'Follow-up procedures', 'Patient education materials'],
        estimatedHours: 35,
        priority: 'medium'
      },
      // Patient and Family Rights (PFR)
      {
        title: 'PFR.1 - Informed Consent Process',
        description: 'Implement comprehensive informed consent procedures',
        category: 'Patient Rights',
        requiredEvidence: ['Consent policy', 'Consent forms', 'Staff training records'],
        estimatedHours: 25,
        priority: 'high'
      },
      {
        title: 'PFR.2 - Patient Privacy and Confidentiality',
        description: 'Ensure patient privacy and confidentiality of information',
        category: 'Patient Rights',
        requiredEvidence: ['Privacy policy', 'Confidentiality agreements', 'Access controls'],
        estimatedHours: 30,
        priority: 'high'
      },
      // Assessment of Patients (AOP)
      {
        title: 'AOP.1 - Initial Patient Assessment',
        description: 'Standardize initial patient assessment processes',
        category: 'Patient Assessment',
        requiredEvidence: ['Assessment forms', 'Timeframe compliance data', 'Staff competency records'],
        estimatedHours: 40,
        priority: 'medium'
      },
      {
        title: 'AOP.2 - Reassessment Process',
        description: 'Implement ongoing patient reassessment protocols',
        category: 'Patient Assessment',
        requiredEvidence: ['Reassessment policy', 'Documentation examples', 'Compliance audits'],
        estimatedHours: 35,
        priority: 'medium'
      },
      // Care of Patients (COP)
      {
        title: 'COP.1 - Care Planning',
        description: 'Develop individualized care plans for all patients',
        category: 'Patient Care',
        requiredEvidence: ['Care planning policy', 'Sample care plans', 'Multidisciplinary team records'],
        estimatedHours: 45,
        priority: 'medium'
      },
      {
        title: 'COP.2 - High-Risk Patients',
        description: 'Implement special care protocols for high-risk patients',
        category: 'Patient Care',
        requiredEvidence: ['High-risk protocols', 'Monitoring procedures', 'Outcome data'],
        estimatedHours: 40,
        priority: 'high'
      },
      // Medication Management and Use (MMU)
      {
        title: 'MMU.1 - Medication Management System',
        description: 'Establish comprehensive medication management processes',
        category: 'Medication Management',
        requiredEvidence: ['Medication policy', 'Formulary', 'Storage and security protocols'],
        estimatedHours: 50,
        priority: 'high'
      },
      {
        title: 'MMU.2 - Medication Ordering and Transcription',
        description: 'Standardize medication ordering and transcription processes',
        category: 'Medication Management',
        requiredEvidence: ['Ordering protocols', 'Transcription procedures', 'Error prevention measures'],
        estimatedHours: 40,
        priority: 'high'
      },
      // Quality Improvement and Patient Safety (QPS)
      {
        title: 'QPS.1 - Quality Improvement Program',
        description: 'Establish hospital-wide quality improvement program',
        category: 'Quality Improvement',
        requiredEvidence: ['QI program plan', 'Performance indicators', 'Improvement projects'],
        estimatedHours: 60,
        priority: 'high'
      },
      {
        title: 'QPS.2 - Patient Safety Program',
        description: 'Implement comprehensive patient safety program',
        category: 'Quality Improvement',
        requiredEvidence: ['Patient safety plan', 'Incident reporting system', 'Root cause analyses'],
        estimatedHours: 55,
        priority: 'high'
      },
      // Prevention and Control of Infections (PCI)
      {
        title: 'PCI.1 - Infection Prevention Program',
        description: 'Establish infection prevention and control program',
        category: 'Infection Control',
        requiredEvidence: ['IPC program', 'Surveillance data', 'Outbreak management plan'],
        estimatedHours: 50,
        priority: 'high'
      },
      {
        title: 'PCI.2 - Hand Hygiene Program',
        description: 'Implement comprehensive hand hygiene program',
        category: 'Infection Control',
        requiredEvidence: ['Hand hygiene policy', 'Compliance monitoring', 'Education materials'],
        estimatedHours: 35,
        priority: 'high'
      },
      // Governance, Leadership, and Direction (GLD)
      {
        title: 'GLD.1 - Governance Structure',
        description: 'Define organizational governance structure and responsibilities',
        category: 'Leadership',
        requiredEvidence: ['Organizational chart', 'Bylaws', 'Meeting minutes'],
        estimatedHours: 30,
        priority: 'medium'
      },
      {
        title: 'GLD.2 - Strategic Planning',
        description: 'Develop and implement strategic plan',
        category: 'Leadership',
        requiredEvidence: ['Strategic plan', 'Annual goals', 'Progress reports'],
        estimatedHours: 40,
        priority: 'medium'
      },
      // Facility Management and Safety (FMS)
      {
        title: 'FMS.1 - Safety and Security Program',
        description: 'Implement facility safety and security program',
        category: 'Facility Management',
        requiredEvidence: ['Safety plan', 'Security protocols', 'Emergency procedures'],
        estimatedHours: 45,
        priority: 'medium'
      },
      {
        title: 'FMS.2 - Hazardous Materials Management',
        description: 'Establish hazardous materials and waste management program',
        category: 'Facility Management',
        requiredEvidence: ['Hazmat policy', 'MSDS sheets', 'Disposal procedures'],
        estimatedHours: 35,
        priority: 'medium'
      },
      // Staff Qualifications and Education (SQE)
      {
        title: 'SQE.1 - Credentialing and Privileging',
        description: 'Implement credentialing and privileging processes',
        category: 'Staff Management',
        requiredEvidence: ['Credentialing policy', 'Privilege delineation', 'Verification records'],
        estimatedHours: 40,
        priority: 'high'
      },
      {
        title: 'SQE.2 - Continuing Education',
        description: 'Establish continuing education and competency assessment program',
        category: 'Staff Management',
        requiredEvidence: ['Education plan', 'Training records', 'Competency assessments'],
        estimatedHours: 35,
        priority: 'medium'
      }
    ],
    defaultPDCACycles: [
      {
        title: 'Hand Hygiene Compliance Improvement',
        description: 'Improve hand hygiene compliance rates across all departments',
        category: 'Quality',
        priority: 'High',
        estimatedDays: 90
      },
      {
        title: 'Medication Error Reduction',
        description: 'Reduce medication errors through process improvements',
        category: 'Safety',
        priority: 'High',
        estimatedDays: 120
      }
    ]
  },

  // CBAHI (Saudi Central Board for Accreditation of Healthcare Institutions) Template
  {
    id: 'template-cbahi-full',
    name: 'CBAHI Full Accreditation',
    description: 'Complete CBAHI accreditation preparation for Saudi healthcare facilities',
    programName: 'CBAHI', // Use program name instead of ID
    category: 'accreditation',
    estimatedDuration: 365,
    icon: '🏥',
    tags: ['cbahi', 'saudi', 'comprehensive'],
    checklist: [
      // Patient Safety Standards
      {
        title: 'PS.1 - Patient Identification',
        description: 'Implement two patient identifiers for all procedures',
        category: 'Patient Safety',
        requiredEvidence: ['Patient ID policy', 'Wristband protocols', 'Audit results'],
        estimatedHours: 35,
        priority: 'high'
      },
      {
        title: 'PS.2 - Medication Safety',
        description: 'Establish medication safety protocols and high-alert medication management',
        category: 'Patient Safety',
        requiredEvidence: ['Medication safety policy', 'High-alert list', 'Double-check procedures'],
        estimatedHours: 45,
        priority: 'high'
      },
      {
        title: 'PS.3 - Surgical Safety',
        description: 'Implement surgical safety checklist and site marking',
        category: 'Patient Safety',
        requiredEvidence: ['WHO surgical checklist', 'Site marking protocol', 'Time-out procedure'],
        estimatedHours: 40,
        priority: 'high'
      },
      {
        title: 'PS.4 - Infection Prevention',
        description: 'Establish infection prevention and control program',
        category: 'Patient Safety',
        requiredEvidence: ['IPC program', 'Hand hygiene compliance', 'Surveillance data'],
        estimatedHours: 50,
        priority: 'high'
      },
      {
        title: 'PS.5 - Fall Prevention',
        description: 'Implement fall risk assessment and prevention program',
        category: 'Patient Safety',
        requiredEvidence: ['Fall risk tool', 'Prevention measures', 'Incident tracking'],
        estimatedHours: 35,
        priority: 'high'
      },
      // Quality Management
      {
        title: 'QM.1 - Quality Improvement Program',
        description: 'Establish comprehensive quality improvement program',
        category: 'Quality Management',
        requiredEvidence: ['QI plan', 'Performance indicators', 'Improvement projects'],
        estimatedHours: 55,
        priority: 'high'
      },
      {
        title: 'QM.2 - Clinical Audit Program',
        description: 'Implement clinical audit and peer review processes',
        category: 'Quality Management',
        requiredEvidence: ['Audit plan', 'Audit reports', 'Action plans'],
        estimatedHours: 45,
        priority: 'medium'
      },
      // Patient Rights and Education
      {
        title: 'PR.1 - Informed Consent',
        description: 'Implement comprehensive informed consent processes',
        category: 'Patient Rights',
        requiredEvidence: ['Consent policy', 'Consent forms', 'Patient education materials'],
        estimatedHours: 30,
        priority: 'high'
      },
      {
        title: 'PR.2 - Patient Complaints Management',
        description: 'Establish patient complaints and grievance system',
        category: 'Patient Rights',
        requiredEvidence: ['Complaints policy', 'Resolution process', 'Tracking system'],
        estimatedHours: 25,
        priority: 'medium'
      },
      // Clinical Care
      {
        title: 'CC.1 - Care Planning',
        description: 'Develop individualized care plans for patients',
        category: 'Clinical Care',
        requiredEvidence: ['Care planning policy', 'Sample care plans', 'MDT documentation'],
        estimatedHours: 40,
        priority: 'medium'
      },
      {
        title: 'CC.2 - Pain Management',
        description: 'Implement pain assessment and management protocols',
        category: 'Clinical Care',
        requiredEvidence: ['Pain management policy', 'Assessment tools', 'Treatment protocols'],
        estimatedHours: 30,
        priority: 'medium'
      },
      // Medication Management
      {
        title: 'MM.1 - Medication System',
        description: 'Establish medication management system',
        category: 'Medication Management',
        requiredEvidence: ['Medication policy', 'Formulary', 'Storage protocols'],
        estimatedHours: 45,
        priority: 'high'
      },
      {
        title: 'MM.2 - Medication Reconciliation',
        description: 'Implement medication reconciliation at transitions of care',
        category: 'Medication Management',
        requiredEvidence: ['Reconciliation policy', 'Documentation forms', 'Compliance data'],
        estimatedHours: 35,
        priority: 'high'
      },
      // Leadership and Governance
      {
        title: 'LG.1 - Organizational Structure',
        description: 'Define governance structure and leadership responsibilities',
        category: 'Leadership',
        requiredEvidence: ['Organizational chart', 'Job descriptions', 'Meeting minutes'],
        estimatedHours: 30,
        priority: 'medium'
      },
      {
        title: 'LG.2 - Strategic Planning',
        description: 'Develop and implement strategic plan',
        category: 'Leadership',
        requiredEvidence: ['Strategic plan', 'Annual objectives', 'Progress monitoring'],
        estimatedHours: 40,
        priority: 'medium'
      },
      // Human Resources
      {
        title: 'HR.1 - Credentialing',
        description: 'Implement credentialing and privileging processes',
        category: 'Human Resources',
        requiredEvidence: ['Credentialing policy', 'Verification procedures', 'Privilege files'],
        estimatedHours: 40,
        priority: 'high'
      },
      {
        title: 'HR.2 - Staff Training',
        description: 'Establish orientation and continuing education program',
        category: 'Human Resources',
        requiredEvidence: ['Training plan', 'Orientation checklist', 'Training records'],
        estimatedHours: 35,
        priority: 'medium'
      },
      // Facility Management
      {
        title: 'FM.1 - Safety Management',
        description: 'Implement facility safety and emergency management program',
        category: 'Facility Management',
        requiredEvidence: ['Safety plan', 'Emergency procedures', 'Drill records'],
        estimatedHours: 40,
        priority: 'medium'
      },
      {
        title: 'FM.2 - Medical Equipment Management',
        description: 'Establish medical equipment maintenance and calibration program',
        category: 'Facility Management',
        requiredEvidence: ['Equipment inventory', 'Maintenance schedules', 'Calibration records'],
        estimatedHours: 35,
        priority: 'medium'
      }
    ],
    defaultPDCACycles: [
      {
        title: 'Reduce Medication Errors',
        description: 'Implement interventions to reduce medication administration errors',
        category: 'Safety',
        priority: 'High',
        estimatedDays: 90
      }
    ]
  },

  // DNV (Det Norske Veritas) Template
  {
    id: 'template-dnv-niaho',
    name: 'DNV NIAHO Accreditation',
    description: 'DNV Healthcare NIAHO accreditation preparation',
    programName: 'DNV', // Use program name instead of ID
    category: 'accreditation',
    estimatedDuration: 365,
    icon: '🏥',
    tags: ['dnv', 'niaho', 'iso'],
    checklist: [
      {
        title: 'Patient Safety - Identification',
        description: 'Implement reliable patient identification methods',
        category: 'Patient Safety',
        requiredEvidence: ['Patient ID policy', 'Compliance audits', 'Training records'],
        estimatedHours: 30,
        priority: 'high'
      },
      {
        title: 'ISO 9001 - Quality Management System',
        description: 'Establish ISO 9001 compliant quality management system',
        category: 'Quality Management',
        requiredEvidence: ['QMS manual', 'Process documentation', 'Internal audits'],
        estimatedHours: 60,
        priority: 'high'
      },
      {
        title: 'Medication Management',
        description: 'Implement comprehensive medication management processes',
        category: 'Medication Safety',
        requiredEvidence: ['Medication policy', 'Error reporting', 'Safety protocols'],
        estimatedHours: 45,
        priority: 'high'
      },
      {
        title: 'Infection Prevention',
        description: 'Establish infection prevention and control program',
        category: 'Infection Control',
        requiredEvidence: ['IPC program', 'Surveillance data', 'Hand hygiene compliance'],
        estimatedHours: 50,
        priority: 'high'
      },
      {
        title: 'Emergency Management',
        description: 'Develop emergency preparedness and response program',
        category: 'Emergency Management',
        requiredEvidence: ['Emergency plan', 'Drill records', 'Communication protocols'],
        estimatedHours: 40,
        priority: 'medium'
      }
    ]
  },

  // Quick Start Template
  {
    id: 'template-quick-start',
    name: 'Quick Start Project',
    description: 'Basic project template with essential checklist items',
    programName: '', // Can be used with any program
    category: 'custom',
    estimatedDuration: 90,
    icon: '⚡',
    tags: ['quick', 'basic', 'starter'],
    checklist: [
      {
        title: 'Initial Assessment',
        description: 'Conduct initial gap assessment',
        category: 'Planning',
        requiredEvidence: ['Assessment report'],
        estimatedHours: 16,
        priority: 'high'
      },
      {
        title: 'Action Plan Development',
        description: 'Develop detailed action plan',
        category: 'Planning',
        requiredEvidence: ['Action plan document'],
        estimatedHours: 24,
        priority: 'high'
      },
      {
        title: 'Policy Review',
        description: 'Review and update relevant policies',
        category: 'Documentation',
        requiredEvidence: ['Updated policies'],
        estimatedHours: 40,
        priority: 'medium'
      },
      {
        title: 'Staff Training',
        description: 'Conduct staff training sessions',
        category: 'Training',
        requiredEvidence: ['Training records', 'Attendance sheets'],
        estimatedHours: 32,
        priority: 'medium'
      },
      {
        title: 'Mock Survey',
        description: 'Conduct internal mock survey',
        category: 'Assessment',
        requiredEvidence: ['Mock survey report', 'Findings'],
        estimatedHours: 40,
        priority: 'high'
      }
    ]
  },

  // ── QAPI (Quality Assessment & Performance Improvement) Templates ──

  {
    id: 'template-qapi-annual',
    name: 'Annual QAPI Plan (CMS 5-Element)',
    description: 'Comprehensive annual QAPI plan following the CMS 5-element framework: Design & Scope, Governance & Leadership, Feedback/Data Systems/Monitoring, PIPs, and Systematic Analysis & Systemic Action',
    programName: 'QAPI',
    category: 'quality',
    estimatedDuration: 365,
    icon: '📊',
    tags: ['qapi', 'quality-improvement', 'cms', 'annual-plan'],
    checklist: [
      // Element 1: Design & Scope
      { title: 'Define QAPI Program Scope', description: 'Document scope covering all services, departments, and care processes', category: 'Element 1: Design & Scope', requiredEvidence: ['QAPI scope document', 'Organizational chart'], estimatedHours: 16, priority: 'high' },
      { title: 'Identify Quality Indicators', description: 'Select measurable quality indicators for each department and service line', category: 'Element 1: Design & Scope', requiredEvidence: ['Indicator list', 'Baseline data'], estimatedHours: 24, priority: 'high' },
      { title: 'Establish Data Collection Methods', description: 'Define how data will be collected, validated, and reported for each indicator', category: 'Element 1: Design & Scope', requiredEvidence: ['Data collection procedures', 'Data validation protocols'], estimatedHours: 20, priority: 'high' },
      // Element 2: Governance & Leadership
      { title: 'Appoint QAPI Committee', description: 'Establish QAPI committee with defined roles, responsibilities, and meeting schedule', category: 'Element 2: Governance & Leadership', requiredEvidence: ['Committee charter', 'Member list', 'Meeting schedule'], estimatedHours: 8, priority: 'high' },
      { title: 'Governing Body Oversight Plan', description: 'Document how governing body oversees QAPI activities including reporting frequency and escalation procedures', category: 'Element 2: Governance & Leadership', requiredEvidence: ['Board reporting template', 'Escalation matrix'], estimatedHours: 12, priority: 'high' },
      { title: 'Resource Allocation for QAPI', description: 'Secure budget, staffing, and technology resources for QAPI activities', category: 'Element 2: Governance & Leadership', requiredEvidence: ['Budget document', 'Staffing plan'], estimatedHours: 8, priority: 'medium' },
      // Element 3: Feedback, Data Systems & Monitoring
      { title: 'Implement Feedback Mechanisms', description: 'Establish patient satisfaction surveys, staff feedback channels, and complaint tracking', category: 'Element 3: Feedback & Data Systems', requiredEvidence: ['Survey instruments', 'Feedback policy', 'Complaint log template'], estimatedHours: 30, priority: 'high' },
      { title: 'Monthly Performance Monitoring', description: 'Configure dashboards and reports for monthly tracking of quality indicators', category: 'Element 3: Feedback & Data Systems', requiredEvidence: ['Dashboard screenshots', 'Monthly report template'], estimatedHours: 20, priority: 'high' },
      { title: 'Adverse Event Tracking System', description: 'Implement system for tracking, categorizing, and analyzing adverse events and near-misses', category: 'Element 3: Feedback & Data Systems', requiredEvidence: ['Event reporting policy', 'Tracking system documentation'], estimatedHours: 24, priority: 'high' },
      // Element 4: Performance Improvement Projects (PIPs)
      { title: 'Select Annual PIPs', description: 'Identify and prioritize at least 2 facility-wide Performance Improvement Projects based on data analysis', category: 'Element 4: PIPs', requiredEvidence: ['PIP selection criteria', 'Priority matrix', 'PIP charters'], estimatedHours: 16, priority: 'high' },
      { title: 'PIP #1 — Baseline Data Collection', description: 'Collect and document baseline performance data for first PIP', category: 'Element 4: PIPs', requiredEvidence: ['Baseline data report', 'Statistical analysis'], estimatedHours: 20, priority: 'high' },
      { title: 'PIP #1 — Intervention Implementation', description: 'Implement improvement interventions for first PIP with timeline and milestones', category: 'Element 4: PIPs', requiredEvidence: ['Intervention plan', 'Implementation timeline', 'Staff training records'], estimatedHours: 40, priority: 'high' },
      { title: 'PIP #1 — Remeasurement & Sustainability', description: 'Remeasure performance indicators and implement sustainability plan', category: 'Element 4: PIPs', requiredEvidence: ['Post-intervention data', 'Comparison analysis', 'Sustainability plan'], estimatedHours: 24, priority: 'high' },
      { title: 'PIP #2 — Full Cycle', description: 'Complete PDCA cycle for second PIP: baseline, intervention, remeasurement', category: 'Element 4: PIPs', requiredEvidence: ['PIP #2 charter', 'Data reports', 'Outcome analysis'], estimatedHours: 60, priority: 'high' },
      // Element 5: Systematic Analysis & Systemic Action
      { title: 'Root Cause Analysis Protocol', description: 'Establish RCA methodology and trigger criteria for systematic analysis of adverse events', category: 'Element 5: Systematic Analysis', requiredEvidence: ['RCA policy', 'Trigger criteria document', 'RCA template'], estimatedHours: 16, priority: 'high' },
      { title: 'Annual QAPI Effectiveness Review', description: 'Conduct end-of-year review of all QAPI activities, PIP outcomes, and program effectiveness', category: 'Element 5: Systematic Analysis', requiredEvidence: ['Annual review report', 'PIP summary', 'Next year recommendations'], estimatedHours: 24, priority: 'high' },
    ],
    defaultPDCACycles: [
      { name: 'PIP #1 PDCA Cycle', description: 'Performance Improvement Project #1 — Plan-Do-Check-Act', stage: 'Plan', improvementMetrics: [{ name: 'Primary Outcome Measure', baseline: [0], target: [0], actual: [] }] },
      { name: 'PIP #2 PDCA Cycle', description: 'Performance Improvement Project #2 — Plan-Do-Check-Act', stage: 'Plan', improvementMetrics: [{ name: 'Primary Outcome Measure', baseline: [0], target: [0], actual: [] }] },
    ]
  },

  {
    id: 'template-qapi-pip',
    name: 'Performance Improvement Project (PIP)',
    description: 'Focused 90-day PIP template with PDCA methodology, baseline/remeasurement cycles, and sustainability planning',
    programName: 'QAPI',
    category: 'quality',
    estimatedDuration: 90,
    icon: '🎯',
    tags: ['qapi', 'pip', 'pdca', 'improvement'],
    checklist: [
      { title: 'Define Problem Statement', description: 'Clearly articulate the quality gap or performance problem with supporting data', category: 'Plan', requiredEvidence: ['Problem statement document', 'Supporting data'], estimatedHours: 8, priority: 'high' },
      { title: 'Set SMART Goals', description: 'Define Specific, Measurable, Achievable, Relevant, Time-bound improvement goals', category: 'Plan', requiredEvidence: ['SMART goal worksheet'], estimatedHours: 4, priority: 'high' },
      { title: 'Collect Baseline Data', description: 'Gather and analyze baseline performance data for selected indicators', category: 'Plan', requiredEvidence: ['Baseline data collection tool', 'Statistical summary'], estimatedHours: 16, priority: 'high' },
      { title: 'Root Cause Analysis', description: 'Conduct root cause analysis to identify underlying causes of the performance gap', category: 'Plan', requiredEvidence: ['RCA report', 'Fishbone diagram', 'Contributing factors'], estimatedHours: 12, priority: 'high' },
      { title: 'Develop Intervention Plan', description: 'Design evidence-based interventions targeting identified root causes', category: 'Plan', requiredEvidence: ['Intervention plan', 'Evidence base', 'Resource requirements'], estimatedHours: 8, priority: 'high' },
      { title: 'Implement Interventions', description: 'Execute the improvement interventions per the plan timeline', category: 'Do', requiredEvidence: ['Implementation log', 'Training records', 'Progress notes'], estimatedHours: 40, priority: 'high' },
      { title: 'Staff Education & Training', description: 'Train all affected staff on new processes and expectations', category: 'Do', requiredEvidence: ['Training materials', 'Attendance records', 'Competency assessments'], estimatedHours: 16, priority: 'high' },
      { title: 'Remeasurement Data Collection', description: 'Collect post-intervention data using same methodology as baseline', category: 'Check', requiredEvidence: ['Post-intervention data', 'Comparison charts'], estimatedHours: 12, priority: 'high' },
      { title: 'Analyze Results', description: 'Compare pre/post data, assess statistical significance, document outcomes', category: 'Check', requiredEvidence: ['Statistical analysis', 'Run charts', 'Outcome report'], estimatedHours: 8, priority: 'high' },
      { title: 'Sustainability Plan', description: 'Implement monitoring and sustain gains through policy changes, ongoing audits, and accountability', category: 'Act', requiredEvidence: ['Sustainability plan', 'Policy updates', 'Monitoring schedule'], estimatedHours: 12, priority: 'high' },
      { title: 'Final Report & Lessons Learned', description: 'Document the complete PIP cycle including successes, challenges, and recommendations', category: 'Act', requiredEvidence: ['Final PIP report', 'Lessons learned document', 'Presentation to leadership'], estimatedHours: 8, priority: 'medium' },
    ],
    defaultPDCACycles: [
      { name: 'PIP PDCA Cycle', description: 'Full Plan-Do-Check-Act cycle for performance improvement', stage: 'Plan', improvementMetrics: [{ name: 'Primary Indicator', baseline: [0], target: [0], actual: [] }, { name: 'Secondary Indicator', baseline: [0], target: [0], actual: [] }] },
    ]
  },

  {
    id: 'template-qapi-rca',
    name: 'Root Cause Analysis Plan',
    description: '30-day RCA plan for systematic analysis of sentinel events or serious adverse events following CMS/TJC requirements',
    programName: 'QAPI',
    category: 'quality',
    estimatedDuration: 30,
    icon: '🔍',
    tags: ['qapi', 'rca', 'root-cause', 'sentinel-event', 'adverse-event'],
    checklist: [
      { title: 'Event Identification & Immediate Response', description: 'Document the event, secure the scene, ensure patient safety, and notify leadership', category: 'Identification', requiredEvidence: ['Event report', 'Immediate response log', 'Notification records'], estimatedHours: 4, priority: 'high' },
      { title: 'Assemble RCA Team', description: 'Select multidisciplinary team including subject matter experts, frontline staff, and leadership', category: 'Identification', requiredEvidence: ['Team roster', 'Role assignments', 'Conflict of interest disclosures'], estimatedHours: 4, priority: 'high' },
      { title: 'Timeline Reconstruction', description: 'Create detailed chronological timeline of events leading to and following the incident', category: 'Analysis', requiredEvidence: ['Event timeline', 'Medical record review', 'Staff interviews'], estimatedHours: 12, priority: 'high' },
      { title: 'Identify Contributing Factors', description: 'Use systematic tools (fishbone, 5-Why, barrier analysis) to identify contributing factors', category: 'Analysis', requiredEvidence: ['Fishbone diagram', '5-Why analysis', 'Contributing factors list'], estimatedHours: 16, priority: 'high' },
      { title: 'Determine Root Causes', description: 'Differentiate root causes from contributing factors; validate with evidence', category: 'Analysis', requiredEvidence: ['Root cause determination', 'Causal factor chart', 'Validation notes'], estimatedHours: 8, priority: 'high' },
      { title: 'Develop Action Plan', description: 'Create specific, measurable corrective actions for each root cause with owners and deadlines', category: 'Action Plan', requiredEvidence: ['Action plan document', 'Responsibility matrix', 'Timeline'], estimatedHours: 8, priority: 'high' },
      { title: 'Implement Corrective Actions', description: 'Execute corrective actions per the plan; document progress and barriers', category: 'Action Plan', requiredEvidence: ['Implementation log', 'Progress reports', 'Barrier resolutions'], estimatedHours: 20, priority: 'high' },
      { title: 'Effectiveness Monitoring', description: 'Monitor corrective action effectiveness through defined metrics and follow-up audits', category: 'Follow-Up', requiredEvidence: ['Monitoring data', 'Follow-up audit results', 'Effectiveness assessment'], estimatedHours: 12, priority: 'high' },
      { title: 'Final RCA Report', description: 'Complete and submit final RCA report to leadership and governing body', category: 'Follow-Up', requiredEvidence: ['Final RCA report', 'Board presentation', 'Action plan status update'], estimatedHours: 8, priority: 'high' },
    ]
  }
] as const;

/**
 * Generate project templates dynamically based on actual programs from Firebase
 * This ensures templates always reference valid program IDs
 */
export const generateProjectTemplates = (accreditationPrograms: AccreditationProgram[]): ProjectTemplate[] => {
  return baseTemplates.map(template => {
    // Find matching program by name (case-insensitive)
    const matchingProgram = accreditationPrograms.find(
      prog => prog.name.toLowerCase().includes(template.programName.toLowerCase())
    );

    // Return template with actual program ID from Firebase (or empty if generic/not found)
    return {
      ...template,
      programId: matchingProgram?.id || template.programName,
      checklist: [...template.checklist], // Make mutable
      tags: [...template.tags], // Make mutable
      defaultPDCACycles: 'defaultPDCACycles' in template && template.defaultPDCACycles ? [...template.defaultPDCACycles] : undefined // Make mutable
    } as unknown as ProjectTemplate;
  });
};

/**
 * Helper function to get templates by program
 * @param programId - The accreditation program ID
 * @param projectTemplates - Array of generated templates
 */
export const getTemplatesByProgram = (programId: string, projectTemplates: ProjectTemplate[]): ProjectTemplate[] => {
  return projectTemplates.filter(t => t.programId === programId || t.programId === '');
};

/**
 * Helper function to get template by ID
 * @param templateId - The template ID
 * @param projectTemplates - Array of generated templates
 */
export const getTemplateById = (templateId: string, projectTemplates: ProjectTemplate[]): ProjectTemplate | undefined => {
  return projectTemplates.find(t => t.id === templateId);
};

// For backwards compatibility - export empty array (will be populated by store)
export const projectTemplates: ProjectTemplate[] = [];
