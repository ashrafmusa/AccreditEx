import { ProjectTemplate } from '@/types/templates';

export const projectTemplates: ProjectTemplate[] = [
  // JCI (Joint Commission International) Template
  {
    id: 'template-jci-full',
    name: 'JCI Full Accreditation',
    description: 'Complete JCI accreditation preparation with all standards and requirements',
    programId: 'prog-jci',
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
    programId: 'prog-cbahi',
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
    programId: 'prog-dnv',
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
    programId: '', // Can be used with any program
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
  }
];

// Helper function to get templates by program
export const getTemplatesByProgram = (programId: string): ProjectTemplate[] => {
  return projectTemplates.filter(t => t.programId === programId || t.programId === '');
};

// Helper function to get template by ID
export const getTemplateById = (templateId: string): ProjectTemplate | undefined => {
  return projectTemplates.find(t => t.id === templateId);
};
