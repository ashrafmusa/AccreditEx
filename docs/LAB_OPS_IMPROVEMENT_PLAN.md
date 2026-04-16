# Lab Operations Improvement Plan

## 1. Purpose
Build a production-grade Lab Operations capability that is reliable, compliant, scalable, and easy for lab teams to use daily.

## 2. Current Baseline
- Functional tabs exist for Equipment, Maintenance, Reagents, QC Dashboard, Proficiency Testing, Quality Management, IQC Westgard, and Competency Matrix.
- Firestore-backed persistence exists for Lab Operations state.
- IQC competency gate exists and now has stronger matching for operator and analyte formats.
- Admin access control is enforced for Lab Operations routes and navigation.

## 3. Strategic Outcomes
1. Clinical safety first: prevent unauthorized QC result releases and reduce false negatives in competency validation.
2. Operational reliability: no silent data loss, clear sync status, robust retries, and stable behavior under load.
3. Quality intelligence: proactive risk signals, CAPA traceability, and actionable quality trends.
4. Audit readiness: complete traceability from event to risk to CAPA to closure.
5. Scale readiness: module remains responsive with larger datasets and multi-site usage.

## 4. Workstreams
### A. Access, Roles, and Governance
- Standardize role checks in all module entry points and actions.
- Add role-based action matrix per tab (view, create, update, close, approve).
- Add explicit unauthorized telemetry events.

### B. Data Reliability and Sync
- Add debounced write queue for high-frequency mutations.
- Add retry with exponential backoff for transient Firestore failures.
- Add sync state in store: idle, saving, synced, failed.
- Add conflict strategy for concurrent updates (last-write-wins plus warning).

### C. Competency and IQC Safety
- Improve competency matching and expiry handling.
- Add fast workflow from IQC block state to competency assignment.
- Add required-field prompts to reduce block friction.
- Add cross-check for analyte level and lab section alignment.

### D. Quality and Compliance Intelligence
- Expand auto-generated risk and CAPA linking from IQC and PT failures.
- Add severity-driven escalation thresholds.
- Add quality trend cards and alerts with section-level drill-down.
- Add exportable monthly quality packet for leadership review.

### E. User Experience and Productivity
- Add tab-level empty states with action paths.
- Add list/table filters, saved views, and quick actions.
- Add optimistic UI with clear pending/saved indicators.
- Add accessibility and keyboard navigation checks per tab.

### F. Testing and Release Quality
- Add unit coverage for matching, gating, status transitions, and derived KPIs.
- Add component tests for critical workflows in IQC and Quality Management.
- Add smoke E2E for admin access, save/reload persistence, and block-unblock path.
- Add pre-release checklist for data migration and rollback.

## 5. Phased Delivery Plan
## Phase 1: Stabilize Core (2 weeks)
- Implement sync state and resilient write queue.
- Add visible save/sync status indicator in Lab Operations page.
- Close remaining role/access edge cases.
- Expand competency gate tests and regression pack.

Definition of done
- No known silent save failures.
- Lab Operations shows real-time sync status.
- Test suite includes key competency and access regressions.

## Phase 2: Safety and Workflow Acceleration (2 to 3 weeks)
- Add IQC blocked-state resolution workflow.
- Add competency setup shortcut from IQC tab.
- Add stricter analyte-level and section-level authorization checks.
- Add improved PT to CAPA handoff templates.

Definition of done
- Median time to resolve IQC authorization blocks reduced by at least 40%.
- No false missing authorization when valid record exists.

## Phase 3: Quality Intelligence (2 weeks)
- Add trend and risk dashboard upgrades.
- Add escalation rules and SLA timers for open critical events.
- Add export package for quality meetings.

Definition of done
- Quality leaders can monitor open critical items and overdue CAPAs in one view.
- Monthly exports generated without manual spreadsheet consolidation.

## Phase 4: Scale and Hardening (2 weeks)
- Performance profiling with large data scenarios.
- Pagination and query optimization where needed.
- Add telemetry and alerting for error hotspots.
- Final audit-readiness walkthrough.

Definition of done
- Stable behavior with large datasets.
- Measured performance targets met.
- Operational runbook finalized.

## 6. KPI Targets
- Data save success rate: at least 99.9%.
- Unauthorized operation attempts blocked: 100%.
- IQC authorization false-missing rate: less than 0.5%.
- Mean time to resolve critical quality event: reduced by 30%.
- Overdue CAPA count: reduced by 40% over two release cycles.
- Module test coverage for core logic: at least 80%.

## 7. Risks and Mitigations
- Risk: Firestore write bursts during heavy usage.
  Mitigation: Debounce queue, batch strategy, retry policy.
- Risk: Workflow complexity for lab users.
  Mitigation: Guided actions, defaults, and clearer messaging.
- Risk: Inconsistent role strings from legacy data.
  Mitigation: Central role normalization and shared helper usage.
- Risk: Multi-tenant data scope mistakes.
  Mitigation: Tenant-aware queries and security rule review.

## 8. Execution Governance
- Weekly planning and risk review.
- Mid-sprint demo with QA and domain stakeholders.
- End-of-phase release gate using agreed acceptance checklist.

## 9. Immediate Next Sprint Backlog
1. Add save queue and retry strategy in Lab Ops store and service.
2. Add store sync state and UI indicator.
3. Add IQC blocked-state helper actions and direct navigation to competency tab.
4. Add integration tests for block and unblock path.
5. Add telemetry hooks for authorization failures and save failures.
