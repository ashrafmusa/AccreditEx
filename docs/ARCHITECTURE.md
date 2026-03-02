# AccreditEx — Project Architecture & Codebase Reference

> **Date:** March 3, 2026  
> **Version:** 1.0  
> **Source of truth:** Generated from live codebase audit  
> **Production:** https://accreditex.web.app  
> **AI Backend:** https://accreditex.onrender.com

---

## 1. Executive Summary

AccreditEx is an AI-powered healthcare accreditation management SaaS platform. It serves hospitals, clinics, and clinical laboratories pursuing accreditation across 7+ programs (JCI, CBAHI, DNV, CAP, ISO 15189, NABH, ISO 9001). The platform provides end-to-end project lifecycle management, document control, risk management, training, auditing, analytics, and AI-assisted compliance — all with full bilingual EN/AR RTL support.

**Key Numbers (verified March 3, 2026):**

| Metric | Actual |
|--------|-------:|
| Source files (`src/`) | 626 |
| Page components | 39 |
| Feature components | 295 |
| Component domains | 33 |
| Zustand stores | 13 |
| Services (total) | 107 |
| Custom hooks | 27 |
| Utility modules | 37 |
| Type definitions | 12 |
| i18n locales | 45 |
| Router routes | 34 |
| AI tools | 21+ |

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **UI Framework** | React | 19 |
| **Language** | TypeScript | 5.8 |
| **Styling** | TailwindCSS | v4 (native) |
| **Animation** | Framer Motion | v11 |
| **Rich Text** | TipTap | v3 |
| **Charts** | Recharts | v3 |
| **State** | Zustand | v5 |
| **Routing** | react-router-dom | v7 |
| **Build** | Vite | v6 |
| **Auth/DB/Storage** | Firebase | v12 |
| **Mobile** | Capacitor | v8 (10 plugins) |
| **AI Backend** | Python FastAPI + Groq/Llama 3.3-70b | Custom |
| **Offline** | IndexedDB via `idb` | 3 stores |
| **Unit Testing** | Jest + Testing Library | 30 |
| **E2E Testing** | Playwright | Latest |
| **Hosting** | Firebase Hosting + Render (AI) | — |

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser / Mobile)                  │
│                                                              │
│  ┌─────────┐  ┌────────────┐  ┌──────────┐  ┌───────────┐ │
│  │  Pages   │  │ Components │  │  Stores  │  │   Hooks   │ │
│  │  (39)    │  │   (295)    │  │   (13)   │  │   (27)    │ │
│  └────┬─────┘  └─────┬──────┘  └────┬─────┘  └─────┬─────┘ │
│       │              │              │              │        │
│       └──────────────┴──────────────┴──────────────┘        │
│                          │                                   │
│                  ┌───────▼────────┐                          │
│                  │ Service Layer  │                          │
│                  │    (107)       │                          │
│                  └───┬───────┬───┘                          │
│                      │       │                               │
│           ┌──────────▼┐  ┌──▼──────────────┐               │
│           │  Firebase  │  │ AI Agent (HTTP) │               │
│           │ SDK Client │  │ → Render.com    │               │
│           └──────┬─────┘  └──────┬──────────┘               │
└──────────────────┼───────────────┼───────────────────────────┘
                   │               │
         ┌─────────▼─────────┐    ┌▼──────────────────────┐
         │     Firebase       │    │  FastAPI AI Backend    │
         │  ┌─────────────┐  │    │  ┌─────────────────┐  │
         │  │  Auth        │  │    │  │ Groq/Llama 3.3  │  │
         │  │  Firestore   │  │    │  │ Specialist Agents│  │
         │  │  Storage     │  │    │  │ Task Router      │  │
         │  │  Hosting     │  │    │  │ Context Mgr      │  │
         │  └─────────────┘  │    │  └─────────────────┘  │
         └───────────────────┘    └────────────────────────┘
```

### Data Flow
1. **Pages** render UI and delegate to **Components** for domain features
2. **Components** read reactive state from **Zustand Stores** and call **Hooks** for lifecycle
3. **Stores** trigger **Service Layer** for Firebase CRUD and AI operations
4. **Services** never live in components — strict separation enforced
5. **AI requests** route through `aiAgentService.ts` → FastAPI backend on Render
6. **Native mobile** features use Capacitor bridges with web fallbacks

---

## 4. Source Code Structure

```
src/
├── components/              # 295 files across 33 domain subdirectories
│   ├── accreditation/       # 9 files — standard mapping, evidence, hub
│   ├── ai/                  # 7 files — chatbot, assistant UI
│   ├── analytics/           # 17 files — charts, KPIs, dashboards
│   ├── audits/              # 3 files — tracer worksheets, audit components
│   ├── auth/                # 1 file — login form
│   ├── calendar/            # 6 files — event management
│   ├── changeControl/       # 6 files — change request workflow
│   ├── common/              # 38 files — layout, nav, theme, toast, modals
│   ├── competencies/        # 3 files — skill assessment
│   ├── customization/       # 1 file — white-label theming
│   ├── dashboard/           # 14 files — widgets, feature discovery
│   ├── data-hub/            # 3 files — QC data import
│   ├── departments/         # 4 files — department management
│   ├── documents/           # 19 files — document control, versioning
│   ├── feedback/            # 1 file — user feedback widget
│   ├── his-integration/     # 7 files — HIS connector UI
│   ├── lab-ops/             # 5 files — lab operations tabs
│   ├── messaging/           # 11 files — communication hub
│   ├── monitoring/          # 1 file — system monitoring
│   ├── notifications/       # 3 files — alerts, notification center
│   ├── onboarding/          # 7 files — guided tour, setup wizard
│   ├── projects/            # 20 files — project management views
│   ├── quality-insights/    # 6 files — AI quality analytics
│   ├── reports/             # 1 file — report builder blocks
│   ├── risk/                # 11 files — RCA, risk register, CAPA
│   ├── security/            # 1 file — security dashboard
│   ├── settings/            # 49 files — 19 settings sections
│   ├── suppliers/           # 5 files — supplier quality management
│   ├── training/            # 11 files — LMS, CE credits, competency
│   └── ui/                  # 16 files — shared UI primitives
│
├── pages/                   # 39 page-level components
│   ├── AccreditationHubPage.tsx
│   ├── AIDocumentGeneratorPage.tsx
│   ├── AnalyticsHubPage.tsx / AnalyticsPage.tsx
│   ├── AuditHubPage.tsx
│   ├── CalendarPage.tsx
│   ├── CertificatePage.tsx
│   ├── ChangeControlHubPage.tsx
│   ├── CreateProjectPage.tsx
│   ├── DashboardPage.tsx
│   ├── DataHubPage.tsx
│   ├── DepartmentDetailPage.tsx / DepartmentsPage.tsx
│   ├── DocumentControlHubPage.tsx
│   ├── KnowledgeBasePage.tsx
│   ├── LabOperationsPage.tsx
│   ├── LandingPage.tsx / LoginPage.tsx
│   ├── MessagingPage.tsx
│   ├── MyTasksPage.tsx
│   ├── OnboardingPage.tsx
│   ├── PerformanceEvaluationPage.tsx
│   ├── PitchDeckPage.tsx
│   ├── ProjectDetailPage.tsx / ProjectListPage.tsx / ProjectOverview.tsx
│   ├── QualityInsightsPage.tsx
│   ├── QualityRoundingPage.tsx
│   ├── ReportBuilderPage.tsx / ReportsPage.tsx
│   ├── RiskHubPage.tsx
│   ├── StandardsPage.tsx
│   ├── SupplierHubPage.tsx
│   ├── SurveyReportPage.tsx
│   ├── TrainingDetailPage.tsx / TrainingHubPage.tsx
│   ├── UserProfilePage.tsx / UsersPage.tsx
│   └── WorkflowAutomationPage.tsx
│
├── stores/                  # 13 Zustand stores
│   ├── useAppStore.ts              # Core app state, settings
│   ├── useProjectStore.ts          # Projects, checklists
│   ├── useUserStore.ts             # Auth, user data
│   ├── useCustomizationStore.ts    # Theme, white-label
│   ├── useAIChatStore.ts           # AI chat sessions
│   ├── useHISIntegrationStore.ts   # HIS connector state
│   ├── useLabOpsStore.ts           # Lab operations data
│   ├── useWorkflowStore.ts         # Automation workflows
│   ├── useReportBuilderStore.ts    # Custom reports
│   ├── useChangeControlStore.ts    # Change control
│   ├── useModuleStore.ts           # Module registry / feature flags
│   ├── useSupplierStore.ts         # Supplier management
│   └── useTenantStore.ts           # Multi-tenant org data
│
├── services/                # 107 total (79 root + 18 HIS + 10 LIMS)
│   ├── BackendService.ts           # Central Firebase orchestrator
│   ├── ai.ts → aiAgentService.ts   # AI facade → Render backend
│   ├── hisIntegration/             # 18 files: Epic, Cerner, HL7, FHIR
│   ├── limsIntegration/            # 10 files: Orchard, SoftLab, Sunquest
│   └── [79 domain services]        # Auth, audit, document, risk, etc.
│
├── hooks/                   # 27 custom React hooks
├── types/                   # 12 type files (index.ts barrel + 11 domain types)
├── utils/                   # 37 utilities (27 root + 10 es-toolkit shims)
├── router/                  # AppRouter.tsx + routes.ts (34 routes)
├── firebase/                # firebaseConfig.ts + firebaseHooks.ts
├── data/                    # 65 files (20 data + 45 i18n locales)
│   └── locales/             # 22 EN + 22 AR + index.ts
├── i18n/                    # Legacy (only ar.js) — real system in data/locales/
├── test/                    # setup.ts + test-utils.ts
├── App.tsx                  # Root component
└── index.tsx                # Entry point
```

---

## 5. State Management (13 Zustand Stores)

All stores are located in `src/stores/use{Name}Store.ts`.

| Store | Domain | Key State | Notes |
|-------|--------|-----------|-------|
| `useAppStore` | Core | Settings, navigation, global UI, document numbering | Primary app state |
| `useProjectStore` | Projects | Projects, checklists, PDCA, templates | Project lifecycle |
| `useUserStore` | Auth | Current user, roles, permissions, session | Authentication context |
| `useCustomizationStore` | Theme | Dark mode, brand colors, white-label config | Visual theming |
| `useAIChatStore` | AI | Chat sessions, messages, context | AI chatbot state |
| `useHISIntegrationStore` | HIS | Epic/Cerner connector state, mapping | HIS integration state |
| `useLabOpsStore` | Lab | Equipment, QC, reagents, proficiency testing | Lab operations data |
| `useWorkflowStore` | Automation | Workflows, triggers, execution logs | Workflow automation |
| `useReportBuilderStore` | Reports | Report sections, blocks, data sources | Custom report builder |
| `useChangeControlStore` | Change Control | Change requests, approvals, impact | Change management |
| `useModuleStore` | Modules | Feature flags, plan-based module visibility | Feature gating |
| `useSupplierStore` | Suppliers | Supplier assessments, qualifications | Supplier management |
| `useTenantStore` | Multi-tenant | Organization context, tenant settings | Tenant configuration |

**Usage Pattern:**
```typescript
import { useProjectStore } from '@/stores/useProjectStore';

// In a component
const projects = useProjectStore((state) => state.projects);
const addProject = useProjectStore((state) => state.addProject);
```

---

## 6. Service Layer (107 Services)

### Core Services
| Service | Purpose |
|---------|---------|
| `BackendService.ts` | Central Firebase CRUD orchestrator |
| `ai.ts` / `aiAgentService.ts` | AI request facade → Render backend |
| `securityService.ts` | RBAC, permissions, session management |
| `authTokenOptimizer.ts` | Token refresh optimization |

### Domain Services (selected)
| Service | Domain |
|---------|--------|
| `accreditationProgramService.ts` | Program lifecycle management |
| `auditService.ts` / `auditPlanService.ts` | Internal/external audit management |
| `documentService.ts` / `docxExportService.ts` | Document control, DOCX export |
| `riskService.ts` | Risk register, assessment |
| `trainingProgramService.ts` | LMS, training records |
| `escalationService.ts` | Automated escalation workflows |
| `incidentReportService.ts` | Incident/near-miss reporting |
| `changeControlService.ts` | Change management lifecycle |
| `supplierService.ts` | Supplier quality management |
| `qcDataImportService.ts` | QC data import with Westgard rules |
| `workflowEngine.ts` | Trigger-condition-action engine |
| `reportDataEngine.ts` | Report builder data aggregation |

### Integration Services
| Service | Integration |
|---------|-------------|
| `hisIntegration/` (18 files) | Epic, Cerner, HL7, FHIR connectors |
| `limsIntegration/` (10 files) | Orchard, SoftLab, Sunquest, HL7/REST |
| `nativeCameraService.ts` | Capacitor camera with web fallback |
| `nativePushService.ts` | FCM push notifications |
| `nativeBiometricService.ts` | Fingerprint/Face ID auth |
| `cloudinaryService.ts` | Image/file optimization |

---

## 7. Multi-Tenant Architecture

AccreditEx uses a **Module Registry System** for multi-tenancy:

```
Firestore: organizations/{orgId}
    ├── type:   "hospital" | "clinic" | "laboratory" | "group" | "other"
    ├── plan:   "free" | "starter" | "professional" | "enterprise"
    └── moduleConfig:
            ├── enabledModules: [...]      ← Force-enable
            ├── disabledModules: [...]     ← Force-disable
            └── subModules: { ... }        ← Granular toggles
```

**Resolution order:** Core modules → Plan defaults → Org type filter → Explicit overrides → Dependency resolution

**UI enforcement:** Sidebar hiding + Route guard + `ModuleGate` component wrapper

---

## 8. AI Integration

All AI features route through a single path:

```
Component → ai.ts (facade) → aiAgentService.ts → HTTPS → Render.com FastAPI
```

**21+ AI tools:**
- Action Plan Generation, Root Cause Analysis, Policy Generation
- Writing Improvement, Translation (EN ↔ AR), Executive Briefings
- Document Summarization, Gap Analysis, Risk Assessment
- Report Analysis, Text Generation, Template Recommendations
- Workflow Suggestions, Execution Log Analysis, AI Generate Action

**No AI API keys in the browser** — all credentials managed server-side.

---

## 9. Mobile (Capacitor 8.x)

| Plugin | Feature |
|--------|---------|
| `@capacitor/camera` | Evidence photo capture + gallery |
| `@capacitor/push-notifications` | FCM with 4 channels |
| `capacitor-native-biometric` | Fingerprint/Face ID login |
| `@capacitor/status-bar` | Theme-aware status bar |
| `@capacitor/splash-screen` | Native splash screen |
| `@capacitor/app` | Lifecycle + deep links |
| `@capacitor/keyboard` | Keyboard adjustments |
| `@capacitor/preferences` | Key-value storage |
| `@capacitor/filesystem` | File system access |
| `@capacitor/haptics` | Haptic feedback |

**All native features include web fallbacks** via `capacitorPlatform.ts`.

---

## 10. Testing

| Layer | Framework | Files | Location |
|-------|-----------|------:|----------|
| Unit tests | Jest + Testing Library | 28 | `src/**/__tests__/`, `src/**/**.test.*` |
| E2E tests | Playwright | 1 | `e2e/tests/basic.spec.ts` |
| Test setup | — | 2 | `src/test/setup.ts`, `src/test/test-utils.ts` |

**Commands:**
```bash
npm run test             # Unit tests
npm run test:coverage    # With coverage report
npm run test:e2e         # Playwright E2E
```

---

## 11. Internationalization

**System:** Modular i18n in `src/data/locales/` (the primary i18n system)
- **Language files:** 22 EN modules + 22 AR modules + 1 index.ts
- **Provider location:** `src/components/common/LanguageProvider`
- **Hook:** `useLanguage()` for accessing `t()` translation function
- **Language support:** English (LTR) + Arabic (RTL)
- **Architecture rule:** All user-facing strings must use `t('key')` — no hardcoded text allowed in components

**Legacy location:** `src/i18n/ar.js` (contains only AR fallback, do not use for new code)

---

## 12. Deployment

| Target | Method | URL |
|--------|--------|-----|
| Web (Production) | Firebase Hosting | https://accreditex.web.app |
| AI Backend | Render.com | https://accreditex.onrender.com |
| Android | Capacitor → APK/AAB | — |
| iOS | Capacitor → IPA | — |

**Build commands:**
```bash
npm run build            # Vite production build
firebase deploy          # Deploy to Firebase Hosting
npx cap sync             # Sync web build → native projects
```

---

## 13. Security

- **Auth:** Firebase Authentication (Email/Password)
- **RBAC:** 4 roles (Admin, Project Lead, Team Member, Auditor) + custom roles/permissions
- **Firestore rules:** `firestore.rules` — collection-level access control
- **Storage rules:** `storage.rules` — file access control
- **Audit logging:** `AuditLoggingService.ts` — CRUD tracking with user context
- **Session management:** `deviceSessionService.ts` — multi-device session control
- **API security:** AI backend keys never exposed in browser

---

*This document replaces the previously referenced but never-created `ACCREDITEX_PROJECT_STRUCTURE_AUDIT_REPORT.md`.*
