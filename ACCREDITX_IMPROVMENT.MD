# AccreditEx | Master Engineering Improvement & Hardening Plan

- **Document Type:** Source-Grounded Technical Remediation & Architecture Roadmap
- **Target Repository:** `ashrafmusa/AccreditEx` (Branch: `main`)[cite: 1]
- **Baseline Revision:** `534296678b39c7068342fa07f3736ed6446241e4` (Snapshot: `2026-10-18`)[cite: 1]
- **Scope:** Frontend SPA (`src/`), Firebase Rules & Cloud Functions (`firestore.rules`, `storage.rules`, `functions/src/`), Python FastAPI AI Backend (`ai-agent/deployment_package/`), and CI/CD / PWA / Capacitor configurations[cite: 1].

---

## 00. Executive Summary & Architectural Verdict

**AccreditEx** has a strong domain architecture that bridges healthcare accreditation governance (JCI, CBAHI, DNV, OHAS/SMCS) with clinical laboratory operations (Westgard IQC, proficiency testing, reagent control, and competency authorization gates) in a bilingual (`en`/`ar`) multi-tenant workspace[cite: 1]. Its AI grounding specification (`ai-grounding/1`)—which rehydrates up to 7 tenant-authorized sources via the Firestore REST API using the caller's Firebase Bearer token and requires explicit human confirmation for `create_risk` and `create_capa` proposals—is a standout pattern for regulated healthcare software[cite: 1].

However, rapid feature expansion has created four systemic categories of technical debt that must be resolved before scaling production tenants[cite: 1]:
1. **Security & Multi-Tenant Enforcement Gaps (P0):** Unscoped backend report uploads, destructive custom-claim overwrites on user deletion, unverified Stripe webhook plan metadata, ungated early router branches, and missing `getTenantQuery`/`getTenantStamp` wrappers in several stores/services[cite: 1].
2. **Data Plane & Formula Fragmentation (P1):** Five competing compliance calculation formulas, parallel unbridged Firestore collections (`capaReports` vs. `project.capaReports`, `accreditationPrograms` vs. `programs`, root vs. nested `documents`/`audits`), and schema mismatches between frontend TypeScript models and Python backend Firestore queries[cite: 1].
3. **Illusion of Durability / Local-Only Prototypes (P1):** Unawaited document save indicators, an offline sync hook that deletes queued items without executing remote writes, in-memory-only quiz certificates, and several mounted UI tabs (CAP, CE Credits, Learning Paths, SMCS Tracker, Tracer Worksheets, RCA Tool, QC Data Import) that mutate only local React state[cite: 1].
4. **Lab Scalability & Integration Edge Cases (P1/P2):** Production lab state is locked to a single 900KB aggregate document (`labOpsData/{org}`) while the transactional subcollection engine (`labOpsRecords`) is forced off[cite: 1]; IQC rejection side-effects execute non-atomically[cite: 1]; Westgard import parsing has unreachable branches[cite: 1]; and HIS/LIMS/Workflow engines contain mock/intent-only paths[cite: 1].

---

## Phase 1: Security, Auth & Multi-Tenant Hardening (P0 — Immediate)

### 1.1 Lock Down `POST /upload-report` in the Python AI Backend
- **Target Files:**
  - `ai-agent/deployment_package/main.py` (line 933)[cite: 1]
  - `ai-agent/deployment_package/firebase_client.py`[cite: 1]
  - `storage.rules`[cite: 1]
- **Observed Vulnerability:**
  - `POST /upload-report` accepts multipart `project_id`, `file_data` (base64 string), and `file_name` without calling `resolve_request_scope`, verifying project ownership/existence, or validating file size/MIME content[cite: 1].
  - It writes to `reports/{project_id}/{file_name}` (omitting `organizationId`), whereas `storage.rules` expects `reports/{org}/{project}/**`[cite: 1].
  - `firebase_client.py` initializes `firebase_admin` before `main.py` sets `storageBucket`, leaving `storage.bucket()` unconfigured unless initialized in a specific order[cite: 1].
- **Remediation Steps:**
  - [x] In `firebase_client.py`, configure `storageBucket` (`os.getenv("FIREBASE_STORAGE_BUCKET", "accreditex-79c08.firebasestorage.app")`) directly inside the singleton `firebase_admin.initialize_app()` call[cite: 1].
  - [ ] In `main.py` (`POST /upload-report`), enforce Firebase Bearer token authentication and call `resolve_request_scope()` to extract authoritative `uid` and `organization_id`[cite: 1].
  - [x] Fetch `projects/{project_id}` from Firestore and verify `project.organizationId == organization_id` (raise `HTTPException(403)` or `404` on mismatch)[cite: 1].
  - [x] Enforce a strict payload ceiling (`< 10 MiB` decoded bytes to match `storage.rules`), verify the `%PDF-` magic header on decoded bytes, strictly validate the basename-safe `file_name`, and write to `reports/{organization_id}/{project_id}/{safe_file_name}`[cite: 1].

### 1.2 Fix Custom Claim Wiping & Redundant Writes in Cloud Functions
- **Target File:** `functions/src/index.ts` (`onUserDocWrite`, `setUserClaims`, `setSuperAdminClaim`)[cite: 1]
- **Observed Vulnerability:**
  - `onUserDocWrite` (`onDocumentWritten("users/{uid}")`) updates Firebase Auth custom claims on *every* user document write without a diff guard[cite: 1].
  - When a user document is deleted (`!after.exists`), it writes `claims = {}`, wiping all custom claims on the Auth user—including `isSuperAdmin`[cite: 1].
  - `setSuperAdminClaim` lacks audit logging and bootstrap protection[cite: 1].
- **Remediation Steps:**
  - [x] Add a diff guard at the top of `onUserDocWrite` so unrelated user document updates do not rewrite custom claims[cite: 1].
  - [x] Propagate `admin.auth().getUser(uid)` errors before merging claims so the function retries instead of overwriting unknown existing claims[cite: 1].
  - [x] On user document deletion, preserve privileged flags from existing claims while clearing only tenant-specific `role` and `organizationId`[cite: 1].
  - [x] Write an immutable entry to `settings_audit_logs` whenever `setSuperAdminClaim` succeeds[cite: 1].

### 1.3 Harden Stripe Webhook Verification & Idempotency
- **Target File:** `ai-agent/deployment_package/main.py` (`POST /stripe/webhook`, lines 1068–1184)[cite: 1]
- **Observed Vulnerability:**
  - Price environment variables (`STRIPE_PRICE_CLINIC`, `STRIPE_PRICE_HOSPITAL`, `STRIPE_PRICE_NETWORK`) default to `""` when unset, colliding on the empty-string key in the price map[cite: 1].
  - `checkout.session.completed` trusts `metadata.plan` directly without verifying it against the paid Stripe Price ID and hardcodes `expiry = UTCnow + 32 days` instead of reading the subscription period[cite: 1].
  - `invoice.paid` does not enforce the `stripeCustomerId` ownership check used in checkout[cite: 1].
  - No webhook idempotency ledger exists, and `customer.subscription.updated` / `invoice.payment_failed` are ignored[cite: 1].
- **Remediation Steps:**
  - [x] Filter out empty environment variables when constructing the Stripe price-to-plan dictionary[cite: 1].
  - [x] Create a Firestore idempotency collection (`stripeWebhookEvents/{event_id}`) and wrap event processing in a transaction that aborts if `event.id` was already processed[cite: 1].
  - [x] In `checkout.session.completed`, derive the plan from the subscription's verified Stripe `price.id` and set `subscriptionExpiresAt` from `subscription.current_period_end`[cite: 1].
  - [x] Enforce exact `stripeCustomerId` matching on renewal, update, failure, and deletion subscription events[cite: 1].
  - [x] Add handlers for `customer.subscription.updated` (plan changes / cancellation at period end) and `invoice.payment_failed`[cite: 1].

### 1.4 Enforce Frontend Router Gates & Tenant Query Wrappers
- **Target Files:**
  - `src/components/common/MainRouter.tsx`[cite: 1]
  - `src/router/routes.ts`, `src/hooks/useNavigation.ts`[cite: 1]
  - `src/stores/useWorkflowStore.ts`[cite: 1]
  - `src/services/userTrainingStatusService.ts`, `src/services/commentService.ts`, `src/services/settingsAuditService.ts`, `src/services/settingsVersionService.ts`, `src/services/userActivityService.ts`, `src/services/settingsPresetsService.ts`, `src/services/aiFeedbackService.ts`, `src/services/bulkUserService.exceljs.ts`[cite: 1]
- **Observed Vulnerability:**
  - `MainRouter.tsx` renders `certificate`, `mockSurvey`, and `surveyReport` in early `if` branches *before* evaluating user authentication, role restrictions, and `getModuleForView`/`isViewEnabled`[cite: 1].
  - `useWorkflowStore.ts` and the services listed above access raw Firestore collections without `getTenantQuery()` or `getTenantStamp()`[cite: 1].
  - `pathToNavigationState` in `useNavigation.ts` parses `/quality-insights` as `qualityInsights`, whereas `routes.ts` metadata maps it to `analyticsHub`[cite: 1]. `questionBank` in `MainRouter.tsx` renders `KnowledgeBasePage` instead of `SurveyorQuestionBankPage.tsx`[cite: 1].
- **Remediation Steps:**
  - [x] Keep the `certificate`, `mockSurvey`, and `surveyReport` branches behind authentication, permission, and module entitlement gates[cite: 1].
  - [x] Refactor workflow, training-status, comment, settings-audit/version/preset, user-activity, and AI feedback services to use tenant-scoped reads and writes[cite: 1].
  - [x] Remove the unscoped duplicate `src/services/bulkUserService.exceljs.ts` and standardize callers on `src/services/bulkUserService.ts`[cite: 1].
  - [x] Reconcile `/quality-insights` routing and render `SurveyorQuestionBankPage.tsx` for `questionBank`[cite: 1].

### 1.5 Replace Mock Security Methods & Unverified Document Approvals
- **Target Files:**
  - `src/services/securityService.ts`, `src/utils/secureStorage.ts`[cite: 1]
  - `src/components/documents/DocumentEditorModal.tsx`, `src/pages/DocumentControlHubPage.tsx`, `src/stores/useAppStore.ts`[cite: 1]
  - `src/components/settings/ProfileSettingsPage.tsx`[cite: 1]
- **Observed Vulnerability:**
  - `securityService.ts` implements `encrypt`/`decrypt` with `btoa`/`atob` (ignoring the key) and hardcodes `verify2FA` to return `true`[cite: 1].
  - Approving a controlled document collects a password in the signature modal but ignores it and calls `approveDocument(id)` without Firebase re-authentication (unlike `useProjectStore.finalizeProject`)[cite: 1].
  - `ProfileSettingsPage.tsx` has an unimplemented `TODO` for user password changes[cite: 1].
- **Remediation Steps:**
  - [x] Require Firebase reauthentication before approving a controlled document[cite: 1].
  - [x] Implement password changes in `ProfileSettingsPage.tsx` using Firebase Auth reauthentication and `updatePassword`[cite: 1].
  - [x] Replace mock encoding with WebCrypto AES-GCM; no fake `verify2FA` success implementation remains[cite: 1].

---

## Phase 2: Data Plane & Formula Consolidation (P1 — Architecture)

### 2.1 Standardize the 5 Competing Compliance Formulas
- **Target Files:**
  - `src/utils/complianceUtils.ts`, `src/utils/omanLabInspectionScoring.ts`[cite: 1]
  - `src/stores/useProjectStore.ts`, `src/services/reportService.ts`, `src/services/multiFacilityService.ts`[cite: 1]
  - `src/pages/AnalyticsPage.tsx`, `src/components/dashboard/ClinicDashboard.tsx`[cite: 1]
  - `ai-agent/deployment_package/firebase_client.py` (`get_project_details`)[cite: 1]
- **Observed Discrepancies:**
  1. `useProjectStore`: $100 \times \frac{\text{Compliant} + 0.5 \times \text{Partially Compliant}}{\text{Applicable}}$ (returns `100` when all items are `Not Applicable`)[cite: 1].
  2. `reportService`: Same weighted formula, but returns `0` when all items are `Not Applicable`[cite: 1].
  3. `AnalyticsPage`, `ClinicDashboard`, and `firebase_client.py`: $100 \times \frac{\text{Compliant}}{\text{Total}}$ (ignores `Partially Compliant` and `Not Applicable`)[cite: 1].
  4. `multiFacilityService.ts`: Reads `project.checklistItems` (instead of `project.checklist`) and checks lowercase `'compliant'` / `'partiallyCompliant'`, causing silent undercounting[cite: 1].
  5. `omanLabInspectionScoring.ts`: Assessed-only score plus separate coverage ratio (intentionally distinct for Oman Private Lab inspections)[cite: 1].
- **Remediation Steps:**
  - [x] Consolidate general project compliance math in `src/utils/complianceUtils.ts` with `calculateChecklistCompliance(checklist, options)`, excluding Not Applicable items and exposing `isAllNotApplicable`[cite: 1].
  - [x] Read canonical `project.checklist` records and compare title-case `ComplianceStatus` enum values in multi-facility metrics[cite: 1].
  - [x] Use the unified formula in the project, reporting, analytics, clinic dashboard, and Python backend paths; preserve the separate Oman-specific inspection scoring[cite: 1].

### 2.2 Reconcile Split-Brain Firestore Collections
- **Target Files:**
  - **CAPAs:** `src/services/projectService.ts`, `src/services/capaService.ts`, `src/components/risk/CapaReportsTab.tsx`, `src/components/risk/IncidentToCAPAWorkflow.tsx`[cite: 1]
  - **Programs & Standards:** `src/services/accreditationProgramService.ts`, `src/services/programService.ts`, `src/services/standardService.ts`[cite: 1]
  - **Audits & Change Control:** `src/services/documentBatchAuditService.ts`, `src/services/complianceDashboardService.ts`, `src/services/auditChangeControlService.ts`, `src/services/changeControlService.ts`[cite: 1]
  - **Notifications:** `src/services/notificationService.ts`, `src/services/notificationServiceFirebase.ts`[cite: 1]
- **Observed Discrepancies:**
  - `IncidentToCAPAWorkflow.tsx` creates standalone CAPAs in the root `capaReports` collection via `capaService.ts` and mutates `incidentData.linkedRiskIds` in memory after creation without updating the incident in Firestore[cite: 1]. Meanwhile, `CapaReportsTab.tsx` only flattens embedded `project.capaReports`, making standalone incident CAPAs invisible[cite: 1]. Additionally, `capaService.ts` pushes `completedBy: undefined` into `stageHistory`, which Firestore rejects[cite: 1].
  - `programService.ts` targets `programs`, whereas the rest of the app uses `accreditationPrograms`[cite: 1].
  - `standardService.ts` updates standards using `standard.standardId` preferentially over the Firestore document `id`[cite: 1].
  - `documentBatchAuditService.ts` (`storeAuditResults`) only `console.log`s the audit record instead of saving to `projects/{p}/audits`, starving `complianceDashboardService.ts` of historical data[cite: 1].
  - `auditChangeControlService.ts` generates `CR-*` IDs on documents without writing to `changeRequests`, and `changeControlService.ts` overwrites the `auditTrail` array with a single object on transitions[cite: 1].
  - `notificationService.ts` is an in-memory singleton disconnected from `notificationServiceFirebase.ts`[cite: 1].
- **Remediation Steps:**
  - [x] Strip nested `undefined` values from CAPA writes, persist incident links, and merge embedded and standalone CAPA reports[cite: 1].
  - [x] Remove unused `programService.ts` in favor of `accreditationProgramService.ts`; use Firestore document IDs for standard updates/deletes[cite: 1].
  - [x] Align project PDCA stage filtering with `cycle.currentStage`[cite: 1].
  - [x] Persist audit results in project audit subcollections, create audit-linked change requests through the change-control service, and append audit-trail entries[cite: 1].
  - [x] Route notification mutations and reads through `notificationServiceFirebase.ts`[cite: 1].

### 2.3 Align Python AI Backend Queries with Frontend TypeScript Schemas
- **Target Files:**
  - `ai-agent/deployment_package/firebase_client.py`[cite: 1]
  - `ai-agent/deployment_package/context_manager.py`[cite: 1]
  - `src/services/projectService.ts`[cite: 1]
- **Observed Discrepancies:**
  - `firebase_client.py` (`get_user_context`) queries `projects` by `projectLeadId == uid`, and `context_manager.py` queries `projects` by `assignedUsers` array-contains `uid`[cite: 1]. However, `Project` in `src/types/index.ts` stores `projectLead: User` and `teamMembers: string[]`[cite: 1].
  - `firebase_client.py` (`get_user_training_status`) reads `user.completedTraining`, which does not exist on the frontend `User` schema (`trainingAssignments` + `userTrainingStatuses`), and `pending = total - completed` can become negative[cite: 1].
  - `firebase_client.py` caches user context under `user_context:{uid}` without `organization_id` and checks cache before verifying tenant scope[cite: 1].
- **Remediation Steps:**
  - [x] Persist `projectLeadId` and deduplicated `assignedUsers` index fields from the frontend project lead and team members[cite: 1].
  - [x] Scope the Python user-context cache by organization and resolve the user's tenant before checking cached data[cite: 1].
  - [x] Read training completion from `userTrainingStatuses`, intersect it with active training program IDs, and clamp pending counts at zero[cite: 1].

---

## Phase 3: Eliminating "Fake Durability" & Local-Only State (P1 — Trust)

### 3.1 Make Document Saves, Numbering & Evidence Linking Durable
- **Target Files:**
  - `src/components/documents/DocumentEditorModal.tsx`, `src/pages/DocumentControlHubPage.tsx`[cite: 1]
  - `src/stores/useAppStore.ts`, `src/stores/useProjectStore.ts`[cite: 1]
- **Observed Flaws:**
  - `DocumentEditorModal.tsx` does not `await` `onSave` or `onAutoSave`, displaying a local "Saved" indicator after 600ms even if the Firestore write fails[cite: 1].
  - `useAppStore.ts` retains an in-memory-only `addDocument()` alongside persistent `addControlledDocument()`[cite: 1].
  - `useProjectStore.uploadEvidence` performs 3 separate writes (`Cloudinary` $\rightarrow$ `addControlledDocument` $\rightarrow$ `updateDoc(project.checklist.evidenceFiles)`) without rollback or batching for the Firestore steps[cite: 1].
- **Remediation Steps:**
  - [x] Make `onSave` and `onAutoSave` async `Promise<void>` contracts in `DocumentEditorModal.tsx`, `await` the Firestore write in `DocumentControlHubPage.tsx`, and surface explicit `Saving...` / `Saved` / `Save Error` states[cite: 1].
  - [x] Deprecate/remove in-memory `addDocument()` from `useAppStore.ts` so all document creation persists via `addControlledDocument()`[cite: 1].
  - [x] In `useProjectStore.uploadEvidence`, commit the `documents` record creation and the `projects` `checklist.evidenceFiles` update inside a single Firestore `writeBatch` / `runTransaction`[cite: 1].

### 3.2 Persist Quiz Certificates & Training Hub Trackers
- **Target Files:**
  - `src/stores/useAppStore.ts` (`submitQuiz`), `src/services/certificateService.ts`, `src/services/userTrainingStatusService.ts`[cite: 1]
  - `src/components/training/CAPAssessmentTab.tsx`, `src/components/training/CECreditsTab.tsx`, `src/components/training/LearningPathsTab.tsx`, `src/components/training/SmcsCompetencyTrackerTab.tsx`[cite: 1]
- **Observed Flaws:**
  - `submitQuiz` creates `cert-{uid}-{trainingId}` and updates `userTrainingStatuses` in memory only, and does not guard against `program.quiz.length === 0`[cite: 1].
  - `CAPAssessmentTab`, `CECreditsTab`, `LearningPathsTab`, and `SmcsCompetencyTrackerTab` are mounted in `TrainingHubPage.tsx` but store all records in local React state with no Firestore persistence[cite: 1].
- **Remediation Steps:**
  - [x] Guard zero-question quizzes and submit attempts to the authenticated server-side callable, which verifies tenant ownership, computes scores, and atomically writes `userTrainingStatuses` and `certificates` documents. The Functions update is compiled but has not been deployed[cite: 1].
  - [ ] Create tenant-scoped Firestore persistence methods for `capAssessments`, `ceCredits`, `learningPaths`, `userLearningPathProgress`, and `smcsCompetencies`, and wire the four Training Hub tabs to load and save from Firestore (adding corresponding match blocks in `firestore.rules`)[cite: 1].

### 3.3 Persist Tracer Worksheets, RCA Analyses, Customizations & Offline Queue
- **Target Files:**
  - `src/components/audits/TracerWorksheetTab.tsx`, `src/components/risk/RCAToolTab.tsx`[cite: 1]
  - `src/stores/useCustomizationStore.ts`, `src/services/customizationService.ts`[cite: 1]
  - `src/hooks/useOfflineSync.ts`, `src/services/offlineStorage.ts`[cite: 1]
- **Observed Flaws:**
  - `TracerWorksheetTab.tsx` stores active and completed tracer sessions only in component state[cite: 1].
  - `RCAToolTab.tsx` saves Fishbone and 5-Why analyses only to a local `savedAnalyses` array[cite: 1].
  - `useCustomizationStore.ts` has `TODO` placeholders for Firebase load/save even though `customizationService.ts` is already implemented[cite: 1].
  - `useOfflineSync.ts` iterates `pendingSync` items 3 seconds after reconnect and **removes them without executing any Firestore mutation**[cite: 1].
- **Remediation Steps:**
  - [x] Wire `useCustomizationStore.ts` to call `customizationService.loadCustomization(userId)` and `customizationService.saveCustomization(userId, state)`[cite: 1].
  - [x] Persist `TracerWorksheetTab.tsx` templates and sessions to Firestore (`tracerTemplates`, `tracerSessions`)[cite: 1].
  - [x] Wire `RCAToolTab.tsx` to persist `RootCauseAnalysisData` (`fishbone`, `fiveWhys`) directly onto the selected `CAPAReport.rcaData` or `Risk` document[cite: 1].
  - [x] In `useOfflineSync.ts`, removed the destructive queue-drain behavior; queued legacy mutations are retained and reported as unavailable rather than falsely marked synced, while Firestore's native IndexedDB persistence handles SDK writes[cite: 1].

### 3.4 Replace Synthetic Analytics & Fix Workflow Automation Mutations
- **Target Files:**
  - `src/pages/QualityInsightsPage.tsx`, `src/services/qualityOutcomeIntelligenceService.ts`[cite: 1]
  - `src/components/monitoring/MonitoringDashboard.tsx`[cite: 1]
  - `src/pages/WorkflowAutomationPage.tsx`, `src/services/workflowEngine.ts`[cite: 1]
  - `src/services/reportDataEngine.ts`[cite: 1]
- **Observed Flaws:**
  - `QualityInsightsPage.tsx` renders random sparklines and fixed Jan–Jun synthetic trend data; `qualityOutcomeIntelligenceService.ts` stores monthly snapshots in `localStorage` without scoping by `organizationId`[cite: 1].
  - `MonitoringDashboard.tsx` uses random numbers for service health[cite: 1].
  - `WorkflowAutomationPage.tsx` edits existing workflows by calling `addWorkflow(existingId)`, resetting `status` to `'draft'`, `createdAt`, and `executionCount` to `0`[cite: 1]. `workflowEngine.ts` treats `change_status` and `add_comment` as intent logs rather than performing updates[cite: 1].
  - `reportDataEngine.ts` returns `[]` for `quality_rounds` and defines `percentage` aggregation as non-empty field fraction[cite: 1].
- **Remediation Steps:**
  - [x] Namespace `accreditex_quality_outcome_monthly_snapshots` by `organizationId` and bind `QualityInsightsPage.tsx` charts to real historical snapshots[cite: 1].
  - [x] Replace random health numbers in `MonitoringDashboard.tsx` with real latency/status probes (`aiAgentService.healthCheck()`, Firestore ping, Cloudinary verifier)[cite: 1].
  - [x] In `WorkflowAutomationPage.tsx`, route edits through `updateWorkflow(id, updates)` to preserve `status`, `createdAt`, and `executionCount`[cite: 1].
  - [x] In `workflowEngine.ts`, connect `change_status`, `assign_user`, `add_comment`, and `create_capa` to real store/service mutations[cite: 1].
  - [x] In `reportDataEngine.ts`, populate `quality_rounds` from `qualityRoundingService` and add a `compliance_rate` aggregation[cite: 1].

---

## Phase 4: Lab Operations Scalability & Clinical Accuracy (P1 — Lab Core)

### 4.1 Graduate `labOpsRecords` Subcollection Storage for High-Volume Labs
- **Target Files:**
  - `src/stores/useLabOpsStore.ts`, `src/services/labOpsService.ts`, `src/services/labOpsRecords.ts`[cite: 1]
  - `scripts/migrations/lab-operations-records.cjs`, `vite.config.ts`, `firestore.rules`[cite: 1]
- **Observed Limitation:**
  - `vite.config.ts` forces `VITE_LAB_RECORD_STORAGE` to `false` in production builds, keeping all 12 lab arrays inside a single `labOpsData/{org}` document capped at 900KB[cite: 1]. Continuous daily logging of `iqcResults`, `reagentUsageLogs`, `calibrations`, and `maintenanceLogs` will eventually exceed Firestore's 1MB document limit[cite: 1].
- **Remediation Steps:**
  - [ ] Replace the build-time `VITE_LAB_RECORD_STORAGE` production override with per-tenant runtime detection: on `loadFromFirestore(orgId)`, check if `labOpsRecords/{orgId}` exists with `ready === true`[cite: 1].
  - [ ] If `labOpsRecords/{orgId}.ready === true`, automatically operate in transactional record/subcollection mode (`src/services/labOpsRecords.ts`); otherwise operate in aggregate mode (`labOpsData/{orgId}`)[cite: 1].
  - [ ] Expose a guarded Admin migration utility (wrapping `scripts/migrations/lab-operations-records.cjs`) to transition existing tenants from `labOpsData` to `labOpsRecords`[cite: 1].

### 4.2 Make IQC Rejection Side-Effects Atomic & Fix Westgard Import Logic
- **Target Files:**
  - `src/components/lab-ops/IQCWestgardTab.tsx`, `src/stores/useLabOpsStore.ts`[cite: 1]
  - `src/services/qcDataImportService.ts`, `src/components/data-hub/QCDataImportTab.tsx`[cite: 1]
- **Observed Flaws:**
  - In `IQCWestgardTab.tsx`, a rejected IQC run triggers risk creation (`score: 20, critical`), CAPA creation (`due +7d`), reagent lot quarantine (`under_investigation`), and optional `QualityEvent` creation *before* awaiting the IQC result save, with several calls unawaited and no rollback on failure[cite: 1].
  - In `qcDataImportService.ts`, the Westgard rule check evaluates `1-2s` ($\vert{}z\vert{} > 2$) early in an `else if` chain, making `2-2s` and `R-4s` unreachable[cite: 1].
  - In `QCDataImportTab.tsx`, clicking "Confirm" only calls local `setAllImported(records)` without writing to `useLabOpsStore`[cite: 1].
- **Remediation Steps:**
  - [x] Encapsulate rejected IQC logging and its coupled side-effects (reagent quarantine, lab risk, lab CAPA, quality event, and linked IDs) inside a single store action `useLabOpsStore.logIQCResultWithSideEffects()` so state updates and persistence happen atomically[cite: 1].
  - [x] Replace the custom Westgard `else if` block in `qcDataImportService.ts` with `applyWestgardRules` from `src/types/labOps.ts`[cite: 1].
  - [x] Wire `QCDataImportTab.tsx` confirmation to persist imported `IQCResult` records into `useLabOpsStore`[cite: 1].

### 4.3 Correct `NEWS2` SpO2 Scale 2 Clinical Thresholds
- **Target File:** `src/components/clinical/EwsScoreModal.tsx`[cite: 1]
- **Observed Flaw:**
  - `NEWS2` Scale 2 (hypercapnic respiratory failure) uses simplified thresholds (`<=83:3, <=85:2, <=87:1, >=93 onO2:3, else 0`), omitting intermediate oxygen-supplemented scores (`93–94 on O2 = 1`, `95–96 on O2 = 2`, `>=97 on O2 = 3`)[cite: 1].
- **Remediation Steps:**
  - [x] Update `EwsScoreModal.tsx` Scale 2 scoring to match the Royal College of Physicians NEWS2 chart (`<=83: 3`, `84–85: 2`, `86–87: 1`, `88–92: 0`, `>=93 on room air: 0`, `93–94 on O2: 1`, `95–96 on O2: 2`, `>=97 on O2: 3`) and add unit coverage in `src/test/EwsScoreModal.test.ts`[cite: 1].

---

## Phase 5: AI Agent & LLM Pipeline Hardening (P2 — AI Reliability)

### 5.1 Unify Chat Streaming, Rate Limiting & Specialist Routing
- **Target Files:**
  - `ai-agent/deployment_package/main.py`, `ai-agent/deployment_package/unified_accreditex_agent.py`[cite: 1]
  - `ai-agent/deployment_package/agents/base_agent.py`, `ai-agent/deployment_package/agent_utils.py`[cite: 1]
  - `src/services/aiAgentService.ts`[cite: 1]
- **Observed Flaws:**
  - Rich chat requests (`current_data` present) routed to specialists via `route_to_specialist` bypass `BaseAgent` input sanitization, per-user rate limiting (`10 req / 60s`), and conversation history trimming (`history` grows unbounded in memory without being sent to the specialist)[cite: 1].
  - If a specialist stream fails after yielding partial tokens and falls back to legacy chat, partial specialist output and fallback text concatenate in the client stream, and yielded failure markers (`[ACCREDITEX_RESPONSE_FAILED]`) are counted as successes[cite: 1].
  - `POST /assess-risk` (`main.py`, line 590) returns a hardcoded placeholder `"risk_level": "Calculated"` instead of computing the risk level[cite: 1].
  - `aiAgentService.ts` parses SSE `data: ` lines without a cross-chunk partial-line buffer while `main.py` streams raw `text/plain`[cite: 1].
- **Remediation Steps:**
  - [ ] Run `agent_utils` input sanitization and `BaseAgent` per-user rate limiting at the top of `unified_accreditex_agent.chat()` before branching to `route_to_specialist`[cite: 1].
  - [ ] Trim thread history (`system + last 6 messages`) and enforce TTL eviction across all chat paths[cite: 1].
  - [ ] Buffer or validate model availability prior to yielding the first stream chunk; if a stream fails mid-flight, emit a clean terminal error marker without concatenating a second full fallback response, and increment the failure counter in `monitoring.py`[cite: 1].
  - [ ] Compute the actual risk level in `POST /assess-risk` via `RiskAssessmentAgent`[cite: 1].
  - [ ] Add a proper cross-chunk line buffer in `aiAgentService.ts`[cite: 1].

### 5.2 Resolve Python Version Conflict, Provider Defaults & Pytest Drift
- **Target Files:**
  - `ai-agent/deployment_package/render.yaml`, `ai-agent/deployment_package/runtime.txt`[cite: 1]
  - `ai-agent/deployment_package/unified_accreditex_agent.py`[cite: 1]
  - `ai-agent/deployment_package/tests/*`[cite: 1]
- **Observed Flaws:**
  - `render.yaml` sets `PYTHON_VERSION: 3.11` while `runtime.txt` specifies `python-3.13`[cite: 1].
  - OpenAI-only mode (`OPENAI_API_KEY` set without `GROQ_API_KEY`) defaults to Groq model identifiers (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`) unless overridden[cite: 1].
  - Several tests in `ai-agent/deployment_package/tests/` reference legacy Llama model names, `_get_system_prompt` (renamed to `_get_base_system_prompt`), and unnamespaced thread keys[cite: 1].
- **Remediation Steps:**
  - [ ] Standardize `render.yaml` and `runtime.txt` on the same Python version (`3.11`)[cite: 1].
  - [ ] Set provider-aware default model IDs when initializing the OpenAI client vs. the Groq client in `unified_accreditex_agent.py`[cite: 1].
  - [ ] Update the 13 pytest test suites in `ai-agent/deployment_package/tests/` to match current method names, `org:user:thread` keys, and model defaults, and add a GitHub Actions job to run `pytest` on pull requests[cite: 1].

---

## Phase 6: Integrations, PWA, Native Shell & Localization (P2/P3)

### 6.1 Fix HIS / LIMS Connector Bugs & Gate Unfinished Syncs
- **Target Files:**
  - `src/services/hisIntegration/connectors/HL7Connector.ts`[cite: 1]
  - `src/services/hisIntegration/DataMappingService.ts`[cite: 1]
  - `src/services/hisIntegration/AnalyticsService.ts`[cite: 1]
  - `src/services/hisIntegration/integrations/ConnectorFactory.ts`[cite: 1]
  - `src/services/hisIntegration/HISDataSyncService.ts`, `src/services/limsIntegration/LIMSDataSyncService.ts`[cite: 1]
- **Remediation Steps:**
  - [x] **`HL7Connector.ts`:** Pass a relative endpoint (`""` or `"/hl7"`) to the connector request method so the URL is not duplicated (`baseUrl + baseUrl`)[cite: 1].
  - [x] **`DataMappingService.ts`:** Fix the direction filter so mappings configured with `direction: 'both'` match both `'pull'` and `'push'` sync runs[cite: 1].
  - [x] **`AnalyticsService.ts`:** Remove the extra `/ 100` division in `calculateOverallHealth` so health scores render on a `0–100` scale instead of `0–1`[cite: 1].
  - [x] **`LIMSDataSyncService.ts`:** Invalidate the cached connector instance when a configuration is updated, ensure `disconnect()` runs in a `finally` block, and clearly badge HIS/LIMS sync panels as **Sandbox / Preview** until hospital middleware is connected[cite: 1].

### 6.2 Fix Service Worker Cache Mismatch & Capacitor Push Routing
- **Target Files:**
  - `public/service-worker.js`, `index.html`[cite: 1]
  - `src/hooks/usePushNotifications.ts`[cite: 1]
- **Observed Flaws:**
  - `public/service-worker.js` caches under `accreditex-v3`, whereas `index.html` deletes all caches except `accreditex-cache-v4` on window load[cite: 1].
  - `usePushNotifications.ts` leaves FCM token persistence as a `TODO` and navigates using legacy hash routes (`#/audit-hub`, `#/document-control`) instead of BrowserRouter paths (`/audit`, `/documents`)[cite: 1].
- **Remediation Steps:**
  - [x] Align the cache constant in `public/service-worker.js` and `index.html` to `accreditex-cache-v4`[cite: 1].
  - [x] Persist the FCM token in `usePushNotifications.ts` to `users/{uid}/sessions/{id}` and update notification tap routing to use `/audit`, `/documents`, and `/projects/:projectId`[cite: 1].

### 6.3 Complete Bilingual (`en`/`ar`) Localization & Safe Property Access
- **Target Files:**
  - `src/utils/localization.ts`[cite: 1]
  - `src/pages/PricingPage.tsx`, `src/pages/DataHubPage.tsx`[cite: 1]
  - `src/components/ai/AIActionCard.tsx`, `src/components/clinical/EwsScoreModal.tsx`, `src/components/training/SmcsCompetencyTrackerTab.tsx`, `src/components/notifications/NotificationCenter.tsx`, `src/components/documents/DocumentEditorModal.tsx`[cite: 1]
  - `src/data/locales/en/*`, `src/data/locales/ar/*`[cite: 1]
- **Remediation Steps:**
  - [ ] Add a null-safe helper `getLocalizedValue(field: LocalizedString | string | undefined, lang: Language)` in `src/utils/localization.ts` that falls back gracefully (`field?.[lang] || field?.en || field?.ar || ''`)[cite: 1].
  - [ ] Replace direct `doc.name[lang]` / `doc.name.en` property accesses in `DocumentEditorModal.tsx` and document tables with `getLocalizedValue`[cite: 1].
  - [ ] Move remaining hardcoded English strings in `PricingPage`, `DataHubPage`, `AIActionCard`, `EwsScoreModal`, `SmcsCompetencyTrackerTab`, and `NotificationCenter` into `src/data/locales/{en,ar}/`[cite: 1].

---

## 07. Verification & Release Checklist

Before deploying each phase to Firebase Hosting (`accreditex-79c08`), Cloud Functions, and Render[cite: 1]:

```bash
# 1. Frontend TypeScript & Unit Verification
npx tsc --noEmit
npm test -- --watchAll=false

# 2. Firestore & Storage Security Rules Verification
npm run test:firestore

# 3. End-to-End Playwright Suite
npm run test:e2e

# 4. Python AI Backend Verification
cd ai-agent/deployment_package
pytest -v --cov=. --cov-report=term-missing
```