# AccreditEx SWOT Audit Playbook 2026

**Purpose:** Practical, repeatable audit system to evaluate each project area for development improvement, TQM alignment, and accreditation-readiness.

**Scope:** Whole workspace (`src`, `ai-agent`, `scripts`, deployment config, docs, QA).

**Strategic Goal:** Keep your solid working foundation intact, then identify focused improvements through SWOT (Strengths, Weaknesses, Opportunities, Threats).

> **Status Update — February 19, 2026:** Product & TQM domain audit is **complete** (all 10 gaps resolved). Codebase now has 33 pages, 7 stores, 95+ services, 34 routes. All P0/P1/P2 roadmap features implemented and deployed to https://accreditex.web.app. Overall readiness: 92/100.

---

## 1) Audit Operating Model (Using Your `.agent/agents` Folder)

### Core Orchestration
- **Lead Agent:** `orchestrator`
- **Execution Principle:** multi-agent domain reviews, consolidated into one decision log
- **Boundary Rule:** each specialist stays in its domain (security, backend, frontend, QA, DevOps, product)

### Specialist Mapping
- **Product & Value:** `product-owner`, `project-planner`
- **Frontend UX/Accessibility:** `frontend-specialist`
- **Backend/Services/Data Flow:** `backend-specialist`
- **Security/Compliance:** `security-auditor`, `penetration-tester`
- **Testing & Reliability:** `qa-automation-engineer`, `test-engineer`
- **Infra & Release:** `devops-engineer`
- **Data & Schema:** `database-architect`
- **Performance:** `performance-optimizer`
- **Discovery:** `explorer-agent`, `code-archaeologist`

### Skills to Prioritize (from agent configs)
- `clean-code`
- `plan-writing`
- `lint-and-validate`
- `webapp-testing`
- `testing-patterns`
- `deployment-procedures`
- `server-management`
- `vulnerability-scanner`
- `red-team-tactics`
- `api-patterns`
- `database-design`

---

## 2) Domain-by-Domain SWOT Audit Matrix

## A) Product Coverage, TQM Flow, Accreditation Scope

**Project Areas:**
- `src/pages/QualityInsightsPage.tsx`
- `src/pages/AccreditationHubPage.tsx`
- `src/pages/AuditHubPage.tsx`
- `src/pages/RiskHubPage.tsx`
- `src/pages/StandardsPage.tsx`
- `src/pages/SurveyReportPage.tsx`
- `src/pages/ReportsPage.tsx`
- `PRODUCT_FEATURES_AUDIT_2026.md`

**Approach:**
1. Build a TQM capability checklist from PDCA, CAPA, risk, audit lifecycle, competency/training, document control.
2. Map checklist to supported standards (JCI, CBAHI, DNV, ISO 9001, ISO 15189, CAP, NABH).
3. Identify coverage level per standard module: Full / Partial / Planned.

**Primary Agents:** `product-owner`, `project-planner`, `explorer-agent`

**SWOT Questions:**
- **S:** Which workflows already provide end-to-end evidence for accreditation readiness?
- **W:** Which quality loops still depend on manual/off-platform work?
- **O:** Which high-value metrics can be surfaced as executive readiness KPIs?
- **T:** Which missing regulatory edge cases could block accreditation outcomes?

**Evidence Output:**
- `TQM_COVERAGE_MATRIX.md`
- `ACCREDITATION_GAP_REGISTER.md`

---

## B) Frontend UX, Accessibility, Navigation, Discoverability

**Project Areas:**
- `src/pages/*`
- `src/components/*`
- `src/router/*`
- `NAVIGATION_SYSTEM_AUDIT.md`
- `DASHBOARD_ENHANCEMENT_PLAN.md`

**Approach:**
1. Validate role-based discoverability of critical TQM/accreditation features.
2. Re-check accessibility and keyboard behavior across major workflows.
3. Validate navigation depth/link shareability for audit evidence workflows.

**Primary Agents:** `frontend-specialist`, `performance-optimizer`, `qa-automation-engineer`

**Tools/Scripts:**
- `npm run dev`
- `npm run test:e2e`
- `npm run test:e2e:ui`

**SWOT Questions:**
- **S:** What UX patterns already reduce audit preparation time?
- **W:** Where are users not discovering strategic features (AI, PDCA, mock surveys)?
- **O:** Which dashboard widgets increase adoption of quality tools fastest?
- **T:** Which accessibility or navigation regressions would damage trust in audits?

**Evidence Output:**
- `UX_ACCESSIBILITY_SWOT.md`
- `FEATURE_DISCOVERABILITY_SCORECARD.md`

---

## C) Backend Services, Data Integrity, Business Rules

**Project Areas:**
- `src/services/*`
- `src/stores/*`
- `src/firebase/*`
- Firestore rules/indexes (`firestore.rules`, `firestore.indexes.json`)

**Approach:**
1. Service-by-service audit of validation, error handling, and traceability.
2. Verify consistency across `BackendService.ts` and domain services.
3. Validate data model supports auditable history and evidence linkage.

**Primary Agents:** `backend-specialist`, `database-architect`, `debugger`

**Tools/Scripts:**
- `npm run test`
- `npm run test:coverage`
- `npm run build`

**SWOT Questions:**
- **S:** Which services already centralize business logic effectively?
- **W:** Where are duplicated business rules likely to drift?
- **O:** Which service abstractions can improve maintainability without behavior change?
- **T:** Which data integrity failures could invalidate compliance reports?

**Evidence Output:**
- `BACKEND_SERVICE_SWOT.md`
- `DATA_INTEGRITY_RISK_LOG.md`

---

## D) Security, Privacy, Compliance Hardening

**Project Areas:**
- Firebase configs and rules
- API/AI service integration points
- credential handling (`serviceAccountKey.json`, env usage)
- `ai-agent/*`

**Approach:**
1. Threat-model by asset class: patient data, accreditation evidence, credentials.
2. Perform OWASP-focused review (access control, injection, misconfig, logging).
3. Validate secure operational posture for frontend + AI microservice.

**Primary Agents:** `security-auditor`, `penetration-tester`, `backend-specialist`

**Tools/Scripts:**
- `node scripts/firebase-health-check.cjs`
- `node scripts/firebase-diagnostics.cjs`
- `node scripts/firebase-collections-check.cjs`
- `node scripts/check-firestore-user.js`

**SWOT Questions:**
- **S:** Which controls already provide strong auditability and accountability?
- **W:** Which exposed/mismanaged secrets or policies increase risk?
- **O:** Which zero-trust controls can be added with minimal disruption?
- **T:** Which threat vectors can cause compliance failure or data breach?

**Evidence Output:**
- `SECURITY_SWOT_REGISTER.md`
- `REMEDIATION_PRIORITY_MATRIX.md`

---

## E) Test Strategy, Regression Safety, Quality Gates

**Project Areas:**
- `jest.config.ts`
- `playwright.config.ts`
- `src/**/__tests__`
- `e2e/tests/basic.spec.ts`

**Approach:**
1. Expand from baseline smoke to risk-based regression for high-impact TQM flows.
2. Add unhappy-path test cases (expired auth, network errors, malformed uploads, access control).
3. Gate release on quality thresholds linked to accreditation-critical workflows.

**Primary Agents:** `qa-automation-engineer`, `test-engineer`

**Tools/Scripts:**
- `npm run test`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run test:all`

**SWOT Questions:**
- **S:** Which existing tests already protect critical workflows?
- **W:** Which modules remain under-tested (especially integration boundaries)?
- **O:** Which automation gives highest confidence-per-effort next?
- **T:** Which regressions could silently corrupt compliance evidence?

**Evidence Output:**
- `TEST_GAP_SWOT.md`
- `RELEASE_QUALITY_GATE.md`

---

## F) DevOps, Deployability, Operability, Configuration Ease

**Project Areas:**
- `deploy-render.ps1`, `quick-deploy.ps1`, `setup-render-service.ps1`
- `firebase.json`
- `vite.config.ts`, `manifest.json`
- AI deployment packages in `ai-agent/*`

**Approach:**
1. Validate one-command setup path for new project/team onboarding.
2. Verify environment separation (dev/stage/prod) and rollback readiness.
3. Audit scripts for reliability, prechecks, and clear failure messages.

**Primary Agents:** `devops-engineer`, `project-planner`

**Tools/Scripts:**
- `npm run build`
- `deploy-render.ps1`
- `quick-deploy.ps1`
- `setup-render-service.ps1`

**SWOT Questions:**
- **S:** Which deployment scripts already reduce operational burden?
- **W:** Where does setup still require tribal knowledge?
- **O:** Which automation can make provisioning near-zero-touch?
- **T:** Which release/config failures can cause downtime or drift?

**Evidence Output:**
- `DEPLOYMENT_SWOT.md`
- `ENVIRONMENT_READINESS_CHECKLIST.md`

---

## G) AI Agent Capability, Safety, and Integration Readiness

**Project Areas:**
- `ai-agent/AI_AGENT_AUDIT_REPORT.md`
- `ai-agent/deployment_package/*`
- `src/services/ai.ts`
- `src/services/aiAgentService.ts`

**Approach:**
1. Re-audit integration between React app and AI service endpoints.
2. Validate safety controls (CORS, auth/rate limits, prompt boundaries, logging).
3. Define evaluation metrics for accreditation-assistant quality.

**Primary Agents:** `backend-specialist`, `security-auditor`, `product-owner`

**Tools/Scripts:**
- `test-ai-agent.ps1`
- `test-chat-quick.ps1`

**SWOT Questions:**
- **S:** Where does AI already deliver measurable quality/compliance value?
- **W:** What integration and observability gaps remain?
- **O:** Which use-cases increase assessor confidence (evidence summaries, RCA consistency)?
- **T:** Which AI errors could produce unsafe or non-compliant guidance?

**Evidence Output:**
- `AI_ASSURANCE_SWOT.md`
- `AI_EVALUATION_SCORECARD.md`

---

## H) Standards Data Pipeline and Content Governance

**Project Areas:**
- `scripts/generate_complete_standards.py`
- `scripts/generate_data_from_standards.py`
- `scripts/upload_standards_to_firebase.py`
- `scripts/upload_all_data_to_firebase.py`
- `data/*`

**Approach:**
1. Validate content lineage: source documents → transformed standards → Firebase.
2. Check versioning, reproducibility, and traceability of standards updates.
3. Verify localization and taxonomy consistency.

**Primary Agents:** `database-architect`, `backend-specialist`, `product-owner`

**Tools/Scripts:**
- `python scripts/generate_complete_standards.py`
- `python scripts/generate_data_from_standards.py`
- `python scripts/upload_standards_to_firebase.py`
- `python scripts/upload_all_data_to_firebase.py`

**SWOT Questions:**
- **S:** Which data generation/upload workflows are already mature?
- **W:** Where are manual edits causing data drift?
- **O:** Which metadata enrichments improve accreditation intelligence?
- **T:** Which content errors can invalidate standard mappings?

**Evidence Output:**
- `STANDARDS_DATA_SWOT.md`
- `CONTENT_GOVERNANCE_RULEBOOK.md`

---

## 3) Cross-Domain KPIs for TQM + Accreditation Readiness

Track these as release-level quality KPIs:

1. **Readiness Score:** weighted across standards coverage, evidence completeness, unresolved findings.
2. **PDCA Velocity:** # PDCA cycles opened/closed per period with verified outcomes.
3. **CAPA Effectiveness:** recurrence rate after corrective actions.
4. **Audit Pass Predictor:** % critical checklist items green before mock/external audits.
5. **Evidence Integrity Index:** % audit artifacts with source link, timestamp, owner, and approval state.
6. **Training Competency Closure:** % competency gaps resolved within SLA.
7. **Security Compliance Posture:** unresolved high-risk findings count.

---

## 4) Audit Execution Rhythm (Lean, Repeatable)

### Phase 0 — Baseline (1–2 days)
- Consolidate current facts from existing reports:
  - `PRODUCT_FEATURES_AUDIT_2026.md`
  - `NAVIGATION_SYSTEM_AUDIT.md`
  - `ai-agent/AI_AGENT_AUDIT_REPORT.md`
- Confirm all scripts run in local environment.

### Phase 1 — Domain SWOT (3–5 days)
- Execute domain owners in parallel:
  - Product/coverage
  - Security
  - Testing
  - Deployability
  - AI assurance
- Produce 8 domain SWOT files (sections A–H).

### Phase 2 — Prioritization (1 day)
- Score each finding by:
  - **Impact on accreditation outcome**
  - **Implementation effort**
  - **Risk exposure if delayed**
- Build a 30/60/90-day roadmap.

### Phase 3 — Hardening Sprint (ongoing)
- Implement top priorities only.
- Re-run tests/security/deploy checks.
- Update scorecard and trend line.

---

## 5) Immediate Actionable Backlog (Recommended First Sprint)

1. **Create missing consolidated strategic docs**
   - `SWOT_ANALYSIS_REPORT.md` (referenced in docs but missing)
   - `ACCREDITEX_PROJECT_STRUCTURE_AUDIT_REPORT.md` (referenced in docs but missing)

2. **Stabilize quality gates**
   - Ensure `npm run test:all` is green in CI baseline.
   - Add risk-based E2E cases for accreditation-critical paths.

3. **Security quick wins**
   - Validate no sensitive credentials remain in repo history.
   - Reconfirm Firebase rules/indexes and operational diagnostics scripts.

4. **TQM evidence completeness checks**
   - Enforce evidence linkage for PDCA/CAPA/audit findings.
   - Add dashboard-level readiness indicators.

5. **Setup simplification**
   - Produce one setup checklist script path for new deployments.
   - Validate onboarding from clean machine to functional run.

---

## 6) Command Catalog (Operational)

### Build & Test
- `npm run build`
- `npm run test`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run test:all`

### Firebase Diagnostics
- `node scripts/firebase-health-check.cjs`
- `node scripts/firebase-diagnostics.cjs`
- `node scripts/firebase-collections-check.cjs`
- `node scripts/check-firestore-user.js`

### Standards/Data
- `python scripts/generate_complete_standards.py`
- `python scripts/generate_data_from_standards.py`
- `python scripts/upload_standards_to_firebase.py`
- `python scripts/upload_all_data_to_firebase.py`

### AI Agent Checks
- `./test-ai-agent.ps1`
- `./test-chat-quick.ps1`

---

## 7) Definition of Done (for SWOT Audit Cycle)

An audit cycle is complete when:
- Each domain (A–H) has a SWOT summary and prioritized findings.
- Findings are converted to measurable backlog items with owner + due date.
- Security, testing, and deployment checks pass for current baseline.
- TQM/accreditation readiness KPIs are updated and trendable.
- Improvement roadmap (30/60/90 days) is approved.

---

## 8) Notes from Current Workspace Reality

- Existing documentation references consolidated files that are currently missing in root:
  - `SWOT_ANALYSIS_REPORT.md`
  - `ACCREDITEX_PROJECT_STRUCTURE_AUDIT_REPORT.md`
- Multiple rich audits already exist (`PRODUCT_FEATURES_AUDIT_2026.md`, `NAVIGATION_SYSTEM_AUDIT.md`, AI audit), so this playbook should be used to unify and operationalize—not replace—them.

---

**Recommended Owner:** `orchestrator` agent with weekly cadence and specialist parallel reviews.
