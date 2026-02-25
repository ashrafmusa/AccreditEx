# AccreditEx — Pending Features & Tasks Register

> **Date:** February 19, 2026
> **Updated:** February 19, 2026 (Post-implementation cross-check)
> **Version:** 1.1
> **Source:** Consolidated from all 27+ project documents
> **Total Items:** 82
> **Completed This Sprint:** 16 (7 already done, 9 newly implemented)
> **Classification:** Internal — Development Planning

---

## Implementation Summary (v1.1 Update)

A full cross-check against the actual codebase was performed before implementation.
Results: **7 items were already implemented**, **2 partially done** (completed), **7 truly pending** (implemented).

### Items Already Implemented (Cross-Check Discovered)
| ID | Item | Evidence |
|----|------|----------|
| S-4 | CORS wildcard removed | `allow_origins` has specific domains in `main.py` L72-80 |
| S-5 | API key auth added | `APIKeyHeader` + `verify_api_key()` in `main.py` L83-93 |
| U-1 | Arrow keyboard navigation | `useArrowNavigation.ts` (88 lines), used in `NavigationRail.tsx` |
| U-2 | ARIA attributes | Full `aria-label`, `aria-current`, `aria-expanded` in both nav components |
| U-3 | Focus trap (MobileSidebar) | Tab/Shift+Tab cycling in `MobileSidebar.tsx` L64-100 |
| U-4 | Escape key (MobileSidebar) | `handleEscapeKey` in `MobileSidebar.tsx` L87-90 |
| U-7 | Loading states | `Suspense` + `LoadingScreen` in `AppRouter.tsx` |
| A-18 | checkCompliance wiring | `ChecklistItemComponent.tsx` uses `aiAgentService.chat()` with compliance prompts |

### Items Implemented This Sprint
| ID | Item | Files Created/Modified |
|----|------|----------------------|
| S-7 | Centralized PermissionService | `src/services/permissionService.ts`, `src/hooks/usePermission.ts` |
| S-10/C-1 | Viewer role enforcement | Integrated via PermissionService + usePermission hook |
| U-5 | Route prefetching | `src/services/routePrefetchService.ts`, `NavigationRail.tsx`, `MobileSidebar.tsx` |
| U-6 | Breadcrumbs in Layout | `src/hooks/useBreadcrumbs.ts`, `Layout.tsx` wired with `<Breadcrumbs>` |
| U-8 | Unsaved changes warning | `src/hooks/useUnsavedChanges.ts`, `src/hooks/useBeforeUnload.ts`, 8 settings pages + DocumentEditorModal |
| A-17 | getTrainingRecommendations wired | `LearningPathsTab.tsx` — AI Recommendations button + panel |
| T-5 | Analytics event tracking | `src/services/analyticsTrackingService.ts`, `MainRouter.tsx`, `useUserStore.ts` |
| I-2 | Clean __pycache__ artifacts | Removed 4 `__pycache__` directories (14+ .pyc files) |

---

## Executive Summary

| Category | Total | Completed | Remaining | Critical/P0 | P1/High | P2/Medium | P3+/Backlog |
|----------|------:|:---------:|:---------:|:-----------:|:-------:|:---------:|:-----------:|
| Security | 10 | 4 | 6 | 2 | 1 | 1 | 2 |
| AI / Backend | 20 | 2 | 18 | 0 | 6 | 10 | 2 |
| Feature | 17 | 0 | 17 | 0 | 2 | 3 | 12 |
| UX / Accessibility | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| Testing | 6 | 1 | 5 | 0 | 1 | 0 | 4 |
| Infrastructure / Ops | 8 | 1 | 7 | 0 | 0 | 1 | 6 |
| Compliance | 5 | 1 | 4 | 0 | 0 | 1 | 3 |
| Documentation | 3 | 0 | 3 | 0 | 0 | 2 | 1 |
| Strategic / Market | 5 | 0 | 5 | 0 | 2 | 0 | 3 |
| **TOTAL** | **82** | **17** | **65** | **2** | **12** | **18** | **33** |

---

## 🚨 Top 5 Immediate Actions

| # | Item | Category | Source |
|---|------|----------|--------|
| 1 | Rotate Firebase service account key (exposed in git) | Security — CRITICAL | `RBAC_SECURITY_AUDIT_2026.md` |
| 2 | Purge secrets from git history (BFG / git filter-repo) | Security — CRITICAL | `RBAC_SECURITY_CHANGELOG.md` |
| 3 | ~~Remove wildcard CORS (`allow_origins=["*"]`) from AI Agent~~ | Security — High | ✅ Already done |
| 4 | ~~Add API authentication (API key / JWT) to AI Agent endpoints~~ | Security — High | ✅ Already done |
| 5 | Execute RBAC testing checklist (12 unchecked test cases) | Testing — High | `RBAC_SECURITY_CHANGELOG.md` |

---

## 🔴 1. Security (10 items)

### Critical / P0

| ID | Task | Source | Timeline |
|----|------|--------|----------|
| S-1 | **Rotate exposed Firebase service account key** — `serviceAccountKey.json` committed to git history. Generate new key in Firebase Console → revoke old key → update Render env vars | `RBAC_SECURITY_AUDIT_2026.md` | Immediate |
| S-2 | **Purge secrets from git history** — Remove `serviceAccountKey.json`, `.env`, `.env.development`, `.env.production` using BFG Repo-Cleaner or `git filter-repo`. Force-push cleaned history | `RBAC_SECURITY_CHANGELOG.md` | Immediate |

### P1 / High

| ID | Task | Source | Timeline |
|----|------|--------|----------|
| S-3 | **Set Firebase Custom Claims** — Use Cloud Functions or Admin SDK to set `{ role: 'Admin' }` on user tokens for faster/more reliable role checks than Firestore lookup | `RBAC_SECURITY_CHANGELOG.md` | Next sprint |
| S-4 | ~~**Remove wildcard CORS from AI Agent**~~ — ✅ Already implemented: `allow_origins` has specific domains in `main.py` | `AI_AGENT_AUDIT_REPORT.md` | ✅ Done |
| S-5 | ~~**Add API Authentication to AI Agent**~~ — ✅ Already implemented: `APIKeyHeader` + `verify_api_key()` in `main.py` | `AI_AGENT_AUDIT_REPORT.md` | ✅ Done |

### P2 / Medium

| ID | Task | Source | Timeline |
|----|------|--------|----------|
| S-6 | **Add Rate Limiting** — Firebase App Check + Cloud Functions for user creation and sensitive operations | `RBAC_SECURITY_CHANGELOG.md` | Backlog |
| S-7 | ~~**Centralized Permission Service**~~ — ✅ Implemented: `permissionService.ts` + `usePermission.ts` hook with full RBAC matrix | `RBAC_SECURITY_CHANGELOG.md` | ✅ Done |
| S-8 | **Audit Trail Enhancement** — Move audit log creation to Cloud Functions (triggered by Firestore writes) to prevent client-side manipulation | `RBAC_SECURITY_CHANGELOG.md` | Future |

### P3 / Backlog

| ID | Task | Source | Timeline |
|----|------|--------|----------|
| S-9 | **Project update ownership** — Granular access control for project edits (M-2 finding) | `RBAC_SECURITY_AUDIT_2026.md` | Backlog |
| S-10 | ~~**Viewer role enforcement**~~ — ✅ Implemented: PermissionService enforces Viewer = read-only across all resources | `RBAC_SECURITY_AUDIT_2026.md` | ✅ Done |

---

## 🤖 2. AI / Backend (20 items)

### P1 / High — AI Integration Phases

| ID | Task | Phase | Source | Timeline |
|----|------|-------|--------|----------|
| A-1 | ~~**Smart Checklist Generation**~~ — ✅ Done: `handleAIEnhanceChecklist()` in `CreateProjectPage.tsx` — AI enriches deterministic checklist with action plans + risk levels (HIGH/MEDIUM/LOW) per item | Phase 1 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-2 | ~~**AI Compliance Gap Detector**~~ — ✅ Done: `handleAIGapAnalysis()` advisory modal + `handleAIFlagRisks()` structured risk flagging in `ProjectChecklist.tsx` — AI assigns CRITICAL/HIGH/MEDIUM risk tags and persists to item notes | Phase 2 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-3 | ~~**AI Notes/Findings Pre-fill**~~ — ✅ Done: `handleAIApplyNotes()` + `handleAIAuditNotes()` manual buttons + **auto-trigger banner** on status change to NonCompliant/PartiallyCompliant in `ChecklistItemComponent.tsx` — AI generates findings + action plan | Phase 2 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-4 | ~~**Per-Row AI Fill for Design Controls**~~ — ✅ Done: `handleAIFillRow(index)` + bulk compliance check in `DesignControlsComponent.tsx` | Phase 3 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-5 | ~~**AI CAPA Pre-fill**~~ — ✅ Done: AI pre-fill button in `CAPADetailsModal.tsx` fills rootCause, correctiveAction, preventiveAction via `aiAgentService.chat()` | Phase 5 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-6 | ~~**PDCA Stage Transition AI**~~ — ✅ Done: `handleAISuggestNotes()` calls `suggestPDCAImprovements()` in `PDCAStageTransitionForm.tsx` | Phase 5 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-7 | ~~**Finalization Readiness Check**~~ — ✅ Done: `handleReadinessCheck()` with full project data analysis in `ProjectDetailPage.tsx` | Phase 6 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |

### P2 / Medium — AI Integration Phases

| ID | Task | Phase | Source | Timeline |
|----|------|-------|--------|----------|
| A-8 | ~~**Project Scope AI**~~ — ✅ Done: `handleAIGenerateDescription()` + `handleAIGenerateTimeline()` in `CreateProjectPage.tsx` — AI suggests description and start/end dates | Phase 1 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-9 | ~~**Smart Evidence Matching**~~ — ✅ Done: `handleAISmartEvidence()` with semantic + keyword matching in `ChecklistItemComponent.tsx` | Phase 2 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-10 | ~~**AI Status Suggestions**~~ — ✅ Done: `handleAISuggestStatus()` in `ChecklistItemComponent.tsx` | Phase 2 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-11 | ~~**Document Linking Suggestions**~~ — ✅ Done: `handleAISuggestDocuments(rowIndex)` in `DesignControlsComponent.tsx` — AI recommends documents with apply/dismiss UI | Phase 3 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-12 | ~~**Survey AI Coach**~~ — ✅ Done: `handleAIHint()` + `handleSurveyBriefing()` in `SurveyComponent.tsx` | Phase 4 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-13 | ~~**Post-Survey Analysis**~~ — ✅ Done: `handleAIRiskAssessment()` + `assessSurveyRisk()` in `SurveyReportPage.tsx` | Phase 4 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-14 | ~~**New PDCA Cycle AI Setup**~~ — ✅ Done: `handleAISuggestCycle()` in `PDCACycleManager.tsx` — AI suggests title, description, category, priority | Phase 5 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-15 | ~~**Effectiveness Verification AI**~~ — ✅ Done: `handleAIEffectivenessReview()` in `CAPADetailsModal.tsx` — AI reviews CAPA effectiveness, recommends close/reopen | Phase 5 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-16 | ~~**AI Project Health Briefing**~~ — ✅ Done: `handleAIBriefing()` with full health scoring in `ProjectOverview.tsx` | Phase 6 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-17 | ~~**`getTrainingRecommendations()` integration**~~ — ✅ Implemented: AI Recommendations button + panel in LearningPathsTab with fallback to chat | Phase 2 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |
| A-18 | ~~**`checkCompliance()` integration**~~ — ✅ Already done: `ChecklistItemComponent.tsx` uses `aiAgentService.chat()` for compliance checks | Phase 2 | `PROJECTS_AI_INTEGRATION_AUDIT.md` | ✅ Done |

### AI Agent Infrastructure

| ID | Task | Source | Timeline |
|----|------|--------|----------|
| A-19 | ~~**AI Agent: Implement Rate Limiting**~~ — ✅ Done: `slowapi` integrated in `main.py` with per-endpoint limits (chat: 30/min, compliance: 20/min, risk: 20/min, training: 15/min, search: 30/min, upload: 10/min) | `AI_AGENT_AUDIT_REPORT.md` | ✅ Done |
| A-20 | **AI Agent: Redis Integration** — Replace in-memory conversation storage to prevent data loss on restart | `ENHANCEMENTS_SUMMARY.md` | Future (Infrastructure) |

---

## 🧩 3. Features (17 items)

### P2–P6 — Roadmap Features

| ID | Task | Priority | Source | Timeline |
|----|------|----------|--------|----------|
| F-1 | **Multi-Facility Benchmarking** (P2 #20) — Multi-tenant architecture required. Deferred | P2 | `COMPLIANCE_EVALUATION_AND_BENCHMARKING_2026.md` | Phase 2+ |
| F-2 | **HIS Integration Accelerator** — Finalize FHIR API, partner with HIS vendors (Cerner, Epic) | P4 | `PRODUCT_FEATURES_AUDIT_2026.md` | Q2 2026 |
| F-3 | **Advanced Reporting** — Custom report designer (drag-and-drop), scheduled email, PowerPoint export | P5 | `PRODUCT_FEATURES_AUDIT_2026.md` | Q2 2026 |
| F-4 | **Mobile Native App** — React Native iOS/Android with offline mode, push notifications | P6 | `PRODUCT_FEATURES_AUDIT_2026.md` | Q2 2026 |
| F-5 | **Workflow Automation Platform** — Visual workflow builder (no-code), conditional logic, approval routing | P8 | `PRODUCT_FEATURES_AUDIT_2026.md` | Q3-Q4 2026 |
| F-6 | **Multi-Language Expansion** — French (North Africa), Spanish, Turkish, Urdu | P9 | `PRODUCT_FEATURES_AUDIT_2026.md` | Q3-Q4 2026 |
| F-7 | **AI Chatbot Assistant** — Natural language query interface, voice-to-text Arabic | P10 | `PRODUCT_FEATURES_AUDIT_2026.md` | 2026-2027 |

### SHOULD HAVE — Backlog

| ID | Task | Source | Timeline |
|----|------|--------|----------|
| F-8 | **Formal change request workflows** (ECR/ECN for regulated environments) | `COMPLIANCE_EVALUATION_AND_BENCHMARKING_2026.md` | Backlog |
| F-9 | **Improvement project categorization & portfolio tracking** | `COMPLIANCE_EVALUATION_AND_BENCHMARKING_2026.md` | Backlog |
| F-10 | **Annual QAPI assessment reporting tool** | `COMPLIANCE_EVALUATION_AND_BENCHMARKING_2026.md` | Backlog |
| F-11 | **Goal-setting and tracking for staff development** | `COMPLIANCE_EVALUATION_AND_BENCHMARKING_2026.md` | Backlog |
| F-12 | **Automated retention enforcement** (archival/purge workflow for document expiry) | `COMPLIANCE_EVALUATION_AND_BENCHMARKING_2026.md` | Backlog |
| F-13 | **FHIR-based EHR/HIS integration** — Prioritize Malaffi (UAE HIE) for GCC differentiation | `COMPETITIVE_BENCHMARKING_2026.md` | Roadmap |

### COULD HAVE — Long-term

| ID | Task | Source | Timeline |
|----|------|--------|----------|
| F-14 | **Discussion/Q&A forum** for accreditation topics | `COMPLIANCE_EVALUATION_AND_BENCHMARKING_2026.md` | Backlog |
| F-15 | **Clinical records integration via HIS bridge** | `COMPLIANCE_EVALUATION_AND_BENCHMARKING_2026.md` | Long-term |
| F-16 | **Mobile-specific rounding view optimization** (PWA enhancement) | `COMPLIANCE_EVALUATION_AND_BENCHMARKING_2026.md` | Backlog |
| F-17 | **Drag-and-drop widget rearrangement** for dashboards | `DASHBOARD_ENHANCEMENT_PLAN.md` | Future |

---

## ♿ 4. UX / Accessibility (8 items)

### Deferred to Q2 2026 — Accessibility Sprint

| ID | Task | Source | Timeline |
|----|------|--------|----------|
| U-1 | ~~**Keyboard Navigation (`useArrowNavigation`)**~~ — ✅ Already implemented: hook imported and active in `NavigationRail.tsx` | `UI_UX_AUDIT_REPORT_2026.md` | ✅ Done |
| U-2 | ~~**ARIA Labels**~~ — ✅ Already implemented: Full `aria-label`, `aria-current`, `aria-expanded` in both nav components | `UI_UX_AUDIT_REPORT_2026.md` | ✅ Done |
| U-3 | ~~**Focus Trap in MobileSidebar**~~ — ✅ Already implemented: Tab/Shift+Tab cycling in MobileSidebar.tsx | `UI_UX_AUDIT_REPORT_2026.md` | ✅ Done |
| U-4 | ~~**Escape Key in MobileSidebar**~~ — ✅ Already implemented: handleEscapeKey in MobileSidebar.tsx | `UI_UX_AUDIT_REPORT_2026.md` | ✅ Done |

### Backlog — Navigation Enhancements

| ID | Task | Source | Timeline |
|----|------|--------|----------|
| U-5 | ~~**Route Prefetching**~~ — ✅ Implemented: `routePrefetchService.ts` with `onPointerEnter` on NavigationRail + MobileSidebar | `NAVIGATION_SYSTEM_AUDIT.md` | ✅ Done |
| U-6 | ~~**Breadcrumbs Component**~~ — ✅ Implemented: `useBreadcrumbs.ts` hook wired into Layout.tsx with contextual navigation | `NAVIGATION_SYSTEM_AUDIT.md` | ✅ Done |
| U-7 | ~~**Loading States**~~ — ✅ Already implemented: Suspense + LoadingScreen in AppRouter.tsx | `NAVIGATION_SYSTEM_AUDIT.md` | ✅ Done |
| U-8 | ~~**Unsaved Changes Warning**~~ — ✅ Implemented: `useBeforeUnload` hook in 8 settings pages + `beforeunload` in DocumentEditorModal | `NAVIGATION_SYSTEM_AUDIT.md` | ✅ Done |

---

## 🧪 5. Testing (6 items)

| ID | Task | Priority | Source | Timeline |
|----|------|----------|--------|----------|
| T-1 | **RBAC Testing Checklist** — 12 unchecked test cases: admin creates user, non-admin blocked, legacy migration, delete guards, Firestore rules, Custom Claims | P1 — High | `RBAC_SECURITY_CHANGELOG.md` | Next sprint |
| T-2 | **Feature Discovery Widget accessibility audit** | Backlog | `FEATURE_DISCOVERY_IMPLEMENTATION.md` | Backlog |
| T-3 | **Feature Discovery Widget cross-browser testing** | Backlog | `FEATURE_DISCOVERY_IMPLEMENTATION.md` | Backlog |
| T-4 | **Feature Discovery Widget RTL layout testing** (Arabic) | Backlog | `FEATURE_DISCOVERY_IMPLEMENTATION.md` | Backlog |
| T-5 | ~~**Analytics integration**~~ — ✅ Implemented: `analyticsTrackingService.ts` with Firebase Analytics, page view tracking in MainRouter, login tracking in useUserStore | Backlog | `FEATURE_DISCOVERY_IMPLEMENTATION.md` | ✅ Done |
| T-6 | **AI Agent: Zero test coverage** — No pytest tests, no CI/CD pipeline for backend | P2 | `AI_AGENT_AUDIT_REPORT.md` | Short-term |

---

## 🏗️ 6. Infrastructure / Operations (8 items)

| ID | Task | Priority | Source | Timeline |
|----|------|----------|--------|----------|
| I-1 | **AI Agent: CI/CD pipeline** — No automated build/test/deploy pipeline | P2 | `FINAL_SUMMARY.md` | Short-term |
| I-2 | ~~**AI Agent: Clean build artifacts**~~ — ✅ Done: Removed 4 `__pycache__` directories, 14+ .pyc files | Low | `AI_AGENT_AUDIT_REPORT.md` | ✅ Done |
| I-3 | **AI Agent: Redis caching** for production multi-instance deployment | Low | `FINAL_SUMMARY.md` | Future |
| I-4 | **AI Agent: Request tracing** with OpenTelemetry | Low | `FINAL_SUMMARY.md` | Future |
| I-5 | **AI Agent: Load testing** to validate scalability under concurrent users | Low | `FINAL_SUMMARY.md` | Future |
| I-6 | **AI Agent: Prometheus metrics export** for observability | Low | `FINAL_SUMMARY.md` | Future |
| I-7 | **AI Agent: Monitoring & Analytics** — Sentry error tracking, cloud logging integration | P3 | `AI_AGENT_AUDIT_REPORT.md` | Long-term |
| I-8 | **SOC 2 Type II certification** — Enterprise healthcare buyers increasingly require it | Medium | `COMPETITIVE_BENCHMARKING_2026.md` | 12 months |

---

## 📋 7. Compliance (5 items)

| ID | Task | Priority | Source | Timeline |
|----|------|----------|--------|----------|
| C-1 | ~~**OWASP A06 (Insecure Design)**~~ — ✅ Implemented: PermissionService with Viewer role enforcement + usePermission hook | P2 | `RBAC_SECURITY_AUDIT_2026.md` | ✅ Done |
| C-2 | **OWASP A09 (Logging & Monitoring)** — Audit log injection possible; move creation to server-side | P2 | `RBAC_SECURITY_AUDIT_2026.md` | Next sprint |
| C-3 | **ISO 45001, ISO 27001, HIMSS EMRAM** — Only partially supported standards | Low | `PRODUCT_FEATURES_AUDIT_2026.md` | Backlog |
| C-4 | **Formal multi-stage approval** for assessor packs — Reviewer sign-off exists; staged approvals are future enhancement | Low | `PRODUCT_TQM_DOMAIN_SWOT.md` | 31-60 days |
| C-5 | **Auto-suggested CAPA templates** from crosswalk/evidence reuse data | Low | `PRODUCT_TQM_DOMAIN_SWOT.md` | 31-60 days |

---

## 📖 8. Documentation (3 items)

| ID | Task | Priority | Source | Timeline |
|----|------|----------|--------|----------|
| D-1 | **Documentation consolidation** — `docs/README.md` references potentially missing files; strategic narrative spread across many files | Medium | `SWOT_ANALYSIS_REPORT_2026.md` | 0-30 days |
| D-2 | **Setup/environment onboarding guide** — No single guided path from clean machine to first run; relies on operator familiarity | Medium | `SWOT_ANALYSIS_REPORT_2026.md` | Backlog |
| D-3 | **Product audit CEO/Stakeholder sign-off** — v2.0 approval checkbox still unchecked | Low | `PRODUCT_FEATURES_AUDIT_2026.md` | Pending |

---

## 📊 9. Strategic / Market (5 items)

| ID | Task | Priority | Source | Timeline |
|----|------|----------|--------|----------|
| M-1 | **Brand recognition gap** — Accelerate via GCC pilots, ADGM HQ advantage, Arab Health/HIMSS conferences, thought leadership content | High | `COMPETITIVE_BENCHMARKING_2026.md` | Ongoing |
| M-2 | **Single-founder risk mitigation** — Advisory board, MBZUAI partnership, early hires, documented architecture | High | `COMPETITIVE_BENCHMARKING_2026.md` | Ongoing |
| M-3 | **US labs (CAP/CLIA) market entry** — ~250K facilities; requires US-specific regulatory enhancements | P3 | `COMPETITIVE_BENCHMARKING_2026.md` | Long-term |
| M-4 | **EU hospitals (ISO/national standards) market** — ~30K facilities; requires EU localization | P3 | `COMPETITIVE_BENCHMARKING_2026.md` | Long-term |
| M-5 | **Performance optimization backlog** — Deeper lazy-loading for editor/report bundles; long-window trend charts and benchmark targets | Continuous | `ACCREDITATION_GAP_REGISTER.md` | Ongoing |

---

## Suggested Sprint Planning

### Sprint Next (Immediate — Security Hardening)
| ID | Task | Status |
|----|------|--------|
| S-1 | Rotate Firebase service account key | ⏳ Pending |
| S-2 | Purge secrets from git history | ⏳ Pending |
| S-4 | ~~Remove wildcard CORS from AI Agent~~ | ✅ Already done |
| S-5 | ~~Add API authentication to AI Agent~~ | ✅ Already done |
| I-2 | ~~Clean AI Agent build artifacts~~ | ✅ Done |

### Sprint Q2-A (AI Integration Phase 1-2)
| ID | Task | Status |
|----|------|--------|
| S-3 | Set Firebase Custom Claims | ⏳ Pending |
| T-1 | Execute RBAC testing checklist | ⏳ Pending |
| A-1 | ~~Smart Checklist Generation~~ | ✅ Done |
| A-2 | ~~AI Compliance Gap Detector~~ | ✅ Done |
| A-3 | ~~AI Notes/Findings Pre-fill~~ | ✅ Done |
| A-17 | ~~Wire `getTrainingRecommendations()`~~ | ✅ Done |
| A-18 | ~~Wire `checkCompliance()`~~ | ✅ Already done |

### Sprint Q2-B (Accessibility + Testing)
| ID | Task | Status |
|----|------|--------|
| U-1 | ~~Keyboard navigation~~ | ✅ Already done |
| U-2 | ~~ARIA labels audit~~ | ✅ Already done |
| U-3 | ~~Focus trap in MobileSidebar~~ | ✅ Already done |
| U-4 | ~~Escape key in MobileSidebar~~ | ✅ Already done |
| T-6 | AI Agent test coverage | ⏳ Pending |
| I-1 | AI Agent CI/CD pipeline | ⏳ Pending |

### Sprint Q2-C (AI Integration Phase 3-6)
| ID | Task |
|----|------|
| A-4 | Per-Row AI Fill for Design Controls |
| A-5 | AI CAPA Pre-fill |
| A-6 | PDCA Stage Transition AI |
| A-7 | Finalization Readiness Check |
| A-12 | Survey AI Coach |

### Q3-Q4 2026 (Major Features)
| ID | Task |
|----|------|
| F-2 | HIS Integration Accelerator (FHIR) |
| F-3 | Advanced Reporting (drag-and-drop designer) |
| F-4 | Mobile Native App (React Native) |
| F-5 | Workflow Automation Platform |
| F-6 | Multi-Language Expansion |

---

## Document Control

| Field | Value |
|-------|-------|
| Created | February 19, 2026 |
| Updated | February 19, 2026 |
| Author | Automated Audit System |
| Sources | 27+ project documents |
| Cross-Check | All 16 implementable items verified against codebase |
| Items Completed | 16 (7 already done + 9 newly implemented) |
| Next Review | After Sprint Next completion |
| Status | Active |
