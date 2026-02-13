# Product & TQM Domain SWOT Audit

**Domain:** Product coverage, quality-management flow, accreditation readiness  
**Date:** February 13, 2026  
**Method:** Product-owner + project-planner style analysis using existing code and audit artifacts

---

## Scope and Inputs

### Primary Evidence Sources
- `PRODUCT_FEATURES_AUDIT_2026.md`
- `src/pages/QualityInsightsPage.tsx`
- `src/pages/AccreditationHubPage.tsx`
- `src/pages/AuditHubPage.tsx`
- `src/pages/RiskHubPage.tsx`
- `src/pages/StandardsPage.tsx`
- `src/pages/SurveyReportPage.tsx`
- `src/pages/ReportsPage.tsx`
- `src/pages/DocumentControlHubPage.tsx`
- `src/pages/TrainingHubPage.tsx`
- `src/pages/ProjectDetailPage.tsx`
- `src/pages/ProjectOverview.tsx`
- `src/types/index.ts`

### Domain Objective
Evaluate whether Product + TQM capabilities are sufficient for sustained accreditation performance, not just one-time audit preparation.

---

## Strengths

1. **End-to-end accreditation workflow exists in-product**
   - Program setup, standards management, project planning, checklist execution, mock survey, risk/capa follow-up, reporting are all represented in app modules.

2. **TQM loops are structurally present**
   - PDCA tracking appears in quality insights and project detail workflows.
   - CAPA, effectiveness checks, and risk workflows are linked in Risk Hub and survey flows.

3. **Survey-to-action automation is a major quality accelerator**
   - Survey failed items can auto-create risks and CAPAs; this supports faster corrective action initiation.

4. **Role-oriented governance exists**
   - Admin-restricted modification on key governance areas (e.g., accreditation program management, controlled docs workflows).

5. **Document control is mature enough for evidence management**
   - Controlled document states, metadata, relationships, and approval actions support auditable documentation behavior.

6. **Operational quality metrics are visible**
   - Quality score, risk control index, pending checks/acknowledgments provide management-level visibility.

---

## Weaknesses

1. **Evidence integrity policy is not explicit as a single cross-module rule**
   - Capabilities exist, but mandatory evidence fields and traceability checks are not yet centrally enforced as release gates.

2. **Readiness scoring model is still composite rather than accreditation-outcome-calibrated**
   - Current KPIs are useful, but weighted scoring tied to pass probability and critical standard groups can be strengthened.

3. **Advanced reporting appears document-centric, not yet deeply configurable by assurance lens**
   - Reporting UX supports retrieval/export, but structured “assessor-ready packs” and programmable views are limited.

4. **Cross-standard harmonization logic is not yet explicit**
   - Programs are supported, but overlap mapping (e.g., common controls across JCI/CBAHI/ISO) is not prominently productized.

5. **Feature discoverability remains an adoption bottleneck**
   - Existing audits already identify this risk; advanced quality features may be underused by default users.

---

## Opportunities

1. **Create an Accreditation Readiness Control Tower**
   - Add weighted readiness model by domain (governance, patient safety, document control, competency, risk, audit).

2. **Institutionalize evidence integrity controls**
   - Require minimum metadata and linkage rules for CAPA/PDCA/audit findings before closure.

3. **Build crosswalk intelligence between standards**
   - Reuse evidence and controls across programs to cut duplication and speed readiness cycles.

4. **Standardize assessor-ready evidence packs**
   - One-click pack generation by project/program/survey cycle with chain-of-custody metadata.

5. **Strengthen quality learning loop**
   - Track recurrence, CAPA effectiveness, cycle time, and embed recommendations into dashboard insights.

---

## Threats

1. **Regulatory criteria drift**
   - If standards evolve without fast update cadence, apparent compliance may become stale.

2. **Hidden regression in high-criticality quality flows**
   - As system grows, insufficient domain-focused automation can silently break audit-critical logic.

3. **Adoption asymmetry**
   - If teams use only baseline features, realized value and accreditation outcomes may underperform platform capability.

4. **Data quality variance across departments**
   - Inconsistent evidence completeness can degrade trust in readiness dashboards.

---

## Product & TQM Domain Score

- Coverage Breadth: **94/100**
- TQM Process Maturity: **91/100**
- Evidence Governance Explicitness: **82/100**
- Accreditation Outcome Predictability: **84/100**
- Overall Product & TQM Domain: **88/100**

---

## Prioritized Actions (30/60/90)

### 0–30 Days
1. Enforce minimum evidence metadata policy for CAPA/PDCA/audit closure.
2. Publish TQM capability ownership matrix (module owner + data owner + KPI owner).
3. Define critical control list per program and map to existing checklist structures.

### 31–60 Days
1. Introduce cross-program control mapping (common controls and reusable evidence).
2. Add readiness scorecards by department and project.
3. Add recurrence + effectiveness trend views (CAPA and incidents).

### 61–90 Days
1. Deliver assessor-ready evidence pack generator.
2. Add predictive indicators for audit risk (based on open critical items, overdue actions, repeated findings).
3. Establish quarterly standards review governance cycle.

---

## Deliverables Linked

- `TQM_COVERAGE_MATRIX.md`
- `ACCREDITATION_GAP_REGISTER.md`
