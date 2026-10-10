# AccreditEx — Healthcare Accreditation Management Platform

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-37%2B-blue)
![License](https://img.shields.io/badge/license-MIT-blue)
![Pages](https://img.shields.io/badge/pages-46-blue)
![AI Workflows](https://img.shields.io/badge/AI%20Workflows-8-blue)
![Deploy](https://img.shields.io/badge/live-accreditex.web.app-green)

AccreditEx is a modern, AI-powered healthcare accreditation management platform designed to support hospitals and clinical laboratories throughout their accreditation journey. Built with a **live Firebase + Firestore backend** and deployed at **https://accreditex.web.app**, it streamlines the management of accreditation programs (JCI, CBAHI, DNV, CAP, ISO 15189, NABH, ISO 9001), ensures traceability of all actions, and maintains compliance across the entire organization — in **English and Arabic** with full RTL support.

## Table of Contents

- [Getting Started](#getting-started)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architectural Approach](#architectural-approach)
- [Project Structure](#project-structure)
- [Backend & Data Persistence](#backend--data-persistence)
- [AI Integration](#ai-integration)
- [Lab Operations Module](#lab-operations-module)
- [Contributing](#contributing)

## Key Features

### Core Platform (46 Pages)
-   **Role-Based Dashboards**: Admin, Project Lead, Team Member, and Auditor views with real-time compliance KPIs.
    - **Action-first journey**: Every role and organization dashboard starts with up to three permission-aware next actions and a requirements → projects → evidence → audit navigation path. Counts use loaded, explicitly organization-owned records; they are not a certification or verified progress indicator. Overdue personal tasks, pending document reviews, unfinished CAPA, and audit plans open the relevant existing workspace. Empty organizations offer project creation only to authorized users.
    - **Grouped sidebar**: Dashboard, My Tasks, and Projects stay prominent. Other workspaces are grouped under Accreditation, Quality & Safety, Operations, and Administration on desktop and mobile, preserving role/module visibility. Groups can be expanded independently and the current workspace's group opens automatically. Desktop labels are visible by default; the explicit collapse/expand preference persists locally. Settings stays at the bottom; mobile navigation scrolls within the drawer and closes after selecting a destination.
-   **Project Management**: Full accreditation project lifecycle with pre-built templates for 7+ accreditation programs (JCI, CBAHI, DNV, CAP, ISO 15189, NABH, ISO 9001).
    - **Connected workspaces**: Requirements, projects, personal tasks, evidence, audits, improvement, and reporting offer localized context and permission/module-aware navigation. These links describe the workflow, not certification progress.
    - **Actionable personal tasks**: Search by task, standard, project, or program; filter overdue work and work due today through the next seven days; open the relevant project, then choose Checklist to update requirements and evidence. Task groups use stable IDs, and counts exclude archived/foreign/unknown-ownership projects and non-applicable items. Date-only deadlines use the local calendar.
    - **Release freshness**: Firebase Hosting revalidates rewritten app routes as well as HTML, so ordinary reloads can receive upgrades. Static JavaScript, CSS, and images retain their asset cache policy.
-   **Document Control Hub**: Version-controlled document management with AI-powered document generation, automatic document numbering, and approval workflows. The AI generator includes an English/Arabic document-language selector (initially matching the interface language); generated content and SOP headers follow this selection, improvements preserve the generated language, and saved documents use the corresponding localized content field.
    - AI generation produces a preview, not an automatically saved document. Use **Save reviewed draft** after reviewing facts and references; failed saves keep the preview available for retry.
    - HTML, Markdown, and text output retain their respective download formats. Content is converted to sanitized HTML when saved to the rich-text document editor.
    - Analysis is explicitly requested with **Analyze Document**. Missing metrics show **Not assessed**, invalid responses fail visibly, and findings must include exact quotes from the supplied document. Quality estimates are not verified accreditation scores; no default scores are fabricated.
-   **Risk Management Hub**: ISO 31000-compliant risk register with risk matrices, CAPA integration, and root cause analysis (Fishbone + Five-Why).
-   **Audit Management Hub**: Internal/external audit planning, tracer worksheets, findings management, and corrective action tracking.
    - Activity-log reads require the `activity_logs` organization/timestamp composite indexes declared in `firestore.indexes.json`. Reads require server confirmation rather than silently falling back to stale offline rows. Read failures display an error and retry action instead of claiming the log is empty.
    - SMCS seeding resolves a single active program from complete standard coverage, never the dataset's legacy `prog-ohap` identifier, and checks for existing legacy or repaired projects before writing.

-   **Training & Competency**: Full LMS with quiz-based training, certificate generation, CE credit tracking, skill matrices, learning paths, and competency gap analysis.
-   **Analytics Hub**: Multi-format reporting (PDF, Excel, CSV, JSON), AI-powered quality insights, PDCA cycle tracking, and executive briefings.

#### SMCS data reconciliation

On 2026-10-10, the 14 legacy SMCS projects in `org-accreditex` were reconciled to the existing OHAS program after complete standard-coverage validation. A full pre-update backup was retained outside the repository, and post-update comparison verified that only `programId` changed. The Audit Log's organization/timestamp index was created separately and verified READY; the server-backed query and live UI both returned 80 activity rows. Additional user/type-filter indexes are declared for those optional query combinations but were not deployed as part of this targeted repair.

`scripts/migrations/reconcile-smcs-program.cjs` defaults to a read-only plan. It verifies destination ownership/sharing and complete SMCS standard coverage, and only targets legacy SMCS projects belonging to the explicitly selected organization.

```powershell
node scripts\migrations\reconcile-smcs-program.cjs --project=accreditex-79c08 --organization=org-accreditex --program=T0ayZzzR9OBq15wU5smS
```

Future live application requires separate approval, existing authorized credentials, and explicit `--apply --confirm-project=accreditex-79c08 --expected-count=<reviewed-candidate-count> --backup=<absolute-path-outside-repository>` arguments. The script writes a full backup before an atomic, concurrency-guarded update of **only `programId`**, then verifies every project. Never commit the backup. Database indexes must also be applied separately and reach READY before claiming Audit Log is repaired; frontend Hosting deployment does not deploy indexes.

### Hospital-Specific Features
-   **Accreditation Hub**: Cross-standard evidence mapping, pre-loaded 240+ standards / 1,043 sub-standards.
-   **Personnel Files Management**: Centralized employee file tracking with credential verification and expiry alerts.
-   **Licensure Tracking**: Professional license monitoring with renewal reminders and status dashboards.
-   **Escalation Service**: Automated escalation workflows with configurable rules and notification chains.
-   **QAPI Templates**: Pre-built Quality Assessment & Performance Improvement project templates.
-   **Incident Reporting**: 5 lab-specific incident types with structured reporting workflows.

### Laboratory Operations Module
-   **Lab Operations Page**: 5-tab hub for laboratory compliance management.
-   **CAP Assessment**: 11 CAP discipline assessments with 6-element evaluation framework (726 lines of functionality).
-   **QC Data Import**: Import QC data from external systems with validation and trending (584-line UI + 378-line service).
-   **LIMS Integration**: Multi-vendor LIMS connectivity (Orchard, SoftLab, Sunquest) via HL7 and REST connectors (10 service files).
-   **Knowledge Base**: 552-line searchable knowledge base with categorized articles and quick-reference guides.
-   **Tracer Worksheets**: 931-line interactive tracer worksheet tool for CAP/JCI survey preparation.

### AI-Assisted Workflows (8 Capabilities)

AccreditEx integrates **AI-powered workflows** powered by **3 specialist domains** (Compliance, Risk Assessment, Training) and configurable **Groq-hosted inference**:

**Specialist Routing**:
-   **Compliance Specialist**: Analyzes documents against accreditation standards (CBAHI, JCI, ISO 9001). Detects gaps, assigns risk levels, recommends corrective actions.
-   **Risk Assessment Specialist**: Evaluates compliance risks using 5×5 risk matrices, identifies high-impact threats, proposes mitigation strategies.
-   **Training Coordinator**: Plans competency-based training, designs learning paths, generates training needs analyses aligned with accreditation requirements.

**Dedicated Workflows**:
-   **Action Plan Generation**: Creates compliance roadmaps from non-compliant standards with specific, measurable corrective actions.
-   **Root Cause Analysis**: Applies 5 Whys methodology and Fishbone analysis for structured problem-solving (Process, Human, Training, System factors).
-   **PDCA Improvement Suggestions**: Guides Plan-Do-Check-Act cycles with measurable success metrics and implementation timelines.
-   **Survey Readiness Assessment**: Evaluates organizational readiness for upcoming accreditation surveys, identifies high-risk areas, suggests preparation priorities.
-   **Design Control Compliance**: Assesses design traceability, verifies compliance with design control requirements, validates verification and validation plans.

**General Chat**: Context-aware conversational AI for questions about accreditation standards, best practices, compliance strategies, and platform guidance. Fallback for all workflow endpoints if specialists are unavailable.

**Provider**: Groq API with Firebase authentication and configured primary/fallback
models. Input-aware token budgets protect against oversized requests; actual
usage and cost depend on the provider plan. Evidence-bearing chat requests
bypass response caching to avoid stale source-backed answers.
Configured fallback model IDs are preserved during model resolution; a quota
failure retries the distinct configured fallback rather than aliasing it back
to the exhausted primary. If both models fail, the request reports failure.

**Hybrid routing:** routine chat/navigation uses `FAST_MODEL` (default
`openai/gpt-oss-20b`). Complex grounded workflows and document generation use
`MODEL_NAME` (default `openai/gpt-oss-120b`), with a distinct supported fallback.
Provider availability and organization-specific limits must be checked before
changing these settings. Historical Llama 8B/70B and Scout IDs were retired for
free/developer plans; see [Groq deprecations](https://console.groq.com/docs/deprecations).
Whisper transcription is a separate audio capability, not a text-model fallback,
and is not enabled by this routing change.

### Workflow Automation
-   **Trigger-Condition-Action Engine**: 10 entity types × 10 event types, 8 condition operators, 11 action types.
-   **Visual Workflow Builder**: 4-step modal for creating workflows with real-time config.
-   **Execution Logging**: Per-action status tracking with expandable log detail.
-   **Template Gallery**: Pre-built workflow templates for common accreditation scenarios.
-   **AI Integration**: AI-powered workflow suggestions, log analysis, and AI Generate action type.

### Custom Report Builder
-   **Section-Based Designer**: Visual builder with 6 block types (header, text, metric, chart, table, divider).
-   **13 Data Sources**: Projects, documents, risks, audits, trainings, incidents, and more.
-   **Live Preview**: Real-time chart/metric rendering with data from Zustand stores.
-   **Export**: PDF (jsPDF) and CSV export with configurable page orientation and headers.
-   **Template Gallery**: 5 pre-built report templates (compliance overview, risk assessment, etc.).
-   **AI Integration**: AI report analysis, AI text generation, AI template recommendations.

### Platform Capabilities
-   **Bilingual & RTL Support**: Full English/Arabic with 400+ translation keys, RTL layout, bidirectional text.
-   **Accessibility**: WCAG 2.1 Level AA compliant — high contrast, reduce motion, font adjustment, keyboard navigation.
-   **Light & Dark Mode**: Comfortable viewing in any condition with custom color themes.
-   **Departmental Management**: Department dashboards, performance metrics, and task delegation.
-   **Security Dashboard**: Audit logging, session management, usage analytics, and monitoring.
-   **Settings**: 19 settings sections including LIMS Integration configuration.
-   **PWA & Offline-First**: Progressive Web App with IndexedDB persistence (`idb`), `useOfflineSync` hook for background sync, Service Worker v4 with stale-while-revalidate caching, and enhanced offline indicator with pending-sync count.
-   **Interactive Guided Tour**: Lightweight tooltip-based onboarding tour with 2 tour tracks (New User, Quality Manager), keyboard navigation, dark mode, and RTL support.
-   **SEO Optimized**: Open Graph, Twitter Cards, JSON-LD structured data, dynamic meta descriptions for 17+ views, preconnect/DNS-prefetch hints.

### Native Mobile (Capacitor 8.x)
-   **Cross-Platform Native Wrapper**: Single codebase deploys to Android (APK/AAB), iOS (IPA), and Web (PWA).
-   **Native Camera Evidence Capture**: Take photos or pick from gallery directly within checklists via `@capacitor/camera`.
-   **Push Notifications (FCM)**: 4 notification channels (task deadlines, audit reminders, document approvals, system alerts) with topic-based subscriptions.
-   **Biometric Authentication**: Fingerprint and Face ID login via device keychain/keystore (capacitor-native-biometric).
-   **Native Lifecycle Integration**: Status bar theming, splash screen, hardware back button handling, keyboard adjustments.
-   **Platform Detection**: `capacitorPlatform.ts` utility with graceful web fallbacks for all native features.

## Technology Stack

-   **Frontend**: React 19.1.1, TypeScript 5.x, Tailwind CSS v4 (native), Vite 6.x
-   **Native Mobile**: Capacitor 8.x (10 plugins: camera, push-notifications, haptics, status-bar, splash-screen, app, keyboard, preferences, filesystem + capacitor-native-biometric)
-   **State Management**: Zustand (15 stores: `useAIChatStore`, `useAppStore`, `useChangeControlStore`, `useConfirmStore`, `useCustomizationStore`, `useHISIntegrationStore`, `useLabOpsStore`, `useModuleStore`, `useProjectStore`, `useReportBuilderStore`, `useSupplierStore`, `useTenantStore`, `useTourStore`, `useUserStore`, `useWorkflowStore`)
-   **Offline Storage**: IndexedDB via `idb` (3 stores: `cachedData`, `pendingSync`, `meta`) + in-memory Firestore cache with 5-min TTL
-   **Backend**: Google Firebase
    -   **Authentication**: Firebase Authentication (Email/Password)
    -   **Database**: Google Firestore (real-time)
    -   **Storage**: Firebase Storage (document files)
    -   **Hosting**: Firebase Hosting (https://accreditex.web.app)
-   **Charting**: Recharts
-   **AI Integration**: Custom AI Agent Backend (Python FastAPI on Render — https://accreditex.onrender.com)
-   **Routing**: React Router DOM 7.13.0 (43 route definitions including legacy redirects)
-   **Testing**: Jest + Playwright + React Testing Library (37 unit test files + 6 E2E specs)

## Architectural Approach

AccreditEx is built on a clean, scalable, and modular architecture to ensure long-term maintainability.

1.  **Frontend (React Application)**: 46 page components, 333 feature components, and reusable UI components across 34 domains. The application uses `AppRouter.tsx` with URL-based routing via React Router DOM.

2.  **State Management (Zustand)**: 15 feature-based stores (`useAIChatStore`, `useAppStore`, `useChangeControlStore`, `useConfirmStore`, `useCustomizationStore`, `useHISIntegrationStore`, `useLabOpsStore`, `useModuleStore`, `useProjectStore`, `useReportBuilderStore`, `useSupplierStore`, `useTenantStore`, `useTourStore`, `useUserStore`, `useWorkflowStore`) provide reactive state management decoupled from the UI.

3.  **Service Layer (123 services)**: Domain-specific services across accreditation, audit, training, escalation, QC import, LIMS integration, HIS integration, native camera, native push, native biometric, and supporting platform modules. The `BackendService.ts` remains the central orchestrator for Firebase/Firestore operations.

4.  **Integration Layer**: HIS Integration (18 files — Epic, Cerner, HL7, FHIR connectors) and LIMS Integration (10 files — Orchard, SoftLab, Sunquest connectors) provide healthcare system interoperability.

5.  **AI Layer (`ai.ts` → `aiAgentService.ts`)**: Routes all AI requests through the FastAPI backend on Render. No third-party AI API keys are exposed in the browser.

6.  **Native Mobile Layer (Capacitor 8.x)**: Platform-agnostic native bridge providing camera, push notifications, biometric auth, and device lifecycle integration. All native features include web fallbacks for PWA compatibility.

## Project Structure

```
src/
├── components/              # Feature components organized by domain
│   ├── audits/              # TracerWorksheetTab, audit components
│   ├── data-hub/            # QCDataImportTab, data components
│   ├── risk/                # RCAToolTab, risk components
│   ├── training/            # CAPAssessmentTab, CECreditsTab, SkillMatrixTab,
│   │                        # PersonnelFilesTab, LicensureTrackingTab,
│   │                        # LearningPathsTab, training components
│   ├── dashboard/           # Dashboard widgets and feature discovery
│   ├── settings/            # 19 settings section components
│   └── ...                  # Additional component directories
├── data/                    # Static data and localization
│   ├── locales/             # Modularized i18n translation files (EN/AR)
│   └── *.json               # Firestore seed data
├── firebase/                # Firebase configuration and hooks
├── hooks/                   # Custom React hooks
│   └── usePushNotifications.ts  # NEW: Push notification lifecycle hook
├── pages/                   # 46 page components
│   ├── LabOperationsPage.tsx    # 5-tab lab operations hub
│   ├── KnowledgeBasePage.tsx    # Searchable knowledge base
│   └── ...                      # 44 additional page components
├── router/                  # AppRouter.tsx + routes.ts (43 route definitions)
├── services/                # 123 domain services
│   ├── hisIntegration/      # 18 files: Epic, Cerner, HL7, FHIR connectors
│   ├── limsIntegration/     # 10 files: Orchard, SoftLab, Sunquest connectors
│   ├── nativeCameraService.ts   # NEW: Camera capture with web fallback
│   ├── nativePushService.ts     # NEW: FCM push notifications
│   ├── nativeBiometricService.ts # NEW: Biometric auth (fingerprint/face)
│   ├── escalationService.ts     # Automated escalation workflows
│   ├── qcDataImportService.ts   # QC data import with validation
│   └── ...                      # 70+ additional root services
├── stores/                  # 15 Zustand stores
├── types/                   # 14 type definition files
├── utils/                   # 39 utility modules
│   ├── capacitorPlatform.ts     # NEW: Platform detection & native fallbacks
│   ├── capacitorInit.ts         # NEW: Native lifecycle initialization
│   └── ...                      # Additional utilities
├── App.tsx                  # Root component with providers
└── index.tsx                # Entry point
capacitor.config.ts              # Capacitor native mobile configuration
```

## Backend & Data Persistence

The application uses Firebase Authentication, Cloud Firestore, and Cloud Storage. Firestore access is implemented through domain services in `src/services/`; Zustand stores call those services and keep the active UI state. Firestore's IndexedDB persistence is enabled in `src/firebase/firebaseConfig.ts` where the browser supports it.

`src/services/BackendService.ts` is a legacy localStorage implementation and is not the active persistence layer. It should not be used to initialize, seed, or reset a Firebase environment.

### Data Initialization and Changes

- The app fetches its settings and domain data from Firestore; it does not automatically seed all collections from `/data` on first launch.
- Configure Firebase for local development with a separate project or the Firebase Emulator and non-sensitive test data.
- Reference accreditation programs, standards, and competencies can be shared across organizations when their Firestore documents are explicitly marked with `scope: "global"`. Tenant-specific records carry `organizationId`.
- Firestore rules are in `firestore.rules`; composite indexes are in `firestore.indexes.json`.
- A read-only-by-default migration tool is available as `npm run db:classify-shared-data`. It reports eligible legacy reference records without modifying them. Applying it requires both `--apply` and a matching `--confirm-project=<projectId>` argument; review the dry-run and target a development/staging project before applying.
- Firestore authorization tests run with `npm run test:firestore`; this starts the Firestore Emulator and requires Java 17 or later.

Do not reset a database by deleting collections in the Firebase Console. Use a disposable emulator or staging project for reset/reseed workflows; production data changes require a reviewed, backed-up migration.

## AI Integration

AI-powered features (15+ tools) are provided by a custom Python FastAPI backend deployed on Render at `https://accreditex.onrender.com`.

-   The frontend AI facade (`services/ai.ts`) routes all requests through `services/aiAgentService.ts`.
-   `aiAgentService.ts` communicates with the backend at the URL configured in `VITE_AI_AGENT_URL`.
-   No third-party AI API keys are exposed in the browser — the backend manages all AI provider credentials server-side.
-   **Configuration**: Set `VITE_AI_AGENT_URL` in your `.env` file. Browser requests authenticate with Firebase ID tokens; do not expose provider or backend API keys in frontend variables.

### Cross-app evidence grounding

All existing chat callers and eight dedicated workflow endpoints share the
`ai-grounding/1` evidence envelope. The frontend selects authorized loaded records
matching the active organization and the centralized read-permission service.
The backend reloads selected records using the incoming Firebase token through
Firestore REST, enforcing read rules instead of trusting client text. Optional
search scans up to 50 organization-scoped documents and 50 standards, then ranks
and budgets at most seven records. Service failures are explicit; they do not
fall back to unverified client evidence. API-key callers cannot submit grounding
without Firebase user access.
Explicitly global standard/program catalogs are supported; unscoped legacy
records are withheld rather than assumed to belong to the current organization.

The retriever follows recorded document, standard, program, department, project,
risk, CAPA, PDCA, training/competency, and audit-plan links. Sources carry stable
references, document versions/statuses, bounded excerpts, and coverage limits.
Both assistant chat interfaces expose a collapsible evidence-provenance panel
with the exact supplied excerpts, recorded status/version, and retrieval limits.
The panel shows server-reloaded evidence when available. Reloading verifies
authorized database provenance, not clinical truth or accreditation compliance.
Relationship lists are deduplicated and bounded; ambiguous standard codes across
programs/editions are withheld rather than automatically linked.
Backend handlers reject organization mismatches and malformed evidence. The
model is instructed to cite source references, distinguish recorded links from
proposals, and disclose missing, partial, draft, expired, or conflicting evidence.
Document editing keeps its requested JSON/HTML/text output contract.
Lightweight writing requests use compact grounded prompts and do not inherit or
retain chat history. Document generation applies the selected tone and length
as bounded draft-writing instructions. Chat evidence is cleared on user/logout
or organization transitions; late replies cannot restore a reset conversation.

AI remains advisory: existing changes require user review/approval. Provider
failures do not create fabricated root causes, risk ratings, compliance statuses,
or successful writing edits.

PDF, DOCX, and UTF-8 text uploads extract bounded text locally (10 MB, 50 PDF
pages, 100,000 characters) using a bundled PDF worker, not a third-party parsing
service. Extraction status and limitations are stored separately from editable
content and do not approve the document. Empty, unsupported, scanned/image-only,
truncated, and failed extraction produce explicit localized warnings. No OCR is
performed. Existing attachments are not silently fetched or backfilled.

**Boundaries:** bounded retrieval is not an exhaustive knowledge index. Stored
extracted text is not independently verified against the binary, and catalog
descriptions do not authenticate an official standard edition. A source citation
establishes provenance, not clinical accuracy or accreditation certification.
Missing links and absent sources require review.

## Lab Operations Module

The Lab Operations module (P2 roadmap item, fully implemented) provides:
-   **LabOperationsPage**: 5-tab hub for laboratory compliance
-   **CAP Assessment Tab**: 11 CAP disciplines × 6-element competency evaluation (726 lines)
-   **QC Data Import Tab**: CSV/JSON import with validation and trending (584 lines + 378-line service)
-   **LIMS Integration**: Multi-vendor connectivity via `src/services/limsIntegration/` (10 files)
-   **Tracer Worksheets**: Interactive CAP/JCI survey preparation tool (931 lines)
-   **Knowledge Base**: Searchable articles with categorized content (552 lines)

## Quick Commands
```bash
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Production build
npm run test             # Run all unit tests (Jest)
npm run test:coverage    # Tests with coverage report
npm run test:e2e         # Run Playwright E2E tests
npx cap sync             # Sync web build → native projects (Android/iOS)

# Deployment scripts (in scripts/ folder)
npx powershell -NoProfile -ExecutionPolicy Bypass -File scripts/deploy-render.ps1    # Deploy to Render
npx powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-render-service.ps1  # Setup Render service
npx powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-ai-agent.ps1    # Test AI agent
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Last Updated:** May 10, 2026 | **Version:** 2.4 | **Live:** https://accreditex.web.app