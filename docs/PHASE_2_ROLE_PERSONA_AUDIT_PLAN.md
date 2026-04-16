# AccreditEx Phase 2 Plan: Role and Persona Audit Program

Date: March 17, 2026
Owner: Agenticana (Program Lead) + Product Owner (Business Owner)
Execution Team: QA + Frontend + Backend + Security + Test Engineering
Status: Active

## 1) Objective
Close gaps from prior product and UX audits, then validate feature satisfaction for every platform role/persona through evidence-based role audits.

## 2) Inputs (Baseline)
- Product feature audit baseline: docs/internal/PRODUCT_FEATURES_AUDIT_2026.md
- UX audit baseline: docs/UX_AUDIT_REPORT.md
- UX action baseline: docs/UX_ACTION_PLAN.md
- Landing/login governance baseline: docs/LANDING_LOGIN_IMPLEMENTATION_GOVERNANCE.md

## 3) Role Scope
Authoritative role set from src/types/index.ts:
- Admin
- ProjectLead
- TeamMember
- Auditor
- Viewer

## 4) Phase Structure

### Track A: Re-open Previous Audits and Build Gap Register
1. Extract unresolved findings from the baseline audits.
2. Normalize each finding into one record:
   - ID, category, impacted role(s), severity, current status, owner, target sprint.
3. Mark all findings as one of:
   - Closed, Partially Closed, Open, Not Applicable.
4. Create evidence links for each closure (PR, test, screenshot, rules, route).

Deliverable:
- docs/PHASE_2_GAP_REGISTER.md

### Track B: Role-by-Role Capability Audit
For each role, execute an end-to-end scenario suite and score:
- Discoverability (can they find the feature quickly?)
- Access control correctness (can/cannot perform expected actions?)
- Workflow completion (task done without workaround?)
- Error clarity and recovery
- Mobile usability and accessibility basics
- i18n correctness (EN/AR)

Deliverables:
- docs/roles/ADMIN_AUDIT.md
- docs/roles/PROJECT_LEAD_AUDIT.md
- docs/roles/TEAM_MEMBER_AUDIT.md
- docs/roles/AUDITOR_AUDIT.md
- docs/roles/VIEWER_AUDIT.md

### Track C: Persona Satisfaction Validation
Define and audit personas mapped to roles:
- Executive Admin Persona
- Compliance Program Lead Persona
- Clinical Team Operator Persona
- External/Internal Auditor Persona
- Read-Only Stakeholder Persona

For each persona capture:
- Top 5 jobs-to-be-done
- Top frustrations
- Time-to-value path
- Satisfaction score (1-5)
- Required improvements

Deliverable:
- docs/PERSONA_SATISFACTION_REPORT.md

### Track D: Closure Sprint
Convert findings into implementation backlog and execute by severity:
- P0: Security/access violations, data loss, broken critical workflows
- P1: Core workflow blockers and severe UX friction
- P2: Discoverability, performance, and quality-of-life items

Deliverables:
- docs/PHASE_2_IMPLEMENTATION_BACKLOG.md
- docs/PHASE_2_COMPLETION_REPORT.md

## 5) Audit Matrix (Minimum Coverage)
Each role must be audited against these feature families:
- Dashboard and analytics
- Projects lifecycle and checklists
- Documents and approvals
- Risks and CAPA
- Audits and findings
- Training and competency
- Reports and exports
- Notifications and workflow automation
- Settings and administration (role-limited)

## 6) Acceptance Criteria (Done Definition)
Phase 2 is complete only when all are true:
1. Every prior open gap has a status and owner.
2. Every role has a signed audit report with evidence.
3. Every persona has a satisfaction score and improvement list.
4. P0 items are closed.
5. P1 items have committed sprint dates.
6. Firestore rules and route-level role behavior are validated with tests.
7. Documents are updated and internally reviewed.

## 7) Suggested Timeline (4 Weeks)
- Week 1: Gap register + role test scenarios + evidence template
- Week 2: Admin/ProjectLead/TeamMember audits + fixes start
- Week 3: Auditor/Viewer audits + persona satisfaction scoring
- Week 4: Closure sprint, regression testing, final phase report

## 8) Immediate Next Actions (Start Now)
1. Create docs/PHASE_2_GAP_REGISTER.md from previous audit findings.
2. Create role audit templates under docs/roles/.
3. Build role scenario checklist in QA format (AAA where testable).
4. Execute Admin and ProjectLead audits first (highest business impact).

## 9) Governance and Reporting Cadence
- Daily: 15-minute triage of newly found role gaps.
- Twice weekly: Product Owner sign-off on closure evidence.
- Weekly: Phase dashboard update with counts by severity and role.

## 9.1) Leadership Model (Agenticana-Led)
- Agenticana is the single orchestration lead for this phase.
- Product Owner approves priorities, acceptance, and release readiness.
- Domain specialists execute workstreams:
  - frontend-specialist: role UX and interaction gaps
  - backend-specialist: service/data behavior and integrity
  - security-auditor: role access and rule validation
  - test-engineer: regression and role scenario coverage
  - documentation-writer: audit evidence and closure docs
- No gap is marked Closed without Agenticana validation and linked evidence.

## 10) Risks and Controls
- Risk: Audit inflation without evidence.
  - Control: No closure without linked evidence.
- Risk: Role confusion in test accounts.
  - Control: Dedicated seeded users per role.
- Risk: Scope creep.
  - Control: Freeze scope to role/persona outcomes for this phase.
