# AccreditEx Cross-Module Dependency Report

> Auto-generated: 2026-02-26  
> Covers: Stores, Services, Pages, Components, Integrations

---

## 1. Store-to-Store Dependencies

| Store | Imports From Other Stores |
|-------|--------------------------|
| **useAppStore** | `useUserStore` |
| **useProjectStore** | `useUserStore`, `useAppStore` |
| **useUserStore** | _(none)_ |
| **useTenantStore** | _(none)_ |
| **useLabOpsStore** | _(none)_ |
| **useWorkflowStore** | _(none — uses workflowEngine service)_ |
| **useReportBuilderStore** | _(none)_ |
| **useCustomizationStore** | _(none)_ |
| **useHISIntegrationStore** | _(none)_ |
| **useAIChatStore** | _(none)_ |

### Dependency Graph (Stores)
```
useUserStore  ◄──── useAppStore
                     ▲
useUserStore  ◄──── useProjectStore
useAppStore   ◄──── useProjectStore
```

**Key Insights:**
- `useUserStore` is the most depended-upon store (imported by `useAppStore` and `useProjectStore`)
- `useAppStore` is depended on by `useProjectStore`
- 7 out of 10 stores are fully independent (no cross-store imports)
- No circular dependencies among stores

---

## 2. Service-to-Service Dependencies

### Core Services Dependency Map

| Service | Depends On (Services) | Depends On (Stores) |
|---------|----------------------|---------------------|
| **workflowEngine** | `notificationService`, `logger` | `useUserStore` |
| **escalationService** | `notificationService`, `logger` | `useUserStore` |
| **permissionService** | _(none)_ | _(none — uses firebase directly)_ |
| **notificationService** | _(none — uses firebase directly)_ | _(none)_ |
| **activityLogService** | _(none — uses firebase + tenantQuery util)_ | _(none directly)_ |
| **aiAgentService** | _(none)_ | `useUserStore`, `useAppStore` |
| **reportDataEngine** | _(none)_ | `useAppStore`, `useProjectStore`, `useUserStore` |
| **securityService** | `userActivityService`, `settingsAuditService`, `authTokenOptimizer` | `useAppStore` |
| **documentService** | `freeTierMonitor`, `storageService`, `cloudinaryService` | _(none)_ |
| **programDocumentService** | `cloudinaryService`, `storageService`, `freeTierMonitor` | _(none)_ |
| **standardDocumentService** | `cloudinaryService`, `storageService`, `freeTierMonitor` | _(none)_ |
| **BackendService** | `aiService`, `storageService`, `cloudinaryService` | _(none)_ |
| **ai.ts** | `aiAgentService` | _(none)_ |
| **secureUserService** | `logger` | _(none)_ |
| **customizationService** | `logger` | _(none)_ |
| **deviceSessionService** | `freeTierMonitor` | _(none)_ |

### Service → Service Graph
```
notificationService  ◄──── workflowEngine
                     ◄──── escalationService

logger               ◄──── workflowEngine
                     ◄──── escalationService
                     ◄──── secureUserService
                     ◄──── customizationService

cloudinaryService    ◄──── documentService
                     ◄──── programDocumentService
                     ◄──── standardDocumentService
                     ◄──── BackendService

storageService       ◄──── documentService
                     ◄──── programDocumentService
                     ◄──── standardDocumentService
                     ◄──── BackendService

freeTierMonitor      ◄──── documentService
                     ◄──── programDocumentService
                     ◄──── standardDocumentService
                     ◄──── deviceSessionService

aiAgentService       ◄──── ai.ts
```

### Services that Import Stores (Service→Store coupling)

| Service | Stores Imported |
|---------|----------------|
| `workflowEngine` | `useUserStore` |
| `escalationService` | `useUserStore` |
| `aiAgentService` | `useUserStore`, `useAppStore` |
| `reportDataEngine` | `useAppStore`, `useProjectStore`, `useUserStore` |
| `securityService` | `useAppStore` |
| `hisIntegration/HISDataSyncService` | `useHISIntegrationStore` |
| `hisIntegration/AnalyticsService` | `useHISIntegrationStore` |

> **Note:** This is a store→service coupling that may complicate testing. Ideally, stores should own services, not vice versa.

---

## 3. Page-to-Store Dependencies

| Page | useAppStore | useUserStore | useProjectStore | useTenantStore | useLabOpsStore | useWorkflowStore | useReportBuilderStore | useCustomizationStore | useHISIntegrationStore | useAIChatStore |
|------|:-----------:|:------------:|:--------------:|:--------------:|:--------------:|:----------------:|:--------------------:|:--------------------:|:---------------------:|:--------------:|
| AccreditationHubPage | ✅ | ✅ | ✅ | | | | | | | |
| AnalyticsPage | ✅ | ✅ | ✅ | | | | | | | |
| AnalyticsHubPage | ✅ | ✅ | ✅ | | | | | | | |
| AuditHubPage | ✅ | ✅ | ✅ | | | | | | | |
| CalendarPage | ✅ | | | | | | | | | |
| CertificatePage | ✅ | | | | | | | | | |
| CreateProjectPage | ✅ | ✅ | ✅ | | | | | | | |
| DashboardPage | ✅ | ✅ | ✅ | | | | | | | |
| DataHubPage | ✅ | ✅ | ✅ | | | | | | | |
| DepartmentsPage | ✅ | ✅ | ✅ | | | | | | | |
| DocumentControlHubPage | | | ✅ | | | | | | | |
| KnowledgeBasePage | | ✅ | | | | | | | | |
| LabOperationsPage | | | | | (via tabs) | | | | | |
| LandingPage | ✅ | | | | | | | | | |
| LoginPage | ✅ | ✅ | | | | | | | | |
| MessagingPage | | ✅ | | | | | | | | |
| MyTasksPage | | | | | | | | | | |
| OnboardingPage | | | | | | | | | | |
| PerformanceEvaluationPage | ✅ | ✅ | | | | | | | | |
| ProjectDetailPage | ✅ | ✅ | ✅ | | | | | | | |
| ProjectListPage | ✅ | ✅ | ✅ | | | | | | | |
| ProjectOverview | ✅ | ✅ | ✅ | | | | | | | |
| QualityInsightsPage | ✅ | | | | | | | | | |
| QualityRoundingPage | ✅ | ✅ | | | | | | | | |
| ReportBuilderPage | | ✅ | | | | | ✅ | | | |
| ReportsPage | ✅ | ✅ | | | | | | | | |
| RiskHubPage | ✅ | | ✅ | | | | | | | |
| StandardsPage | | | ✅ | | | | | | | |
| SurveyReportPage | ✅ | | ✅ | | | | | | | |
| TrainingDetailPage | ✅ | | | | | | | | | |
| TrainingHubPage | ✅ | ✅ | | | | | | | | |
| UserProfilePage | | | | | | | | | | |
| WorkflowAutomationPage | | ✅ | | | | ✅ | | | | |

### Store Usage Frequency (Pages)
| Store | # Pages Using It |
|-------|-----------------|
| **useAppStore** | 23 |
| **useUserStore** | 18 |
| **useProjectStore** | 14 |
| **useWorkflowStore** | 1 |
| **useReportBuilderStore** | 1 |
| **useLabOpsStore** | 0 (used in child components) |
| **useCustomizationStore** | 0 (used via hooks) |
| **useHISIntegrationStore** | 0 (used in child components) |
| **useAIChatStore** | 0 (used in child components) |
| **useTenantStore** | 0 (used via utility) |

---

## 4. Shared Services (Used by 3+ Modules)

| Service | Consumers | Count |
|---------|-----------|-------|
| **aiAgentService** | ProjectDetailPage, ProjectOverview, CreateProjectPage, ChecklistItemComponent, PDCACycleManager, PDCACycleCard, SurveyComponent, ProjectChecklist, PDCAStageTransitionForm, DesignControlsComponent, DocumentMetadataModal, ProcessMapEditor, DocumentEditorSidebar (indirect via aiWritingService), IncidentTrendingTab, CAPADetailsModal, LearningPathsTab, TrainingHubPage, AuditHubPage, AnalyticsHubPage, ReportBuilderPage, SurveyReportPage, WorkflowAutomationPage, DepartmentDetailPage, AIAssistant, AIChatPanel (via store) | **24+** |
| **cloudinaryService** | documentService, programDocumentService, standardDocumentService, BackendService, DocumentMetadataModal, ProfileSettingsPage, UserCompetencies, DesignControlsComponent, PDCACycleDetailModal, UserProfileHeader, ChecklistEvidence, FeedbackWidget, ImageUpload | **13** |
| **logger** | workflowEngine, escalationService, secureUserService, customizationService, useAppStore, useUserStore, useProjectStore, useWorkflowStore, FeedbackWidget | **9+** |
| **permissionService** | useAppStore, useUserStore, usePermission hook, DocumentControlHubPage | **4** |
| **notificationService** | workflowEngine, escalationService, useToast hook, useNotifications hook, NotificationCenter, NotificationToast | **6** |
| **notificationServiceFirebase** | Layout (common) | **1 (but global)** |
| **errorHandling** | useAppStore, useUserStore, useProjectStore | **3** |
| **freeTierMonitor** | documentService, programDocumentService, standardDocumentService, deviceSessionService, UsageMonitorPage | **5** |
| **storageService** | documentService, programDocumentService, standardDocumentService, BackendService | **4** |
| **firebaseSetupService** | AppSettingsValidator, DocumentEditor, FirebaseConnectionTest, DatabaseStatistics, EnhancedCollectionsManager, CreateDocumentModal, CollectionsManager, BackupRecoveryPanel | **8** |
| **activityLogService** | useAppStore, AuditHubPage, AuditLogComponent | **3** |
| **tqmReadinessService** | QualityInsightsPage, AdminDashboard, CAPADetailsModal | **3** |
| **assessorReportPackService** | QualityInsightsPage, AdminDashboard | **2** |
| **qualityOutcomeIntelligenceService** | QualityInsightsPage, AdminDashboard | **2** |
| **settingsVersionService** | VisualSettingsPage, SettingsVersionHistory | **2** |

---

## 5. Integration Points

### HIS (Hospital Information System) Integration

**Location:** `src/services/hisIntegration/`

| Service | Purpose | Dependencies |
|---------|---------|-------------|
| `HISDataSyncService` | Bidirectional data sync with HIS | `ConnectorFactory`, `useHISIntegrationStore`, `HISErrorHandler` |
| `HISSyncScheduler` | Scheduled sync orchestration | HIS types |
| `ChangeDataCaptureService` | CDC for real-time sync | HIS types |
| `DataMappingService` | Data transformation/mapping | HIS types |
| `AuditLoggingService` | Audit trail for HIS operations | HIS types |
| `WebhookManagerService` | Webhook endpoint management | HIS types |
| `AnalyticsService` | HIS sync performance analytics | `useHISIntegrationStore` |
| `ReportingService` | HIS integration reports | HIS types |

**Connectors (5):**
- `EpicConnector` — Epic EHR integration
- `CernerConnector` — Cerner/Oracle Health
- `GenericFHIRConnector` — Any FHIR R4-compliant system
- `GenericRESTConnector` — Generic REST API
- `HL7Connector` — HL7 v2.x messaging

**UI Components:**
- `HISConfigurationManager` — Config CRUD (uses `useHISIntegrationStore`, `ConnectorFactory`)
- `IntegrationDashboard` — Overview dashboard (uses `useHISIntegrationStore`)
- `SyncStatusWidget` — Real-time sync status (uses `useHISIntegrationStore`)
- `SyncScheduleManager` — Schedule management (uses `useHISIntegrationStore`)

### LIMS (Laboratory Information Management System) Integration

**Location:** `src/services/limsIntegration/`

| Service | Purpose | Dependencies |
|---------|---------|-------------|
| `LIMSDataSyncService` | Data sync from LIMS → AccreditEx | `LIMSConnectorFactory` |
| `LIMSConnectorFactory` | Factory for creating connectors | Connector classes |
| `BaseLIMSConnector` | Abstract base for connectors | LIMS types |

**Connectors (5):**
- `GenericRESTLIMSConnector` — REST API
- `GenericHL7LIMSConnector` — HL7 messaging
- `OrchardConnector` — Orchard LIS
- `SoftLabConnector` — SoftLab LIS
- `SunquestConnector` — Sunquest LIS

**UI Components:**
- `LIMSIntegrationSettingsPage` (settings component)
- `QCDataImportTab` (data-hub component — uses LIMS types)

---

## 6. Component Cross-Module Dependencies

Components that reference stores/services from **other** feature modules (cross-cutting):

### Components Using Multiple Module Stores

| Component (Module) | Cross-Module Store Usage |
|--------------------|------------------------|
| `common/Layout` | `useUserStore`, `useProjectStore`, `useAppStore` + `notificationServiceFirebase` |
| `dashboard/AdminDashboard` | `useProjectStore`, `useUserStore`, `useAppStore` + `assessorReportPackService`, `tqmReadinessService`, `qualityOutcomeIntelligenceService` |
| `projects/ChecklistItemComponent` | `useUserStore`, `useProjectStore`, `useAppStore` + `aiAgentService`, `crossStandardMappingService` |
| `projects/PDCACycleManager` | `useProjectStore`, `useUserStore`, `useAppStore` + `aiAgentService` |
| `risk/RiskRegisterTab` | `useAppStore`, `useUserStore` |
| `risk/IncidentReportingTab` | `useAppStore`, `useUserStore` |
| `risk/CapaReportsTab` | `useProjectStore`, `useUserStore` |
| `risk/CAPADetailsModal` | `useProjectStore`, `useUserStore` + `tqmReadinessService`, `aiAgentService` |
| `training/SkillMatrixTab` | `useAppStore`, `useUserStore` |
| `training/PersonnelFilesTab` | `useUserStore`, `useAppStore` |
| `training/CAPAssessmentTab` | `useUserStore`, `useAppStore` |
| `settings/ProfileSettingsPage` | `useAppStore`, `useUserStore` + `cloudinaryService` |
| `settings/SettingsVersionHistory` | `useUserStore`, `useAppStore` + `settingsVersionService` |
| `settings/SettingsPresetsPanel` | `useUserStore`, `useAppStore` + `settingsPresetsService` |
| `settings/QuickActionsPanel` | `useUserStore`, `useAppStore` |
| `security/SecurityDashboard` | `useAppStore`, `useUserStore` + `securityService` |
| `projects/ProjectChecklist` | `useProjectStore`, `useAppStore` + `aiAgentService` |
| `projects/ChecklistEvidence` | `useAppStore` + `cloudinaryService` |
| `projects/ProjectAnalytics` | `useAppStore` |
| `feedback/FeedbackWidget` | `useUserStore` + `cloudinaryService`, `logger` |
| `messaging/TeamChat` | `useUserStore` + `messagingService` |
| `messaging/MessagingCenter` | `useUserStore` |

---

## 7. Dependency Matrix (Module Level)

Rows depend on columns:

| Module ↓ / Depends on → | Core (App) | Users | Projects | LabOps | Workflow | Reports | Customization | HIS Integration | AI Chat | Tenant | Notification | Permission | AI Agent | Cloudinary | Firebase |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Core (useAppStore)** | — | ✅ | | | | | | | | | | ✅ | | | ✅ |
| **Users (useUserStore)** | | — | | | | | | | | | | ✅ | | | ✅ |
| **Projects (useProjectStore)** | ✅ | ✅ | — | | | | | | | | | | | | ✅ |
| **LabOps** | | | | — | | | | | | | | | | | |
| **Workflow** | | | | | — | | | | | | ✅ | | | | ✅ |
| **Reports** | | | | | | — | | | | | | | | | ✅ |
| **Customization** | | | | | | | — | | | | | | | | |
| **HIS Integration** | | | | | | | | — | | | | | | | |
| **AI Chat** | | | | | | | | | — | | | | ✅ | | |
| **Tenant** | | | | | | | | | | — | | | | | ✅ |
| **Dashboard (component)** | ✅ | ✅ | ✅ | | | | | | | | | | | | |
| **Risk (components)** | ✅ | ✅ | ✅ | | | | | | | | | | ✅ | | |
| **Settings (components)** | ✅ | ✅ | | | | | | | | | | | | ✅ | ✅ |
| **Training (components)** | ✅ | ✅ | | | | | | | | | | | ✅ | | |
| **Documents (components)** | ✅ | | | | | | | | | | | | ✅ | ✅ | |

---

## 8. Circular Dependency Analysis

### Result: **No circular dependencies found** ✅

The dependency graph is a DAG (Directed Acyclic Graph):

```
Level 0 (leaf nodes, no dependencies):
  - useTenantStore
  - useLabOpsStore
  - useCustomizationStore
  - useHISIntegrationStore
  - useReportBuilderStore
  - notificationService
  - permissionService
  - logger
  - cloudinaryService
  - storageService
  - freeTierMonitor

Level 1 (depends on level 0):
  - useUserStore → permissionService
  - workflowEngine → notificationService, logger
  - escalationService → notificationService, logger
  - documentService → cloudinaryService, storageService, freeTierMonitor
  - useWorkflowStore → workflowEngine
  - useAIChatStore → aiAgentService

Level 2 (depends on level 0-1):
  - useAppStore → useUserStore, permissionService, escalationService, workflowEngine, activityLogService
  - aiAgentService → useUserStore, useAppStore
  - securityService → useAppStore

Level 3 (depends on level 0-2):
  - useProjectStore → useUserStore, useAppStore, workflowEngine
  - reportDataEngine → useAppStore, useProjectStore, useUserStore
```

### Potential Concern: Service→Store Coupling

The following services import stores directly, which creates tight coupling:

| Service | Stores Imported | Risk |
|---------|----------------|------|
| `aiAgentService` | `useUserStore`, `useAppStore` | Medium — reads context for API calls |
| `reportDataEngine` | `useAppStore`, `useProjectStore`, `useUserStore` | Medium — data resolver pattern |
| `securityService` | `useAppStore` | Low — reads settings |
| `workflowEngine` | `useUserStore` | Low — resolves user for notifications |
| `escalationService` | `useUserStore` | Low — resolves users for escalation |
| `HISDataSyncService` | `useHISIntegrationStore` | Low — tightly coupled by design |
| `HIS/AnalyticsService` | `useHISIntegrationStore` | Low — tightly coupled by design |

While not circular, having services read from stores means those services can't be tested without mocking Zustand stores. Consider passing data as parameters instead.

---

## 9. Summary

### Architecture Highlights
- **10 Zustand stores** — 7 independent, 3 with inter-store dependencies
- **70+ services** — Most are self-contained with Firebase/Firestore access
- **38 pages** — Most pages use 1-3 stores; `useAppStore` is ubiquitous
- **No circular dependencies** — Clean DAG dependency structure
- **5 HIS Connectors + 5 LIMS Connectors** — Enterprise integration layer

### Core Shared Infrastructure
1. `useAppStore` — Central data store (documents, standards, programs, departments, etc.)
2. `useUserStore` — Auth & user management (most-depended store)
3. `permissionService` — Centralized RBAC gateway
4. `notificationService` — Cross-cutting notification management
5. `aiAgentService` — AI assistant consumed by 24+ UI locations
6. `cloudinaryService` — Media upload consumed by 13 locations
7. `logger` — Logging consumed by 9+ services/stores
8. `errorHandling` — Error management consumed by 3 stores
9. `freeTierMonitor` — Usage tracking consumed by 5 services
10. `activityLogService` — Audit trail consumed by 3+ modules

### Recommended Improvements
1. **Decouple service→store imports**: Pass data as function parameters instead of having services directly import Zustand stores
2. **Extract shared types**: Some service types (e.g., LIMS `QCData`) are used across module boundaries (data-hub components)
3. **useTenantStore accessed via utility**: `tenantQuery.ts` util imports the store — consider making tenant context explicit via parameters

