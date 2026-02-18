export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';
export type Theme = 'light' | 'dark';

export type SettingsSection = 'profile' | 'security' | 'notifications' | 'accessibility' | 'visual' | 'usageTracking' | 'firebaseUsage' | 'users' | 'accreditationHub' | 'competencies' | 'data' | 'firebaseSetup' | 'about' | 'settingsPresets' | 'versionHistory' | 'auditLog' | 'bulkUserImport';

export type NavigationView = 'dashboard' | 'analytics' | 'qualityInsights' | 'calendar' | 'riskHub' | 'risk' | 'auditHub' | 'documentControl' | 'projects' | 'projectDetail' | 'projectOverview' | 'createProject' | 'editProject' | 'standards' | 'myTasks' | 'departments' | 'departmentDetail' | 'settings' | 'userProfile' | 'trainingHub' | 'trainingDetail' | 'certificate' | 'mockSurvey' | 'surveyReport' | 'accreditation' | 'accreditationHub' | 'dataHub' | 'messaging' | 'aiDocumentGenerator' | 'users' | 'competencies' | 'reports';

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
}

export type UserCompetency = User['competencies'] extends (infer T)[] | undefined ? T : never;

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
  type: 'Patient Safety' | 'Staff Injury' | 'Facility Issue' | 'Medication Error' | 'Other';
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
