export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';
export type Theme = 'light' | 'dark';

export type SettingsSection = 'profile' | 'security' | 'notifications' | 'accessibility' | 'visual' | 'usageTracking' | 'firebaseUsage' | 'users' | 'accreditationHub' | 'competencies' | 'data' | 'firebaseSetup' | 'about' | 'settingsPresets' | 'versionHistory' | 'auditLog' | 'bulkUserImport' | 'departments' | 'limsIntegration';

export type NavigationView = 'dashboard' | 'analyticsHub' | 'calendar' | 'riskHub' | 'auditHub' | 'documentControl' | 'projects' | 'projectDetail' | 'createProject' | 'editProject' | 'standards' | 'departments' | 'departmentDetail' | 'settings' | 'userProfile' | 'trainingHub' | 'trainingDetail' | 'certificate' | 'mockSurvey' | 'surveyReport' | 'accreditationHub' | 'dataHub' | 'messaging' | 'knowledgeBase' | 'labOperations';

// ── Knowledge Base Types ──────────────────────────────────

export type KBArticleCategory =
  | 'best_practice' | 'policy_guidance' | 'regulatory_update'
  | 'clinical_protocol' | 'safety_alert' | 'how_to' | 'faq';

export const KB_CATEGORY_LABELS: Record<KBArticleCategory, string> = {
  best_practice: 'Best Practice',
  policy_guidance: 'Policy Guidance',
  regulatory_update: 'Regulatory Update',
  clinical_protocol: 'Clinical Protocol',
  safety_alert: 'Safety Alert',
  how_to: 'How-To Guide',
  faq: 'FAQ',
};

export interface KBArticle {
  id: string;
  title: string;
  category: KBArticleCategory;
  summary: string;
  content: string;
  tags: string[];
  author: string;
  authorId: string;
  relatedStandardIds?: string[];
  relatedDocumentIds?: string[];
  publishedAt: string;
  updatedAt: string;
  viewCount?: number;
  helpful?: number;
  isPinned?: boolean;
}

export interface NavigationState {
  view: NavigationView;
  section?: SettingsSection;
  projectId?: string;
  departmentId?: string;
  userId?: string;
  trainingId?: string;
  surveyId?: string;
  certificateId?: string;
  programId?: string;
  filter?: string;
}

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category?: 'project' | 'audit' | 'training' | 'compliance' | 'task' | 'system';
  priority?: 'low' | 'normal' | 'high' | 'critical';
  read: boolean;
  archived: boolean;
  timestamp: Date;
  expiresAt?: Date;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  data?: Record<string, any>;
};

export type Message = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'read' | 'deleted';
  conversationId: string;
  attachments?: string[];
  mentions?: string[];
};

export type Conversation = {
  id: string;
  participantIds: [string, string];
  lastMessageAt: Date;
  unreadCount: number;
  lastMessage?: Message;
};

export interface LocalizedString {
  en: string;
  ar: string;
}

export const UserRole = {
  Admin: 'Admin',
  ProjectLead: 'ProjectLead',
  TeamMember: 'TeamMember',
  Auditor: 'Auditor',
  Viewer: 'Viewer',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ProjectStatus = {
  NotStarted: 'Not Started',
  InProgress: 'In Progress',
  OnHold: 'On Hold',
  Completed: 'Completed',
  Finalized: 'Finalized',
  Open: 'Open',
  Closed: 'Closed',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const ComplianceStatus = {
  Compliant: 'Compliant',
  PartiallyCompliant: 'Partially Compliant',
  NonCompliant: 'Non-Compliant',
  NotApplicable: 'Not Applicable',
  NotStarted: 'Not Started',
} as const;
export type ComplianceStatus = (typeof ComplianceStatus)[keyof typeof ComplianceStatus];

export const StandardCriticality = {
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
} as const;
export type StandardCriticality = (typeof StandardCriticality)[keyof typeof StandardCriticality];

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
}

export interface GlobeSettings {
  baseColor: string;
  markerColor: string;
  glowColor: string;
  scale: number;
  darkness: number;
  lightIntensity: number;
  rotationSpeed: number;
}

export interface AppearanceSettings {
  compactMode: boolean;
  sidebarCollapsed: boolean;
  showAnimations: boolean;
  cardStyle: string;
  customColors: {
    primary: string;
    success: string;
    warning: string;
    danger: string;
  };
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
  projectUpdates: boolean;
  trainingDueDates: boolean;
  auditSchedules: boolean;
  criticalAlertsOnly?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  digestFrequency?: 'instant' | 'daily' | 'weekly';
  notificationSound?: boolean;
  desktopNotifications?: boolean;
}

export interface AccessibilitySettings {
  fontSize: string;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
}

export interface UsageMonitorSettings {
  trackPageViews: boolean;
  trackUserActions: boolean;
  trackPerformanceMetrics: boolean;
  dataRetentionDays: number;
  autoExportEnabled: boolean;
  alertThreshold: number;
}

export interface UsersSettings {
  enableUserManagement: boolean;
  requireEmailVerification: boolean;
  autoDeactivateInactiveUsers: boolean;
  inactivityThresholdDays: number;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
}

export interface AppSettings {
  appName: string;
  logoUrl: string;
  primaryColor: string;
  defaultLanguage: Language;
  defaultUserRole: UserRole;
  passwordPolicy: PasswordPolicy;
  globeSettings: GlobeSettings;
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
  usageMonitor?: UsageMonitorSettings;
  users?: UsersSettings;
}

export interface ProgramDocument {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
  isPublic?: boolean;
}

export interface StandardDocument {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
  isPublic?: boolean;
}

export interface Standard {
  id?: string;
  standardId: string;
  programId: string;
  section: string;
  description: string;
  criticality?: StandardCriticality;
  totalMeasures?: number;
  subStandards?: {
    id: string;
    description: string;
  }[];
  documentIds?: string[];
  documents?: StandardDocument[];
  version?: string;
  effectiveDate?: string;
  retiredDate?: string;
  regulatoryBody?: string;
  category?: string;
}

export interface Competency {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  category?: string;
  level?: 'basic' | 'intermediate' | 'advanced' | 'expert';
  validityPeriodMonths?: number;
  relatedStandardIds?: string[];
  relatedTrainingIds?: string[];
  isActive?: boolean;
}

export interface Department {
  id: string;
  name: LocalizedString;
  requiredCompetencyIds?: string[];
  head?: string;
  members?: string[];
  parentDepartmentId?: string;
  isActive?: boolean;
  createdAt?: string;
  description?: LocalizedString;
  location?: string;
}

export interface User {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  departmentId?: string;
  department?: string;
  jobTitle?: string;
  hireDate?: string;
  permissions?: string[];
  readAndAcknowledge?: Record<string, boolean>;
  competencies?: {
    competencyId: string;
    issueDate: string;
    expiryDate: string;
    evidenceDocumentIds?: string[];
  }[];
  trainingAssignments?: {
    trainingId: string;
    assignedBy?: string;
    assignedDate: string;
    dueDate?: string;
  }[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  supervisorId?: string;
  phone?: string;
  licenses?: UserLicense[];
  personnelDocuments?: PersonnelDocument[];
}

export interface UserLicense {
  id: string;
  name: string;
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'pending_renewal' | 'suspended';
  category?: 'professional' | 'facility' | 'regulatory' | 'specialty';
  evidenceDocumentIds?: string[];
  renewalReminderDays?: number;
  notes?: string;
}

// ── CE Credit Management ──────────────────────────────────

export type CECreditCategory =
  | 'CME' | 'CNE' | 'CEU' | 'CPE' | 'MOC' | 'Other';

export const CE_CATEGORY_LABELS: Record<CECreditCategory, string> = {
  CME: 'Continuing Medical Education',
  CNE: 'Continuing Nursing Education',
  CEU: 'Continuing Education Unit',
  CPE: 'Continuing Pharmacy Education',
  MOC: 'Maintenance of Certification',
  Other: 'Other',
};

export interface CECredit {
  id: string;
  userId: string;
  title: string;
  provider: string;
  category: CECreditCategory;
  credits: number;
  completionDate: string;
  expiryDate?: string;
  certificateUrl?: string;
  accreditationNumber?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface CERequirement {
  id: string;
  role: UserRole;
  category: CECreditCategory;
  requiredCredits: number;
  cyclePeriodMonths: number;
  description?: string;
}

// ── Learning Paths ────────────────────────────────────────

export type LearningPathStepType = 'training' | 'external_ce' | 'assessment' | 'reading';

export interface CEProviderInfo {
  providerName: string;
  providerUrl?: string;
  accreditationId?: string;
  creditCategory: CECreditCategory;
  credits: number;
}

export interface LearningPathStep {
  id: string;
  order: number;
  title: string;
  type: LearningPathStepType;
  description?: string;
  trainingProgramId?: string;
  externalProvider?: CEProviderInfo;
  estimatedMinutes?: number;
  requiredForCompletion: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: 'onboarding' | 'compliance' | 'clinical' | 'safety' | 'leadership' | 'technical';
  steps: LearningPathStep[];
  targetRoles?: UserRole[];
  estimatedHours?: number;
  ceCreditsTotal?: number;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  isPublished: boolean;
}

export const LEARNING_PATH_CATEGORY_LABELS: Record<LearningPath['category'], string> = {
  onboarding: 'Onboarding',
  compliance: 'Compliance',
  clinical: 'Clinical Skills',
  safety: 'Safety',
  leadership: 'Leadership',
  technical: 'Technical',
};

export interface UserLearningPathProgress {
  userId: string;
  learningPathId: string;
  stepsCompleted: string[];
  startedAt: string;
  completedAt?: string;
  earnedCredits: number;
}

// ── Personnel File Management ─────────────────────────────

export type PersonnelDocCategory =
  | 'national_id' | 'passport' | 'medical_clearance' | 'background_check'
  | 'resume_cv' | 'educational_certificate' | 'professional_license'
  | 'employment_contract' | 'job_description' | 'emergency_contact'
  | 'orientation_checklist' | 'confidentiality_agreement' | 'other';

export interface PersonnelDocument {
  id: string;
  category: PersonnelDocCategory;
  name: string;
  status: 'missing' | 'uploaded' | 'verified' | 'expired';
  fileUrl?: string;
  fileName?: string;
  uploadedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  expiryDate?: string;
  notes?: string;
}

export const PERSONNEL_DOC_LABELS: Record<PersonnelDocCategory, string> = {
  national_id: 'National ID / Government ID',
  passport: 'Passport',
  medical_clearance: 'Medical Clearance',
  background_check: 'Background Check',
  resume_cv: 'Resume / CV',
  educational_certificate: 'Educational Certificate',
  professional_license: 'Professional License',
  employment_contract: 'Employment Contract',
  job_description: 'Signed Job Description',
  emergency_contact: 'Emergency Contact Form',
  orientation_checklist: 'Orientation Checklist',
  confidentiality_agreement: 'Confidentiality Agreement',
  other: 'Other',
};

export type UserCompetency = User['competencies'] extends (infer T)[] | undefined ? T : never;

// ── CAP Competency Assessment Types ──

export type CAPAssessmentMethod =
  | 'direct_observation'
  | 'monitoring_recording'
  | 'specimen_testing'
  | 'problem_solving'
  | 'procedure_maintenance'
  | 'training_assessment';

export const CAP_METHOD_LABELS: Record<CAPAssessmentMethod, string> = {
  direct_observation: 'Direct Observation',
  monitoring_recording: 'Monitoring Recording/Reporting',
  specimen_testing: 'Specimen/Sample Testing',
  problem_solving: 'Problem Solving',
  procedure_maintenance: 'Procedures & Instrument Maintenance',
  training_assessment: 'Assessment of Training Materials',
};

export type CAPTestingPhase = 'pre_analytical' | 'analytical' | 'post_analytical';

export const CAP_PHASE_LABELS: Record<CAPTestingPhase, string> = {
  pre_analytical: 'Pre-Analytical',
  analytical: 'Analytical',
  post_analytical: 'Post-Analytical',
};

export type CAPAssessmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue';

export interface CAPAssessment {
  id: string;
  userId: string;
  assessorId: string;
  competencyId: string;
  method: CAPAssessmentMethod;
  testingPhase: CAPTestingPhase;
  labDiscipline?: string;
  scheduledDate: string;
  completedDate?: string;
  score?: number;           // 1-5
  result?: 'competent' | 'needs_improvement' | 'not_competent';
  findings?: string;
  correctiveAction?: string;
  evidenceDocumentIds?: string[];
  status: CAPAssessmentStatus;
  createdAt: string;
}

export const CAP_LAB_DISCIPLINES = [
  'Chemistry', 'Hematology', 'Microbiology', 'Blood Bank',
  'Urinalysis', 'Coagulation', 'Immunology', 'Molecular',
  'Histology', 'Cytology', 'Point of Care',
] as const;

export interface AccreditationProgram {
  id: string;
  name: string;
  description: LocalizedString;
  documentIds?: string[];
  documents?: ProgramDocument[];
  version?: string;
  cycleStartDate?: string;
  cycleEndDate?: string;
  accreditingBody?: string;
  country?: string;
  status?: 'active' | 'retired' | 'pending';
}

export interface AppDocument {
  id: string;
  name: LocalizedString;
  type: 'Policy' | 'Procedure' | 'Report' | 'Evidence' | 'Process Map';
  documentNumber?: string;  // Sequential document number (e.g., POL-001, PRC-042)
  isControlled: boolean;
  status: 'Draft' | 'Under Review' | 'Pending Review' | 'Approved' | 'Rejected' | 'Obsolete';
  content: LocalizedString | null;
  fileUrl?: string;
  currentVersion: number;
  uploadedAt: string;
  versionHistory?: {
    version: number;
    date: string;
    uploadedBy: string;
    content: LocalizedString;
  }[];
  reviewDate?: string;
  approvedBy?: string;
  approvalDate?: string;
  processMapContent?: {
    nodes: any[];
    edges: any[];
  };
  // Document Relationships
  relatedDocumentIds?: string[];  // IDs of related documents
  relationshipType?: 'implements' | 'references' | 'supersedes' | 'related';  // Type of relationship
  parentDocumentId?: string;  // For hierarchical relationships (e.g., Policy → Procedure)
  // Document Metadata
  tags?: string[];  // Tags for categorization and search
  category?: string;  // Document category (e.g., "Quality Management", "Safety", "Operations")
  departmentIds?: string[];  // Associated department IDs
  uploadedBy?: string;  // User who uploaded the document
  projectId?: string;  // Associated project ID for evidence documents
  createdAt?: string;  // Creation timestamp
  version?: number;  // Document version number
  reviewers?: string[];
  approvalChain?: {
    step: number;
    reviewerId: string;
    status: 'pending' | 'approved' | 'rejected';
    date?: string;
    comments?: string;
  }[];
  expiryDate?: string;
  retentionPeriod?: number;
}

export interface TrainingProgram {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  content: LocalizedString;
  passingScore: number;
  quiz: {
    id: string;
    question: LocalizedString;
    options: LocalizedString[];
    correctOptionIndex: number;
  }[];
  duration?: number;
  category?: string;
  prerequisites?: string[];
  frequency?: 'one-time' | 'annual' | 'biannual' | 'quarterly';
  expiryMonths?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CertificateData {
  id: string;
  userId: string;
  userName?: string;
  trainingId: string;
  trainingTitle?: string;
  completionDate: string;
  score: number;
  certificateNumber?: string;
  issuedBy?: string;
}

export interface CustomCalendarEvent {
  id: string;
  type: 'Custom';
  title: LocalizedString;
  description?: LocalizedString;
  date: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  programId: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  projectLead?: Omit<User, 'competencies' | 'trainingAssignments'>;
  progress: number;
  checklist: ChecklistItem[];
  activityLog?: {
    id: string;
    timestamp: string;
    user: string;
    action: LocalizedString;
  }[];
  mockSurveys?: MockSurvey[];
  capaReports?: CAPAReport[];
  designControls?: DesignControlItem[];
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  finalizedBy?: string;
  finalizationDate?: string;
  pdcaCycles?: PDCACycle[];
  teamMembers?: string[];
  departmentId?: string;
  departmentIds?: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text?: string;
  timestamp: string;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  likelihood: number;
  impact: number;
  level?: string;
  ownerId: string | null;
  status: 'Open' | 'Mitigated' | 'Closed';
  mitigationPlan: string;
  rootCauseCategory?: string;
  trainingRecommendationId?: string;
  createdAt: string;
  updatedAt?: string;
  reviewDate?: string;
  category?: string;
  affectedStandardIds?: string[];
  residualLikelihood?: number;
  residualImpact?: number;
  department?: string;
}

export interface IncidentReport {
  id: string;
  incidentDate: string;
  location: string;
  type: 'Patient Safety' | 'Staff Injury' | 'Facility Issue' | 'Medication Error' | 'Near-Miss'
  | 'Specimen Error' | 'Equipment Malfunction' | 'Result Reporting Error' | 'Biosafety Exposure' | 'Proficiency Testing Failure'
  | 'Other';
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Sentinel Event';
  description: string;
  status: 'Open' | 'Under Investigation' | 'Closed';
  reportedBy: string;
  correctiveActionIds: string[];
  updatedAt?: string;
  investigatorId?: string;
  rootCause?: string;
  department?: string;
  linkedRiskIds?: string[];
  // Near-miss specific fields
  contributingFactors?: string;
  potentialConsequences?: string;
  preventiveActionTaken?: string;
}

// ── Escalation Rules ──────────────────────────────────────

export interface EscalationRule {
  id: string;
  name: string;
  triggerSeverity: IncidentReport['severity'];
  triggerTypes: IncidentReport['type'][];  // empty = all types
  notifyRoles: UserRole[];
  notifyDepartmentHead: boolean;
  notifySupervisor: boolean;
  notificationPriority: 'low' | 'normal' | 'high' | 'critical';
  responseTimeHours: number;
  enabled: boolean;
}

export interface EscalationEvent {
  id: string;
  incidentId: string;
  ruleId: string;
  ruleName: string;
  severity: IncidentReport['severity'];
  triggeredAt: string;
  recipientIds: string[];
  recipientNames: string[];
  notificationPriority: 'low' | 'normal' | 'high' | 'critical';
  responseTimeHours: number;
  status: 'sent' | 'acknowledged' | 'expired';
}

export interface AuditPlan {
  id: string;
  name: string;
  projectId: string;
  standardSection: string; // e.g. 'Chapter 1' or specific standard IDs
  frequency: 'weekly' | 'monthly';
  itemCount: number; // number of checklist items to audit
  assignedAuditorId: string;
  scope?: string;
  objectives?: string;
  startDate?: string;
  endDate?: string;
  status?: 'planned' | 'in-progress' | 'completed' | 'cancelled';
}

export interface AuditResult {
  checklistItemId: string;
  isCompliant: boolean;
  auditorNotes: string;
}
export interface Audit {
  id: string;
  planId: string;
  dateConducted: string;
  auditorId: string;
  results: AuditResult[];
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  findings?: AuditFinding[];
  recommendations?: string;
  followUpDate?: string;
  summary?: string;
}

export type FindingSeverity = 'major' | 'minor' | 'observation' | 'opportunity';

export interface AuditFinding {
  id: string;
  auditId: string;
  standardId?: string;
  checklistItemId?: string;
  severity: FindingSeverity;
  title: string;
  description: string;
  evidence?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'open' | 'in-progress' | 'resolved' | 'verified' | 'closed';
  verifiedBy?: string;
  verifiedDate?: string;
  createdAt: string;
  updatedAt?: string;
  linkedCapaId?: string;
}

export type UserTrainingStatus = {
  [trainingId: string]: {
    status: 'Not Started' | 'In Progress' | 'Completed';
    score?: number;
    completionDate?: string;
    certificateId?: string;
  }
};

export type ProjectDetailView = 'overview' | 'checklist' | 'documents' | 'audit_log' | 'mock_surveys' | 'design_controls' | 'pdca_cycles';

export interface AIQualityBriefing {
  strengths: string[];
  concerns: string[];
  recommendations: {
    title: string;
    details: string;
  }[];
}
export interface AIQualityReport {
  strengths: string[];
  concerns: string[];
  recommendations: {
    title: string;
    details: string;
  }[];
}
export interface ChecklistItem {
  id: string;
  item: string;
  requirement?: string;
  standardId: string;
  status: ComplianceStatus;
  assignedTo: string;
  dueDate: string;
  actionPlan: string;
  notes: string;
  evidenceFiles: string[];
  comments: Comment[];
  departmentId?: string;
}

export interface DesignControlItem {
  id: string;
  item?: string;
  requirement?: string;
  policyProcess?: string;
  implementationEvidence?: string;
  auditFindings?: string;
  outcomeKPI?: string;
  standardId: string;
  status: ComplianceStatus;
  assignedTo?: string;
  dueDate?: string;
  actionPlan?: string;
  notes?: string;
  evidenceFiles?: string[];
  comments?: Comment[];
  linkedDocumentIds: string[];
}

export interface MockSurveyResult {
  id: string;
  itemId: string;
  checklistItemId?: string;
  result: 'Pass' | 'Fail' | 'Not Applicable';
  notes?: string;
}

export interface MockSurvey {
  id: string;
  type?: string;
  title?: string;
  description?: string;
  projectId?: string;
  surveyorId?: string;
  date: string;
  results: MockSurveyResult[];
  status: ProjectStatus;
  complianceStatus?: ComplianceStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Tracer Methodology ────────────────────────────────────

export type TracerType = 'patient' | 'system' | 'program';

export const TRACER_TYPE_LABELS: Record<TracerType, string> = {
  patient: 'Patient Tracer',
  system: 'System Tracer',
  program: 'Program-Specific Tracer',
};

export interface TracerStep {
  id: string;
  order: number;
  department: string;
  area: string;
  checkpoints: TracerCheckpoint[];
}

export interface TracerCheckpoint {
  id: string;
  question: string;
  standardRef?: string;
  result?: 'compliant' | 'partial' | 'non_compliant' | 'not_observed';
  findings?: string;
  evidenceNotes?: string;
}

export interface TracerTemplate {
  id: string;
  name: string;
  tracerType: TracerType;
  description: string;
  steps: TracerStep[];
  programRef?: string;
  createdAt: string;
}

export interface TracerSession {
  id: string;
  templateId: string;
  tracerType: TracerType;
  title: string;
  surveyorId: string;
  date: string;
  steps: TracerStep[];
  overallFindings?: string;
  status: 'planned' | 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export type PDCAStageName = 'Plan' | 'Do' | 'Check' | 'Act';
export type PDCAStage = PDCAStageName | 'Completed';

export interface PDCAStageRecord {
  id: string;
  name: PDCAStageName;
  description?: string;
  completedAt?: string;
  notes?: string;
}

export interface PDCACycle {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  category?: 'Process' | 'Quality' | 'Safety' | 'Efficiency' | 'Other';
  priority?: 'High' | 'Medium' | 'Low';
  owner?: string;
  team?: string[];
  currentStage: PDCAStage;
  status?: ProjectStatus;
  actions?: string[];
  targetCompletionDate?: string;
  improvementMetrics?: {
    baseline: any[];
    target: any[];
    actual: any[];
  };
  stageHistory: Array<{
    stage: PDCAStage;
    enteredAt: string;
    completedAt?: string;
    completedBy?: string;
    notes?: string;
    attachments?: string[];
  }>;
  createdAt: string;
  updatedAt?: string;
  linkedCAPAIds?: string[];
  linkedDocumentIds?: string[];
}

export interface CAPAReport {
  id: string;
  type?: 'CAPA';
  title?: string;
  description?: string;
  checklistItemId: string;
  sourceProjectId?: string;
  sourceStandardId?: string;
  assignedTo?: string;
  dueDate?: string;
  rootCause: string;
  rootCauseAnalysis?: string;
  rootCauseCategory?: string;
  correctiveAction: string;
  preventiveAction?: string;
  actionPlan?: string;
  linkedDocumentIds?: string[];
  status: ProjectStatus;
  pdcaStage?: PDCAStage;
  pdcaHistory?: PDCAStageRecord[];
  createdAt: string;
  updatedAt: string;
  targetDate?: string;
  completionDate?: string;
  verifiedBy?: string;
  projectName?: string;
  effectivenessCheck?: {
    required: boolean;
    completed: boolean;
    completionDate?: string;
    results?: string;
    dueDate?: string;
  };
  closureException?: {
    reason: string;
    approvedBy: string;
    approvedAt: string;
  };
  rcaData?: RootCauseAnalysisData;
}

// ── Root Cause Analysis (Fishbone / 5-Why) ────────────────

export interface FishboneCause {
  id: string;
  text: string;
  subCauses?: FishboneCause[];
}

export type FishboneCategory = 'man' | 'machine' | 'method' | 'material' | 'measurement' | 'environment';

export const FISHBONE_CATEGORY_LABELS: Record<FishboneCategory, string> = {
  man: 'People',
  machine: 'Equipment',
  method: 'Process',
  material: 'Materials',
  measurement: 'Measurement',
  environment: 'Environment',
};

export interface FishboneAnalysis {
  id: string;
  problemStatement: string;
  categories: Record<FishboneCategory, FishboneCause[]>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface FiveWhyStep {
  whyNumber: number;
  question: string;
  answer: string;
}

export interface FiveWhyAnalysis {
  id: string;
  triggerCauseId?: string;
  steps: FiveWhyStep[];
  rootCauseConclusion: string;
  createdAt: string;
}

export interface RootCauseAnalysisData {
  fishbone?: FishboneAnalysis;
  fiveWhys?: FiveWhyAnalysis[];
  linkedCapaIds?: string[];
  linkedRiskIds?: string[];
}

export interface ProjectCard {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  complianceStatus?: ComplianceStatus;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// Settings Enhancement Types
// ========================================

export interface SettingsAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'export' | 'import';
  category: string;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SettingsVersion {
  id: string;
  version: number;
  settings: Partial<AppSettings>;
  createdBy: string;
  createdAt: string;
  comment?: string;
  tags?: string[];
}

export interface SettingsPreset {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'theme' | 'security' | 'notifications' | 'full' | 'visual' | 'performance';
  settings: Partial<AppSettings>;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  usageCount: number;
  icon?: string;
}

export interface CustomPermission {
  id: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'manage';
  granted: boolean;
}

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  baseRole: UserRole;
  permissions: CustomPermission[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  userCount: number;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  timestamp: string;
  duration?: number;
  success: boolean;
  errorMessage?: string;
}

export interface BulkUserOperation {
  id: string;
  type: 'import' | 'export' | 'update' | 'delete' | 'activate' | 'deactivate';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalUsers: number;
  processedUsers: number;
  failedUsers: number;
  errors: { userId: string; error: string }[];
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  resultFile?: string;
}

export interface SettingsTooltip {
  id: string;
  settingKey: string;
  title: string;
  description: string;
  learnMoreUrl?: string;
  videoUrl?: string;
  relatedSettings?: string[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  order: number;
  isOptional: boolean;
  videoUrl?: string;
}

export interface SettingsComparison {
  field: string;
  category: string;
  currentValue: any;
  comparedValue: any;
  isDifferent: boolean;
}

// Re-export supplementary types
export type { ImprovementMetric, ImprovementMetrics, PDCAStageHistory } from './pdca';

// Activity Log Item
export interface ActivityLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string | LocalizedString;
  details?: string;
  type?: string;
}

// Keyboard shortcut map type (for useKeyboardShortcuts hook)
export type KeyboardShortcutMap = Record<string, () => void>;

// Document Template
export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  tags?: string[];
  content?: string;
  type?: string;
}

// Performance Evaluation
export type EvaluationPeriod = 'annual' | 'semi-annual' | 'quarterly' | 'probation';
export type EvaluationStatus = 'Draft' | 'In Progress' | 'Pending Review' | 'Completed';

export interface CompetencyRating {
  competencyId: string;
  competencyName: string;
  rating: number; // 1-5
  comments?: string;
}

export interface PerformanceGoal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  status: 'Not Started' | 'In Progress' | 'Achieved' | 'Partially Achieved' | 'Not Achieved';
  weight?: number; // percentage 0-100
  selfAssessment?: number; // 1-5
  managerAssessment?: number; // 1-5
}

export interface PerformanceEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  evaluatorId: string;
  evaluatorName: string;
  department?: string;
  jobTitle?: string;
  period: EvaluationPeriod;
  periodLabel: string; // e.g. "2025 Annual Review"
  startDate: string;
  endDate: string;
  status: EvaluationStatus;
  overallRating?: number; // 1-5
  competencyRatings: CompetencyRating[];
  goals: PerformanceGoal[];
  strengths?: string;
  areasForImprovement?: string;
  developmentPlan?: string;
  employeeComments?: string;
  evaluatorComments?: string;
  employeeSignedAt?: string;
  evaluatorSignedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Quality Rounding ──────────────────────────────────────────────

export type RoundingStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
export type RoundingFrequency = 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly' | 'Quarterly';
export type ObservationResult = 'Compliant' | 'Non-Compliant' | 'Partial' | 'N/A';
export type RoundingFindingSeverity = 'Critical' | 'Major' | 'Minor' | 'Observation';

export interface RoundingTemplateItem {
  id: string;
  category: string;
  question: string;
  description?: string;
  expectedEvidence?: string;
  weight?: number; // 0-100
  order: number;
}

export interface RoundingTemplate {
  id: string;
  name: string;
  description?: string;
  department?: string;
  category: string; // e.g. 'Infection Control', 'Patient Safety', 'Environment'
  items: RoundingTemplateItem[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RoundingObservation {
  itemId: string;
  question: string;
  result: ObservationResult;
  notes?: string;
  evidenceUrl?: string;
  findingSeverity?: RoundingFindingSeverity;
}

export interface RoundingFinding {
  id: string;
  roundId: string;
  observation: RoundingObservation;
  severity: RoundingFindingSeverity;
  description: string;
  assignedTo?: string;
  assignedToName?: string;
  capaId?: string; // link to CAPA system
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  dueDate?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface QualityRound {
  id: string;
  templateId: string;
  templateName: string;
  department: string;
  area?: string; // specific area/unit within department
  scheduledDate: string;
  completedDate?: string;
  status: RoundingStatus;
  frequency: RoundingFrequency;
  rounderId: string;
  rounderName: string;
  observations: RoundingObservation[];
  findings: RoundingFinding[];
  overallScore?: number; // 0-100 percentage
  complianceRate?: number; // percentage of compliant items
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
