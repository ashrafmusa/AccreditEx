# Accreditation Gap Register (Product & TQM)

**Domain:** Product & TQM  
**Date:** February 14, 2026  
**Scoring:** Impact (H/M/L), Effort (H/M/L), Priority (P1/P2/P3)

---

## Gap List

| ID | Gap | Why It Matters | Impact | Effort | Priority | Status | Owner Domain | Proposed Action |
|---|---|---|---|---|---|---|---|
| PTQM-001 | No explicit enterprise evidence policy across CAPA/PDCA/Audit/Docs | Weak chain-of-custody can reduce assessor confidence | High | Medium | P1 | Completed (Phase 3 - Non-Blocking Policy Engine) | Product + Backend | Define mandatory evidence schema and closure checks |
| PTQM-002 | Readiness score not explicitly tied to critical standard groups | Executive status may look good while critical controls lag | High | Medium | P1 | Completed (Phase 1) | Product + Analytics | Build weighted readiness model by criticality domain |
| PTQM-003 | Cross-standard control mapping is limited | Duplicate work across JCI/CBAHI/ISO increases effort | High | High | P2 | Completed (Phase 1 + Phase 2 Reuse Linkage) | Product + Data | Create control crosswalk and reusable evidence mapping |
| PTQM-004 | Advanced report packaging for assessor workflows is limited | Audit prep remains partially manual | Medium | Medium | P2 | Completed (Assessor Pack Export Templates) | Product + Documents | Add assessor-ready report/evidence bundle templates |
| PTQM-005 | Discoverability of advanced quality tools can be inconsistent | Underuse of high-value features slows outcomes | Medium | Low | P1 | Completed (Admin Dashboard Quick Actions) | Product + Frontend | Surface contextual prompts and dashboard quick actions |
| PTQM-006 | Recurrence/effectiveness analytics for CAPA not strongly surfaced | Difficult to prove sustained improvement over time | High | Medium | P1 | Completed (Phase 1) | Product + Quality Insights | Add recurrence trend + CAPA effectiveness dashboard widgets |
| PTQM-007 | Standards change-management governance not explicit in product workflow | Criteria drift may create hidden compliance lag | High | Medium | P1 | Completed (Baseline + Drift + Exportable Audit Log) | Product + Data Governance | Establish standards update review cadence and impact alerts |
| PTQM-008 | Department-level quality accountability scorecards not fully formalized | Leadership visibility can be fragmented | Medium | Medium | P2 | Completed (Department Accountability Scorecards) | Product + Departments | Add department readiness and overdue action scorecards |
| PTQM-009 | Closure gates for critical findings can be bypassed by process variance | High-risk findings may close with incomplete evidence | High | Medium | P1 | Completed (Safe + Strict Mode) | Backend + QA | Enforce closure validation rules with auditable exceptions |
| PTQM-010 | Onboarding for quality workflows relies on prior training | Initial value realization can be delayed | Medium | Low | P2 | Completed (First Cycle Guided Flow) | Product + UX | Add in-app guided flow for first accreditation cycle |

---

## Immediate P1 Action Bundle

1. **Evidence Governance Baseline**
   - Minimum required metadata fields for each artifact type.
   - Mandatory link rules: finding → action → verification → closure evidence.

2. **Critical-Control Readiness Model**
   - Weighted score by standard criticality and unresolved high-risk findings.
   - Separate score for “documentation completeness” vs “operational effectiveness”.

3. **Closure Validation Rules**
   - Prevent closure when required evidence/owner/verification fields are missing.
   - Permit exception path with mandatory reason + approver + timestamp.

4. **CAPA Effectiveness Analytics**
   - Recurrence rate, reopen rate, and time-to-verified-effectiveness.

5. **Standards Change Governance**
   - Quarterly standards refresh cycle with impact flags on affected controls/projects.

---

## Implemented in Current Sprint (Non-Breaking)

1. **Readiness and Evidence Metrics Service**
   - Added `src/services/tqmReadinessService.ts` with:
     - CAPA completeness scoring
     - Evidence integrity index
     - Portfolio readiness score

2. **Quality Insights Readiness Visibility**
   - Updated `src/pages/QualityInsightsPage.tsx` to show:
     - Readiness Score
     - Evidence Integrity Index
     - CAPA Effectiveness
     - Critical Open Findings

3. **CAPA Governance Guidance**
   - Updated `src/components/risk/CAPADetailsModal.tsx` with non-blocking completeness panel.

4. **Optional Strict Closure Validation (Default Off)**
   - Updated `src/services/projectService.ts`.
   - Added feature flag: `VITE_STRICT_CAPA_CLOSURE_VALIDATION=true` to enforce closure checks.
   - Default behavior unchanged to avoid functional regression.

5. **Auditable Closure Exception Path**
   - Added optional CAPA `closureException` fields (`reason`, `approvedBy`, `approvedAt`) in `src/types/index.ts`.
   - Strict closure mode now allows approved exceptions with audit metadata instead of silent bypass.

6. **PDCA Stage Accuracy Fix**
   - Fixed PDCA filtering in `src/stores/useProjectStore.ts` (`currentStage` instead of invalid `status`).
   - Prevents misleading stage-based metrics and improves TQM dashboard accuracy.

7. **Explicit Evidence Policy Engine (PTQM-001)**
   - Extended `src/services/tqmReadinessService.ts` with explicit policy checks for:
     - CAPA completeness
     - PDCA cycle completeness
     - Controlled document completeness
   - Updated `QualityInsightsPage` readiness calculation to include controlled documents evidence quality.

8. **Standards Change Governance Tracking (PTQM-007)**
   - Added `src/services/standardsGovernanceService.ts` for per-program baseline and drift detection.
   - Added standards governance panel in `src/pages/StandardsPage.tsx` with:
     - Set/Refresh Baseline action
     - Drift status visualization
     - Baseline timestamp
   - Added tests in `src/services/__tests__/standardsGovernanceService.test.ts`.

9. **Governance Audit Log Export (PTQM-007 Completion)**
   - Added timestamped baseline change log entries (`baseline_set`, `baseline_refreshed`, `baseline_cleared`).
   - Added export function for governance logs as JSON payload.
   - Added Standards page admin action: **Export Governance Log**.

10. **Advanced Tool Discoverability (PTQM-005 Completion)**
   - Added **Quality Quick Actions** panel in `src/components/dashboard/AdminDashboard.tsx`.
   - Added direct entry points for: Quality Insights, Audit Hub, Standards, and Document Control.

11. **Department Accountability Scorecards (PTQM-008 Completion)**
   - Updated `src/pages/DepartmentDetailPage.tsx` with formal department quality scorecards:
     - Department Readiness
     - Overdue Actions
     - Open CAPA (Department)
     - Open Critical Risks
   - Updated `src/components/common/MainRouter.tsx` to pass `risks` into department details for accountability visibility.

12. **Cross-Standard Control Mapping (PTQM-003 Phase 1)**
   - Added `src/services/crossStandardMappingService.ts` to derive reusable cross-program control groups.
   - Added `src/services/__tests__/crossStandardMappingService.test.ts` for mapping coverage and overlap logic.
   - Updated `src/pages/StandardsPage.tsx` with a non-blocking **Cross-Standard Control Mapping** preview panel.
   - Updated `src/components/common/MainRouter.tsx` to pass full standards/program context into Standards page.

13. **Cross-Standard Reuse Linkage (PTQM-003 Phase 2 Completion)**
   - Extended `src/services/crossStandardMappingService.ts` with:
     - Related crosswalk standard lookup per checklist standard
     - Reusable evidence suggestion scoring
   - Updated `src/components/projects/ChecklistItemComponent.tsx` to show reusable evidence suggestions with one-click attach.
   - CAPA creation now includes cross-standard reference context where available.

14. **Assessor-Ready Report Packaging (PTQM-004 Completion)**
   - Added `src/services/assessorReportPackService.ts` to generate assessor-ready pack templates.
   - Added `src/services/__tests__/assessorReportPackService.test.ts`.
   - Updated `src/components/documents/GenerateReportModal.tsx` with **Assessor Evidence Pack (JSON + CSV)** option.
   - Updated `src/pages/ProjectDetailPage.tsx` to export:
     - structured assessor pack JSON
     - evidence matrix CSV

15. **Guided First Accreditation Cycle (PTQM-010 Completion)**
   - Updated `src/components/dashboard/AdminDashboard.tsx` with a persistent in-app **First Accreditation Cycle Guide** panel.
   - Added step-by-step guided actions to Standards, Project Creation, Evidence Control, Audit Hub, and Quality Insights.
   - Added local progress tracking and dismiss controls (localStorage-backed).

16. **Assessor Pack Export Audit Trail (Post-Closure Hardening)**
   - Extended `src/services/assessorReportPackService.ts` with export audit logging and retrieval utilities.
   - Updated `src/pages/ProjectDetailPage.tsx` to record assessor pack export events.
   - Added audit trail tests in `src/services/__tests__/assessorReportPackService.test.ts`.

16. **Automated Validation Tests**
   - Added `src/services/__tests__/tqmReadinessService.test.ts`.
   - Verifies readiness and completeness computations.

---

## Closure Verification (Latest)

- Targeted tests passed:
   - `npm test -- assessorReportPackService crossStandardMappingService tqmReadinessService`
   - Result: 3 suites passed, 12 tests passed.
- Production build passed:
  - `npm run build`
  - Result: build successful, no compile regressions.
- Known non-blocking items:
  - Vite chunk-size warnings (optimization only)
  - `baseline-browser-mapping` update advisory

---

## Next Execution Queue (Post-Closure)

1. **Performance Hardening (Low Risk)**
   - Split `BulkUserImport` payload and remaining large chunks with route-level lazy boundaries.
   - Re-run build and compare chunk deltas.

2. **Operational Governance Hardening**
   - Add assessor-pack export audit trail entry (who exported, when, project) to governance logs.
   - Add optional reviewer sign-off metadata before assessor pack export.

3. **Adoption and Outcome Measurement**
   - Track completion rate of First Accreditation Cycle guide and correlate with readiness score improvements.
   - Add monthly quality adoption KPI to Admin dashboard.

---

## Acceptance Criteria for Product & TQM Domain Closure

- P1 gaps have implementation stories and owners.
- Evidence policy is codified and referenced in release quality gates.
- Readiness score reflects critical control reality, not only aggregate completion.
- CAPA/PDCA effectiveness metrics are visible at project and leadership levels.
- Standards update workflow is operational and auditable.

