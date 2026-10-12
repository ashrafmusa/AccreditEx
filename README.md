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
-   **Quality Tools**: Category-filtered reference catalogue with permission/module-aware links to training and templates. Counts describe available catalogue entries, not compliance coverage. Reviewed work can continue into project requirements, controlled evidence, and risk/CAPA; calculator results are not automatically saved as evidence. Clinical calculation logic is unchanged.
-   **Projects workspace**: Search projects by name, description, program, department or lead; sort by name, target date or outstanding requirements. Cards show localized status, ownership, target date, recorded checklist progress and outstanding/unassigned/overdue work. “My Projects” includes lead, team and checklist assignments. Bulk actions only target selected projects in the current filtered view; load failures show retry rather than an empty list. Checklist progress is not verified accreditation readiness.
    - **Create New Project**: The four-step wizard validates every step and rechecks references before saving. Programs/standards are shared or organization-owned; active team and department choices belong to the current organization, and only eligible administrators/project leads can lead a project. Browser drafts are scoped to the account and organization, are never used for edits, and are cleared after a successful save. Legacy unscoped drafts are not restored. The review previews the actual checklist; fresh standard/template tasks start without compliance claims or evidence. Saved projects open directly in their project workspace. Editing preserves recorded checklist work and evidence, permits historical start dates, and locks the program to prevent cross-program reference corruption. AI descriptions fail visibly on empty responses, and validated AI dates require explicit review/application. Identical standard records are collapsed; conflicting records for the same program/identifier cannot add new requirements until the catalogue is reconciled. No source records are changed automatically.
- **Connected project detail**: Live project listeners update shared state, clean up on project switches, and expose retry for failures. Next actions connect requirements, documents, CAPA/PDCA and mock surveys. Document Control's project scope includes actual checklist, design-control, PDCA/CAPA and direct document links within the organization, including legacy uncontrolled evidence; the scope and document selection survive reloads and browser history. Project audit shows ID-linked events and embedded activity, not unrelated organization events. Design-control/PDCA uploads persist document records; document-link changes await saves. AI reports use authenticated contextual requests, fail visibly instead of substituting template success, and save as project/department-linked drafts for human review. Finalized/archived projects and read-only roles cannot mutate project records through the shared store. Finalization uses advisory AI review and Firebase password reauthentication; it records the reviewer ID and does not certify accreditation or impose a new strict-readiness policy.
-   **Audit Management Hub**: Internal/external audit planning, tracer worksheets, findings management, and corrective action tracking.
    - **Project survey follow-through**: Applying a completed mock survey saves failed requirements as non-compliant with source-survey notes, preserves passing items and existing notes, and rejects unresolved checklist links. Reapplying does not duplicate source notes. Save failures remain visible, and finalized projects do not offer mutation actions.
    - Activity-log reads require the `activity_logs` organization/timestamp composite indexes declared in `firestore.indexes.json`. Reads require server confirmation rather than silently falling back to stale offline rows. Read failures display an error and retry action instead of claiming the log is empty.
    - SMCS seeding resolves a single active program from complete standard coverage, never the dataset's legacy `prog-ohap` identifier, and checks for existing legacy or repaired projects before writing.

-   **Training & Competency**: Full LMS with quiz-based training, certificate generation, CE credit tracking, skill matrices, learning paths, and competency gap analysis. My Training summarizes completion and overdue assignments, prioritizes nearest due dates, and supports course search.
-   **Analytics Hub**: Multi-format reporting (PDF, Excel, CSV, JSON), AI-powered quality insights, PDCA cycle tracking, and executive briefings.
-   **Multi-Facility Dashboard**: Organization-scoped facility compliance metrics with sorting, manual refresh, and explicit empty/error states; facility values are only shown when loaded from organization data.

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
- `npm run test:e2e:emulator` runs the full Chromium user-journey suite against the `demo-accreditex-e2e` Auth/Firestore emulators, using synthetic users for role dashboards, onboarding, navigation, and login/logout flows. The setup also verifies direct client Auth and Firestore profile access. Its separate `firestore-e2e.rules` is intentionally permissive for app-flow testing; it is not production policy and does not test tenant authorization. Use `npm run test:firestore` for Firestore/Storage authorization rules coverage.

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

The admin-only Lab Operations workspace has eight tabs: Equipment, Maintenance,
Reagents, QC Dashboard, Proficiency Testing, Quality Management, IQC/Westgard,
and Competency Matrix.

- Persistence requires an active organization. New writes use
  `labOpsData/{organizationId}`; a single organization-owned legacy document is
  still readable, and the next save copies the loaded state to the canonical
  path without deleting the legacy record. Canonical records take precedence;
  multiple legacy records without a canonical record fail visibly and need
  reconciliation. No production data is migrated automatically.
- Failed reads are not treated as empty collections. Editing and saving remain
  blocked until loading succeeds; Retry reloads after a load failure. Genuinely
  empty organizations start with empty arrays, not demonstration records; data
  is persisted on the first save rather than automatically writing defaults.
- Tenant admins can reset Lab Operations from its page after downloading a
  JSON backup and typing the exact active organization ID. The reset replaces
  the organization's canonical aggregate with empty arrays and removes its
  matching legacy duplicates in one Firestore batch; other organizations are
  untouched. Keep the downloaded file secure. The UI fails closed when
  record-level storage is active; that schema needs a separately verified
  reset procedure.
- Tenant admins can import the versioned organization-specific JSON backup or
  the multi-sheet Excel template from the Lab Operations page. Imports are
  previewed, validated, and additive: existing records are not replaced or
  deleted, and records with IDs already present are skipped. JSON backups must
  match the active organization. Import is unavailable while record-level
  storage is active.
- Calibration history and equipment restrictions update together. Failed
  calibration never restores an asset to active status. Reagent usage and
  inventory update together and reject nonfinite, nonpositive, or excessive use.
- IQC operators are selected from active organization staff by user ID, not
  free-text names. The latest matching competency record determines the gate;
  revocations fail closed, including tied update timestamps. A level-specific
  authorization does not authorize another level. Legacy name-only records
  must be reviewed and linked to a canonical staff ID using Competency Matrix
  **Edit** before they authorize QC logging.
- Lab Operations Firestore create/update rules now require tenant admins,
  matching the route. These rules require a separately authorized rules
  deployment; a Hosting deployment does not apply them.
- **Dormant record storage upgrade:** `VITE_LAB_RECORD_STORAGE` defaults to
  `false`. This upgrade additionally compiles it OFF for Vite's `production`
  mode and rejects it at runtime when `NODE_ENV` is `production`, even if an
  existing environment file or process variable says `true`. Non-production
  emulator/staging rehearsal can explicitly enable the flag. Production
  activation requires a separately authorized, reviewed change to both guards,
  a rules/schema rollout, and a build explicitly enabling the flag.
  Enabling it without a verified, `ready: true` destination fails closed; there
  is no fallback to stale aggregates and no browser-driven migration.
  `labOpsRecords/{organizationId}` holds master data and a revision; its
  `iqcResults`, `reagentUsageLogs`, `calibrations`, and `maintenanceLogs`
  subcollections hold individual records under their original IDs.
- Record-mode usage and calibration writes are transactions with the current
  inventory/equipment state. Identical retries with the same ID/payload are
  no-ops; conflicting reused IDs fail. Insufficient stock, quarantined/expired/
  depleted inventory, blocked quality flags, mismatched units and backdated
  calibrations are rejected. IQC and maintenance updates compare their previous
  payload and master revision. Other master edits use revision compare-and-set;
  concurrent stale edits fail visibly and require reload, rather than merging or
  overwriting another operator's inventory changes. There is no offline or
  cross-organization operation queue. Queued metadata saves are discarded before
  dispatch if their captured organization is no longer active. An already dispatched transaction remains
  bound to its original organization; late responses cannot populate another
  organization's store.
- Log queries use deterministic date/ID ordering and snapshot cursors, with
  50-record pages (maximum 100). Recent usage has an explicit partial-history
  notice and **Load older usage** control, even if the selected reagent has no
  entries on the current page. Calibration, maintenance and IQC histories are
  fetched through every page before editing/calculation consumers become
  available; failure or a revision change during hydration blocks the workspace.
  Their tables progressively show older records independently of calculation
  history. Westgard and QC Dashboard therefore never calculate against a
  silently truncated window. The existing chart's 20-run display window does
  not truncate rule evaluation.
- Limits: master arrays still share a document (Firestore's 1 MiB limit applies);
  legacy mode retains its 900,000-byte guard and is not conflict-safe.
  Full calibration/maintenance/IQC hydration deliberately preserves current
  statistics and rule behavior, but has growing read/memory costs. This is not
  a server-side analytics or archival solution. Linked IQC risk/CAPA/event master
  edits are not one atomic clinical workflow with the IQC record; failed steps
  remain visible and require review. Record mutations reload full calculation
  histories after commit. Forms retain an in-session operation ID for uncertain
  create retries; closing/reloading the form is not a durable offline retry log.

### Record migration rehearsal, rollout and rollback

`scripts\migrations\lab-operations-records.cjs` is intentionally **emulator-only**:
it requires a loopback `FIRESTORE_EMULATOR_HOST` and an explicit `demo-*` project.
It does not accept production credentials or initialize a production target.
Run a disposable, seeded emulator in another terminal (`npx firebase emulators:start
--only firestore --project demo-accreditex-rules`), then in PowerShell:

```powershell
$env:FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
New-Item -ItemType Directory -Force lab-migration-backups | Out-Null
node scripts\migrations\lab-operations-records.cjs --mode dry-run --org org-a --project demo-accreditex-rules
node scripts\migrations\lab-operations-records.cjs --mode backup --org org-a --project demo-accreditex-rules --backup lab-migration-backups\org-a.json
node scripts\migrations\lab-operations-records.cjs --mode migrate --org org-a --project demo-accreditex-rules --backup lab-migration-backups\org-a.json
```

Dry-run validates ownership, dates and unique IDs without writes. Backup creates
an exclusive local file with a SHA-256 fingerprint and original source ID/data;
never overwrite it, commit it, or paste its contents into logs. The ignored
backup directory still contains sensitive operational data: restrict access,
retain according to policy, and use approved encrypted storage for real backups.
Migration preserves the entire source aggregate, uses original log IDs, writes
at most 100 records plus a checkpoint per transaction, and verifies exact
destination sets/payloads before activation. An interruption resumes at the last
atomic offset using the **same backup**; changed sources, invalid/duplicate IDs,
foreign backups and destination conflicts fail closed. A completed migration
retry is a no-op, including after subsequent record-mode usage.

Production is **not authorized by this upgrade**. Before any future rollout:

1. Obtain explicit migration/rules authorization and review a production-specific
   runner (this emulator-only script is not a production deployment tool).
2. Quiesce Lab Operations writers and old browser sessions; reconcile duplicate
   legacy sources/IDs and invalid dates; take an approved recoverable backup.
   Deploy reviewed rules separately, not with Hosting. The new rules freeze all
   organization-owned legacy aggregates once that organization's destination
   exists, including while migration is incomplete.
3. Rehearse interruption/resume, tenant access, concurrent usage and rollback in
   the emulator/staging environment. Do not dual-write aggregates and records.
4. Migrate one explicitly selected organization at a time while the flag stays
   off and writers remain paused. Verify source fingerprints and exact records;
   only then activate `ready`, remove the production lockouts in an authorized
   reviewed change, enable the flag in that build, and verify
   tenant/admin permissions, histories, usage and calibration behavior live.
   New organizations also need explicitly provisioned ready record roots.
5. Rollback **before new writes**: keep writers paused, disable the flag, retain
   the destination for investigation, and block record-schema writes for old
   clients as well (reviewed rollback rules and/or a privileged `ready: false`
   change). Explicitly restore aggregate write
   access using reviewed rollback rules (the new freeze cannot be bypassed merely
   by turning the flag off). The preserved aggregate is the cutover snapshot.
   Rollback **after new writes** requires a fresh backup of both schemas and a
   reviewed reconciliation/export of post-cutover logs, current inventory/
   equipment and edited master data into the aggregate. Verify capacity and
   reconciled totals before switching; blindly restoring the cutover snapshot
   would lose usage/calibration changes. After rollback, new writes may resume
   only in the reconciled aggregate with the record schema still frozen. Do not
   simply set the old destination `ready: true` again: subsequent legacy writes
   would be missing there. Re-activation needs another reviewed reconciliation/
   migration and verification. No destructive rollback is automated.

Validation: `npm run test:firestore` covers the resumable migration, all four log
kinds, frozen rollback aggregate, tenant/role isolation, equal-date pagination,
interruption, changed-source rejection, idempotent retries and concurrent usage.
No production data, rules or Hosting deployment is part of these commands.

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