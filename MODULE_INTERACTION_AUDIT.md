# AccreditEx — Module Interaction Audit & Tailored Delivery Architecture

> **Date:** February 26, 2026  
> **Methodology:** Code Archaeologist (reverse-engineering) + Product Owner (requirements) + Security Auditor (access control) + Frontend Specialist (architecture)  
> **Scope:** Full codebase — 31 modules, 10 Zustand stores, 75 services, 34 Firestore collections, 16 RBAC resources

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Module Inventory & Classification](#2-module-inventory--classification)
3. [Module Interaction Map](#3-module-interaction-map)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [Current Gaps — No Feature Toggle System](#5-current-gaps--no-feature-toggle-system)
6. [Tailored Delivery Architecture](#6-tailored-delivery-architecture)
7. [Institute Profiles & Module Bundles](#7-institute-profiles--module-bundles)
8. [Implementation Plan](#8-implementation-plan)
9. [Security & Data Isolation](#9-security--data-isolation)
10. [Risk Assessment](#10-risk-assessment)

---

## 1. Executive Summary

AccreditEx has **31 identifiable modules** spanning accreditation management, lab operations, training, risk management, and workflow automation. These modules share a **clean dependency graph with zero circular dependencies**, which is a strong foundation for modular delivery.

### Critical Finding

**No feature toggle or module configuration system exists today.** All 31 modules are always-on for every user. The only access gating is:
- **Role-based** (Admin vs non-Admin) — 3 routes are admin-only
- **Multi-tenancy** — `organizationId` filter on Firestore queries (data isolation only, not module visibility)

### Recommendation

Introduce a **Module Registry** system that maps each institute's `Organization.type` + `plan` to an `enabledModules` set. This enables:
- Hospital clients get the full suite
- Labs get Lab Operations + QC but not Quality Rounding
- Clinics get a streamlined core without lab or tracer features
- Pricing tiers gate premium modules (Workflow Automation, AI, Report Builder)

---

## 2. Module Inventory & Classification

### Tier 1: Core (Cannot Disable — Present in Every Institute)

| Module | Route | Why Core |
|--------|-------|----------|
| **Dashboard** | `/dashboard` | Entry point, aggregates all data |
| **Projects** | `/projects/*` | Central accreditation workflow |
| **Accreditation Hub** | `/accreditation` | Programs & standards backbone |
| **Standards** | `/programs/:id/standards` | Referenced by projects, audits, CAPA |
| **Users / Auth** | `/settings/users` | Identity foundation |
| **Settings** | `/settings/*` | System configuration |
| **Notifications** | *(global)* | Cross-cutting event system |

### Tier 2: Domain (Enable Per Institute Type)

| Module | Route | Target Institutes | Dependencies |
|--------|-------|-------------------|--------------|
| **Document Control** | `/documents` | All | Projects (evidence linking) |
| **Risk Management** | `/risk` | All | Escalation → CAPA (in Projects) |
| **Audit Hub** | `/audit` | Hospitals, Large Clinics | Standards, Projects, CAPA |
| **Quality Rounding** | *(within audit)* | Hospitals | Audit Hub (parent), CAPA |
| **Training Hub** | `/training` | All | Competencies, Users, Departments |
| **Competencies** | *(within training)* | All | Training (parent), Users |
| **Performance Eval** | *(within training)* | Hospitals, Large Orgs | Users, Competencies |
| **Departments** | `/departments` | Hospitals, Groups | Users, Competencies |
| **Lab Operations** | `/lab-operations` | Labs, Hospital Labs | Self-contained |
| **HIS Integration** | *(within settings)* | Hospitals with HIS/LIMS | Self-contained |

### Tier 3: Premium / Add-On (Enable Per Plan)

| Module | Route | Plan Required | Dependencies |
|--------|-------|---------------|--------------|
| **Analytics Hub** | `/analytics` | Starter+ | Reads all stores (display-only) |
| **Report Builder** | `/report-builder` | Professional+ | 13 data sources (read-only) |
| **Workflow Automation** | `/workflow-automation` | Professional+ | Orchestrates 10 entity types |
| **AI Assistant / Chat** | *(global floating)* | Professional+ | AI Agent backend on Render |
| **AI Document Generator** | *(within documents)* | Professional+ | Document Control |
| **Knowledge Base** | `/knowledge-base` | Starter+ | Self-contained |
| **Calendar** | `/calendar` | All (free tier) | Aggregates dates |
| **Messaging** | `/messages` | Starter+ | Users |
| **Data Hub** | `/data` | Enterprise | All collections (admin utility) |
| **Customization** | *(within settings)* | Professional+ | Self-contained |
| **Onboarding** | *(first login)* | All (free tier) | Self-contained |

---

## 3. Module Interaction Map

### 3.1 Dependency Graph (DAG — No Circular Dependencies)

```
┌─────────────────────────────────────────────────────────┐
│                    CORE PLATFORM                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Users /  │  │  Tenant  │  │    App Settings      │  │
│  │   Auth    │  │  Store   │  │   (Organization)     │  │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
│       │              │                    │              │
│       └──────────────┼────────────────────┘              │
│                      │                                   │
│              ┌───────▼───────┐                           │
│              │  Permissions  │ (RBAC: 16 Resources)      │
│              │   Service     │                           │
│              └───────┬───────┘                           │
└──────────────────────┼──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────────┐
        ▼              ▼                  ▼
┌──────────────┐ ┌───────────┐  ┌─────────────────┐
│ Accreditation│ │ Projects  │  │   Departments   │
│    Hub       │◄┤           │  │                 │
│  Programs &  │ │ Checklists│  └────────┬────────┘
│  Standards   │ │ CAPA/PDCA │           │
└──────┬───────┘ │ Surveys   │    ┌──────▼───────┐
       │         └─────┬─────┘    │   Training   │
       │               │          │ Competencies │
       │         ┌─────▼─────┐   │ Performance  │
       │         │   Risk    │   │   CE Credits │
       │         │ Incidents │   └──────────────┘
       │         │Escalation │
       │         └─────┬─────┘
       │               │
       │    ┌──────────▼──────────┐
       │    │    Audit Hub        │
       │    │  Quality Rounding   │
       │    │  Tracer Sessions    │
       │    └─────────────────────┘
       │
       │    ┌─────────────────────────────────────────┐
       │    │          SELF-CONTAINED MODULES          │
       │    │                                          │
       │    │  ┌──────────┐  ┌──────────────────────┐ │
       │    │  │   Lab     │  │  Knowledge Base      │ │
       │    │  │Operations │  │                      │ │
       │    │  └──────────┘  └──────────────────────┘ │
       │    │                                          │
       │    │  ┌──────────┐  ┌──────────────────────┐ │
       │    │  │ Messaging │  │  Calendar            │ │
       │    │  └──────────┘  └──────────────────────┘ │
       │    │                                          │
       │    │  ┌──────────┐  ┌──────────────────────┐ │
       │    │  │   HIS    │  │  Customization       │ │
       │    │  │Integration│  │                      │ │
       │    │  └──────────┘  └──────────────────────┘ │
       │    └─────────────────────────────────────────┘
       │
       │    ┌─────────────────────────────────────────┐
       │    │        CROSS-CUTTING LAYERS             │
       │    │                                          │
       │    │  ┌──────────┐  ┌──────────────────────┐ │
       │    │  │ Workflow  │  │  Notifications       │ │
       │    │  │Automation │  │  (all modules emit)  │ │
       │    │  │(10 types) │  │                      │ │
       │    │  └──────────┘  └──────────────────────┘ │
       │    │                                          │
       │    │  ┌──────────┐  ┌──────────────────────┐ │
       │    │  │ Analytics │  │  Report Builder      │ │
       │    │  │  Hub      │  │  (13 data sources)   │ │
       │    │  └──────────┘  └──────────────────────┘ │
       │    │                                          │
       │    │  ┌──────────┐  ┌──────────────────────┐ │
       │    │  │    AI     │  │  Data Hub            │ │
       │    │  │ Assistant │  │  (import/export)     │ │
       │    │  └──────────┘  └──────────────────────┘ │
       │    └─────────────────────────────────────────┘
```

### 3.2 Store Dependency Chain

```
useUserStore ──► useAppStore ──► useProjectStore
                     │
                     ▼
              (standalone stores — no cross-deps)
              useLabOpsStore
              useWorkflowStore
              useReportBuilderStore
              useHISIntegrationStore
              useCustomizationStore
              useAIChatStore
              useTenantStore
```

**Assessment:** 7 of 10 stores are fully independent — excellent for modular packaging.

### 3.3 Service Cross-References (Most Shared)

| Service | Used By (count) | Modules |
|---------|----------------|---------|
| `notificationService` | 6 | Risk, Escalation, Workflow, CAPA, Audit, Training |
| `permissionService` | 4 | AppStore, Projects, Documents, Departments |
| `activityLogService` | 5+ | Projects, Documents, Settings, Users, Audit |
| `workflowEngine` | system-wide | Orchestrates 10 entity types across all modules |
| `escalationService` | 2 | Risk/Incidents → CAPA |
| `logger` | 9+ | All services |

---

## 4. Data Flow Architecture

### 4.1 Module → Firestore Collection Map

```
┌─────────────────┐     ┌─────────────────────────────┐
│   Module Layer   │     │    Firestore Collections     │
├─────────────────┤     ├─────────────────────────────┤
│ Projects        │────►│ projects                     │
│ Documents       │────►│ documents                    │
│ Accreditation   │────►│ accreditationPrograms,       │
│                 │     │ standards, programs           │
│ Risk            │────►│ risks, incidentReports       │
│ Audit           │────►│ audits, auditPlans,          │
│                 │     │ quality_rounds,               │
│                 │     │ rounding_templates/findings   │
│ Training        │────►│ trainingPrograms,            │
│                 │     │ certificates,                 │
│                 │     │ userTrainingStatuses,         │
│                 │     │ competencies                  │
│ Users           │────►│ users, bulk_user_operations,  │
│                 │     │ user_activity_logs            │
│ Departments     │────►│ departments                   │
│ Calendar        │────►│ customEvents                  │
│ Notifications   │────►│ notifications                 │
│ Settings        │────►│ appSettings, settings_*,     │
│                 │     │ custom_roles,                 │
│                 │     │ userCustomizations            │
│ Lab Operations  │────►│ (in-memory / no Firestore)   │
│ Workflow        │────►│ workflowDefinitions,         │
│                 │     │ workflowExecutionLogs         │
│ Report Builder  │────►│ reportDefinitions             │
│ Performance     │────►│ performance_evaluations       │
│ Activity        │────►│ activity_logs                 │
│ Security        │────►│ users/{uid}/sessions          │
└─────────────────┘     └─────────────────────────────┘
```

### 4.2 Multi-Tenancy Data Flow

```
User Login
    │
    ▼
useTenantStore.loadOrganizationForUser(user.organizationId)
    │
    ▼
organizationId set in store
    │
    ▼
getTenantQuery('collection', ...constraints)
    │
    ├── organizationId ≠ '' → where('organizationId', '==', orgId) prepended
    └── organizationId === ''  → unfiltered (legacy single-tenant mode)
```

**Key Gap:** Multi-tenancy filters data but does NOT control module visibility. A lab and a hospital on the same plan see identical modules.

---

## 5. Current Gaps — No Feature Toggle System

### What Exists Today

| Mechanism | What It Controls | Scope |
|-----------|-----------------|-------|
| `UserRole` (Admin/ProjectLead/Auditor/TeamMember/Viewer) | Route access (3 admin-only routes) | Per-user |
| `Organization.plan` (free/starter/professional/enterprise) | **Nothing yet** — field exists but unused | Per-org |
| `Organization.type` (hospital/clinic/laboratory/group/other) | **Nothing yet** — field exists but unused | Per-org |
| `UserCustomization.advanced.betaFeatures` | **Nothing yet** — field exists but unused | Per-user |
| `UserCustomization.advanced.experimentalFeatures` | **Nothing yet** — boolean exists but unused | Per-user |

### What's Missing

1. **Module-level visibility control** — All sidebar items always show
2. **Plan-based gating** — No paywall or upgrade prompts for premium modules
3. **Institute-type adaptation** — A lab sees hospital-specific modules (Quality Rounding, Tracer) it doesn't need
4. **Feature flags for gradual rollout** — No way to beta-test a module with select clients
5. **Firestore security rules** — Don't enforce plan-based collection access
6. **API-level module guards** — Backend doesn't validate module access

---

## 6. Tailored Delivery Architecture

### 6.1 Proposed: Module Registry System

#### New Type: `ModuleId`

```typescript
// src/types/modules.ts

export type ModuleId =
  // Core (always enabled)
  | 'dashboard'
  | 'projects'
  | 'accreditation'
  | 'standards'
  | 'users'
  | 'settings'
  | 'notifications'
  // Domain modules
  | 'documentControl'
  | 'riskManagement'
  | 'auditHub'
  | 'qualityRounding'
  | 'trainingHub'
  | 'competencies'
  | 'performanceEval'
  | 'departments'
  | 'labOperations'
  | 'hisIntegration'
  // Premium modules
  | 'analyticsHub'
  | 'reportBuilder'
  | 'workflowAutomation'
  | 'aiAssistant'
  | 'aiDocumentGenerator'
  | 'knowledgeBase'
  | 'calendar'
  | 'messaging'
  | 'dataHub'
  | 'customization';

export interface ModuleDefinition {
  id: ModuleId;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  icon: string; // icon component name
  route?: string;
  navigationView?: NavigationView;
  tier: 'core' | 'domain' | 'premium';
  requiredPlan: Organization['plan'];  // minimum plan
  applicableTypes: Organization['type'][];  // which institute types
  dependencies: ModuleId[];  // must also be enabled
  category: 'management' | 'compliance' | 'operations' | 'analytics' | 'communication' | 'system';
}
```

#### Extended Organization Type

```typescript
// Add to Organization interface
export interface Organization {
  // ... existing fields ...
  
  /** Explicitly enabled modules (overrides plan defaults) */
  enabledModules?: ModuleId[];
  
  /** Explicitly disabled modules (overrides plan defaults) */
  disabledModules?: ModuleId[];
  
  /** Custom feature flags for gradual rollout */
  featureFlags?: Record<string, boolean>;
  
  /** Institute-specific configuration */
  moduleConfig?: {
    labOperations?: {
      enableQC: boolean;
      enableProficiencyTesting: boolean;
      enableReagentTracking: boolean;
    };
    audit?: {
      enableQualityRounding: boolean;
      enableTracerMethodology: boolean;
    };
    training?: {
      enableCECredits: boolean;
      enableCompetencyAssessment: boolean;
      enablePerformanceEval: boolean;
    };
  };
}
```

### 6.2 Module Resolution Algorithm

```typescript
// src/services/moduleService.ts

function getEnabledModules(org: Organization): Set<ModuleId> {
  // 1. Start with core modules (always on)
  const enabled = new Set<ModuleId>(CORE_MODULES);
  
  // 2. Add plan-default modules
  const planDefaults = PLAN_MODULE_MAP[org.plan || 'free'];
  planDefaults.forEach(m => enabled.add(m));
  
  // 3. Add type-default modules
  const typeDefaults = TYPE_MODULE_MAP[org.type];
  typeDefaults.forEach(m => {
    if (enabled.has(m) || planDefaults.includes(m)) enabled.add(m);
  });
  
  // 4. Apply explicit overrides
  org.enabledModules?.forEach(m => enabled.add(m));
  org.disabledModules?.forEach(m => {
    if (!CORE_MODULES.includes(m)) enabled.delete(m);
  });
  
  // 5. Resolve dependencies (add required parents)
  for (const moduleId of enabled) {
    const def = MODULE_REGISTRY[moduleId];
    def.dependencies.forEach(dep => enabled.add(dep));
  }
  
  return enabled;
}
```

### 6.3 Integration Points (3 Touch Points)

#### Touch Point 1: Navigation Sidebar (Visibility)

```
NavigationRail.tsx / MobileSidebar.tsx
    │
    ▼
Filter allNavItems by:
  1. Role check (existing: adminOnly)
  2. NEW: moduleService.isModuleEnabled(item.key)
```

#### Touch Point 2: Route Guard (Access Control)

```
MainRouter.tsx → renderMainContent()
    │
    ▼
Before rendering any view:
  if (!moduleService.isModuleEnabled(navigation.view)) {
    return <UpgradePrompt module={navigation.view} />;
  }
```

#### Touch Point 3: Dashboard Widgets (Adaptive)

```
DashboardPage.tsx
    │
    ▼
Only render widget cards for enabled modules
  e.g., hide "Lab Operations Summary" if labOperations not enabled
```

---

## 7. Institute Profiles & Module Bundles

### 7.1 Plan-Based Module Matrix

| Module | Free | Starter | Professional | Enterprise |
|--------|:----:|:-------:|:------------:|:----------:|
| Dashboard | **✓** | **✓** | **✓** | **✓** |
| Projects | **✓** | **✓** | **✓** | **✓** |
| Accreditation Hub | **✓** | **✓** | **✓** | **✓** |
| Standards | **✓** | **✓** | **✓** | **✓** |
| Users (≤5) | **✓** | **✓** (≤25) | **✓** (≤100) | **✓** (∞) |
| Settings | **✓** | **✓** | **✓** | **✓** |
| Calendar | **✓** | **✓** | **✓** | **✓** |
| Document Control | — | **✓** | **✓** | **✓** |
| Risk Management | — | **✓** | **✓** | **✓** |
| Training Hub | — | **✓** | **✓** | **✓** |
| Departments | — | **✓** | **✓** | **✓** |
| Messaging | — | **✓** | **✓** | **✓** |
| Knowledge Base | — | **✓** | **✓** | **✓** |
| Analytics Hub | — | — | **✓** | **✓** |
| Audit Hub | — | — | **✓** | **✓** |
| Report Builder | — | — | **✓** | **✓** |
| Workflow Automation | — | — | **✓** | **✓** |
| Lab Operations | — | — | **✓** | **✓** |
| AI Assistant | — | — | **✓** | **✓** |
| Customization | — | — | **✓** | **✓** |
| HIS Integration | — | — | — | **✓** |
| Data Hub | — | — | — | **✓** |
| Performance Eval | — | — | — | **✓** |
| Quality Rounding | — | — | — | **✓** |

### 7.2 Institute-Type Module Profiles

#### Hospital (Full Suite)

```
Core + All Domain + All Premium (per plan)
Special: Quality Rounding ✓, Tracer Methodology ✓, 
         HIS Integration ✓, Performance Eval ✓
         All 5 Lab Ops tabs ✓
```

**User Story:** *As a hospital quality director, I want all compliance modules active because we undergo JCI/CBAHI surveys annually.*

#### Laboratory (Lab-Focused)

```
Core + Lab Operations (all 5 tabs) + Document Control +
Risk Management + Training + Competencies + Analytics
Removed: Quality Rounding, Tracer, Performance Eval
Added: QC Dashboard emphasis, Proficiency Testing emphasis
```

**User Story:** *As a lab manager, I need equipment calibration tracking and proficiency testing but don't need ward-based quality rounding.*

#### Clinic (Streamlined)

```
Core + Document Control + Risk Management + Training +
Calendar + Messaging + Knowledge Base
Removed: Lab Operations, Quality Rounding, Tracer,
         HIS Integration, Performance Eval, Data Hub
```

**User Story:** *As a clinic administrator, I need a simple accreditation tracker without complex lab or audit features.*

#### Group / Network (Multi-Site)

```
Core + All Domain + Analytics Hub + Report Builder +
Data Hub + Workflow Automation
Special: Cross-site reporting, bulk user management,
         organization hierarchy
```

**User Story:** *As a healthcare group CEO, I need to see aggregated accreditation readiness across all my facilities.*

---

## 8. Implementation Plan

### Phase 1: Foundation (Week 1-2) — MUST

| Task | Files to Create/Modify | Effort |
|------|----------------------|--------|
| Create `ModuleId` type & `ModuleDefinition` interface | `src/types/modules.ts` (NEW) | 2h |
| Create Module Registry with all 26 module definitions | `src/data/moduleRegistry.ts` (NEW) | 4h |
| Create `moduleService.ts` (resolution algorithm) | `src/services/moduleService.ts` (NEW) | 4h |
| Create `useModuleStore.ts` (Zustand store) | `src/stores/useModuleStore.ts` (NEW) | 3h |
| Extend `Organization` type with `enabledModules`, `disabledModules`, `moduleConfig` | `src/types/index.ts` | 1h |
| Extend `useTenantStore` to load module config on org load | `src/stores/useTenantStore.ts` | 2h |

### Phase 2: UI Integration (Week 2-3) — MUST

| Task | Files to Modify | Effort |
|------|----------------|--------|
| Filter `NavigationRail` items by enabled modules | `src/components/common/NavigationRail.tsx` | 2h |
| Filter `MobileSidebar` items by enabled modules | `src/components/common/MobileSidebar.tsx` | 2h |
| Add route guard in `MainRouter` for disabled modules | `src/components/common/MainRouter.tsx` | 3h |
| Create `<UpgradePrompt>` component for gated modules | `src/components/common/UpgradePrompt.tsx` (NEW) | 4h |
| Create `<ModuleGate>` wrapper component | `src/components/common/ModuleGate.tsx` (NEW) | 2h |
| Adapt Dashboard widgets to only show enabled module data | `src/pages/DashboardPage.tsx` | 3h |

### Phase 3: Admin Configuration (Week 3-4) — SHOULD

| Task | Files to Create/Modify | Effort |
|------|----------------------|--------|
| Create organization module config settings page | `src/components/settings/ModuleConfigPanel.tsx` (NEW) | 6h |
| Create plan upgrade flow UI | `src/components/billing/PlanUpgrade.tsx` (NEW) | 4h |
| Add module config to organization Firestore document | Firestore rules + migration | 3h |
| Add `enabledModules` to admin organization editor | `src/components/settings/` | 3h |
| Add module analytics (track adoption per module) | `src/services/analyticsTrackingService.ts` | 2h |

### Phase 4: Security & Rules (Week 4-5) — SHOULD

| Task | Files | Effort |
|------|-------|--------|
| Update Firestore security rules to enforce module access | `firestore.rules` | 4h |
| Add module check to `permissionService.guard()` | `src/services/permissionService.ts` | 2h |
| Add module validation to backend API (Python) | `ai-agent/deployment_package/main.py` | 3h |
| Add Firestore indexes for module-filtered queries | `firestore.indexes.json` | 1h |

### Phase 5: Feature Flags (Week 5-6) — COULD

| Task | Files | Effort |
|------|-------|--------|
| Create feature flag service (org-level + user-level) | `src/services/featureFlagService.ts` (NEW) | 4h |
| Integrate with `Organization.featureFlags` | `src/types/index.ts`, `useTenantStore.ts` | 2h |
| Create admin feature flag panel | `src/components/settings/FeatureFlagsPanel.tsx` (NEW) | 4h |
| Add `useFeatureFlag(flag)` hook for components | `src/hooks/useFeatureFlag.ts` (NEW) | 1h |
| Integrate `betaFeatures` from `UserCustomization` | `src/stores/useCustomizationStore.ts` | 2h |

---

## 9. Security & Data Isolation

### Current Security Model

```
Firestore Rules (firestore.rules)
    │
    ├── Auth: request.auth != null (all collections)
    ├── Tenant: organizationId filter (via getTenantQuery)
    └── Role: Admin-only routes (3 views in MainRouter)
```

### Required Security Additions for Module Gating

| Layer | Current | Required |
|-------|---------|----------|
| **Client-Side** | Role check on 3 routes | Module check on ALL routes |
| **Firestore Rules** | Auth-only | Auth + org.enabledModules check |
| **Backend API** | No module check | Validate module access per endpoint |
| **Data Queries** | Tenant filter only | Tenant + module access validation |

### Recommended Firestore Rule Pattern

```javascript
// firestore.rules
function isModuleEnabled(moduleId) {
  let org = get(/databases/$(database)/documents/organizations/$(request.auth.token.orgId));
  return moduleId in org.data.enabledModules;
}

match /workflowDefinitions/{docId} {
  allow read, write: if isAuthenticated() 
    && isModuleEnabled('workflowAutomation')
    && isTenantMatch(resource);
}
```

---

## 10. Risk Assessment

### Implementation Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing users when adding module gates | HIGH | MEDIUM | Default all modules to enabled for existing orgs |
| Performance overhead of module checks on every render | LOW | LOW | Memoize in Zustand store, check once on org load |
| Data orphaning when module disabled after use | MEDIUM | MEDIUM | Soft-disable: hide UI but keep data; show "re-enable to access" |
| Dashboard crash if widget references disabled module data | HIGH | HIGH | Wrap each widget in `<ModuleGate>` with graceful fallback |
| Firestore rules complexity explosion | MEDIUM | MEDIUM | Use helper functions; test exhaustively |
| Module dependency resolution loops | LOW | LOW | Static registry; validate at build time |

### Migration Strategy for Existing Deployments

1. **Default to all-enabled**: Existing organizations without `enabledModules` get everything (backward compat)
2. **Gradual opt-out**: Admins can disable modules they don't need via Settings
3. **Plan enforcement deferred**: Don't enforce plan limits until billing system is ready
4. **Data preservation**: Disabling a module never deletes data — only hides UI access

---

## Appendix A: Complete Cross-Module Dependency Matrix

| Module | Uses Stores | Uses Services | Depends On Modules |
|--------|-------------|---------------|-------------------|
| Dashboard | AppStore, ProjectStore, UserStore | analytics | Projects, Risk, Training, Documents, Audit |
| Projects | ProjectStore, AppStore, UserStore | projectService, permissionService, workflowEngine | Standards, Documents, Risk (CAPA) |
| Accreditation | AppStore | accreditationProgramService, standardService | — |
| Standards | AppStore | standardService | Accreditation |
| Documents | AppStore | documentService, cloudinaryService, storageService | — |
| Risk | AppStore | riskService, incidentReportService, escalationService | Notifications |
| Audit | AppStore | auditService, auditPlanService, qualityRoundingService | Standards, Projects |
| Training | AppStore | trainingProgramService, competencyService, certificateService | Users, Departments |
| Lab Ops | LabOpsStore | — (in-memory) | — |
| Workflow | WorkflowStore | workflowEngine, notificationService | All 10 entity types |
| Report Builder | ReportBuilderStore | reportDataEngine | 13 data sources |
| Analytics | AppStore | — (computed) | Projects, Risk, Audit, Training |
| Messaging | — (local) | messagingService | Users |
| Calendar | AppStore | customCalendarEventService | Training, Audit (date aggregation) |
| Knowledge Base | — | — | — |
| HIS Integration | HISIntegrationStore | hisIntegration/* | — |
| AI | AIChatStore | aiAgentService, aiWritingService | Users, Documents |
| Customization | CustomizationStore | customizationService | — |
| Settings | AppStore, CustomizationStore | appSettingsService, securityService, customRolesService | Users |
| Data Hub | AppStore | firestoreDataService | All collections |

## Appendix B: File Counts Per Module

| Module | Pages | Components | Services | Store | Types | Locale Files |
|--------|-------|------------|----------|-------|-------|-------------|
| Dashboard | 1 | 6+ | — | shared | shared | dashboard.ts |
| Projects | 4 | 10+ | 1 | 1 | shared | projects.ts |
| Accreditation | 1 | 5+ | 2 | shared | shared | accreditation.ts |
| Documents | 2 | 8+ | 4 | shared | shared | documents.ts |
| Risk | 1 | 5+ | 3 | shared | shared | risk.ts |
| Audit | 1 | 8+ | 3 | shared | shared | audit.ts |
| Training | 2 | 10+ | 3 | shared | shared | training.ts |
| Lab Ops | 1 | 5 | — | 1 | 1 | labOperations.ts |
| Workflow | 1 | — (inline) | 1 | 1 | 1 | workflowAutomation.ts |
| Report Builder | 2 | 5+ | 1 | 1 | 1 | — |
| Analytics | 2 | 5+ | — | shared | shared | analytics.ts |
| Settings | — | 15+ | 6 | shared | shared | settings.ts |
| Users | 2 | 5+ | 4 | 1 | shared | users.ts |
| Knowledge Base | 1 | — (inline) | — | — | shared | knowledgeBase.ts |
| Calendar | 1 | 3+ | 1 | shared | shared | calendar.ts |
| Messaging | 1 | 3+ | 1 | — | shared | — |

---

*This audit was generated by analyzing the live AccreditEx codebase — 31 modules, 10 stores, 75 services, 34 Firestore collections. All findings are code-verified, not speculative.*
