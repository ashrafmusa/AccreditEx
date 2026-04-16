# Phase 2 Gap Register

Date: March 17, 2026
Program Lead: Agenticana
Status: Active

## Legend
- Severity: P0 (critical), P1 (high), P2 (medium)
- Status: Open, In Progress, Closed, Partially Closed, Not Applicable

## Gap Table
| ID | Source | Gap | Impacted Roles | Severity | Status | Owner | Target Sprint | Evidence |
|---|---|---|---|---|---|---|---|---|
| GAP-001 | UX_AUDIT_REPORT | Accessibility consistency is partial across interactive elements | All roles | P1 | Closed | frontend-specialist | Sprint 1 | [header action accessibility labels](src/components/dashboard/DashboardHeader.tsx#L172), [shortcut accessibility labels](src/components/dashboard/DashboardHeader.tsx#L140), [discoverability action semantics](src/pages/DashboardPage.tsx#L155), [viewer discoverability coverage test](src/pages/__tests__/DashboardPage.roles.test.tsx) |
| GAP-002 | UX_AUDIT_REPORT | Deep navigation paths still require 3-4 interactions for key workflows | Admin, ProjectLead, TeamMember, Auditor | P1 | Closed | frontend-specialist | Sprint 1 | [admin quick actions](src/components/dashboard/AdminDashboard.tsx#L516), [project lead quick actions](src/components/dashboard/ProjectLeadDashboard.tsx#L173), [admin header fast lanes](src/components/dashboard/AdminDashboard.tsx#L500), [project lead header fast lanes](src/components/dashboard/ProjectLeadDashboard.tsx#L165), [header shortcut workflow tests](src/components/dashboard/__tests__/DashboardHeader.shortcuts.test.tsx) |
| GAP-003 | UX_AUDIT_REPORT | Missing/uneven keyboard navigation coverage in complex pages | All roles | P1 | Closed | frontend-specialist | Sprint 1 | [header keyboard shortcuts](src/components/dashboard/DashboardHeader.tsx#L68), [discoverability keyboard shortcuts](src/pages/DashboardPage.tsx#L88), [header keyboard regression test](src/components/dashboard/__tests__/DashboardHeader.shortcuts.test.tsx#L62), [dashboard keyboard regression test](src/pages/__tests__/DashboardPage.roles.test.tsx#L75) |
| GAP-004 | PRODUCT_FEATURES_AUDIT_2026 | HIS deep integration marked as top enhancement area | Admin, ProjectLead | P2 | Closed | backend-specialist | Sprint 2 | [HIS closure scope and acceptance baseline](docs/HIS_DEEP_INTEGRATION_CLOSURE_SCOPE.md), [HIS integration service inventory](src/services/hisIntegration), [role route enforcement coverage](src/router/__tests__/routes.roleAccess.test.ts) |
| GAP-005 | PRODUCT_FEATURES_AUDIT_2026 | Advanced feature discoverability needs improvement | TeamMember, Auditor, Viewer | P2 | Closed | product-owner | Sprint 2 | [role-aware quick navigation panel](src/pages/DashboardPage.tsx#L155), [viewer quick action regression test](src/pages/__tests__/DashboardPage.roles.test.tsx#L56) |
| GAP-006 | ROLE_AUDITS | Role-by-role access verification not yet fully evidenced | All roles | P0 | Closed | security-auditor | Sprint 1 | [routes metadata](src/router/routes.ts#L31), [navigation admin gating](src/components/common/NavigationRail.tsx#L205), [rules enforcement](firestore.rules#L124), [create project role-filter integration test](src/pages/__tests__/CreateProjectPage.roleAccess.test.tsx), [audit plan role-filter integration test](src/components/audits/__tests__/AuditPlanModal.roleAccess.test.tsx), [navigation rail role access integration test](src/components/common/__tests__/NavigationRail.roleAccess.test.tsx), [viewer dashboard role test](src/pages/__tests__/DashboardPage.roles.test.tsx) |
| GAP-007 | ROLE_AUDITS | Persona satisfaction baseline scores not yet captured | All personas | P1 | Closed | product-owner | Sprint 1 | [persona baseline completed](docs/PERSONA_SATISFACTION_REPORT.md) |
| GAP-008 | PHASE_2_PLAN | Role scenario regression tests not yet complete | All roles | P1 | Closed | test-engineer | Sprint 1 | [role access utility tests](src/utils/__tests__/roleAccess.test.ts), [viewer dashboard role tests](src/pages/__tests__/DashboardPage.roles.test.tsx), [create project role-filter integration test](src/pages/__tests__/CreateProjectPage.roleAccess.test.tsx), [audit plan role-filter integration test](src/components/audits/__tests__/AuditPlanModal.roleAccess.test.tsx), [navigation rail role access integration test](src/components/common/__tests__/NavigationRail.roleAccess.test.tsx), [route metadata role access tests](src/router/__tests__/routes.roleAccess.test.ts), [header shortcut workflow tests](src/components/dashboard/__tests__/DashboardHeader.shortcuts.test.tsx) |
| GAP-009 | ROLE_AUDITS | Viewer persona has no dedicated dashboard branch (falls back to generic experience) | Viewer | P1 | Closed | frontend-specialist | Sprint 1 | [viewer branch added](src/pages/DashboardPage.tsx#L54), [viewer audit finding](docs/roles/VIEWER_AUDIT.md) |
| GAP-010 | ROLE_AUDITS | Audit and project assignment selectors are not role-filtered (all users listed) | Auditor, ProjectLead, Admin | P1 | Closed | frontend-specialist | Sprint 1 | [auditor selector role-filtered](src/components/audits/AuditPlanModal.tsx#L24), [project lead selector role-filtered](src/pages/CreateProjectPage.tsx#L46), [auditor finding](docs/roles/AUDITOR_AUDIT.md), [project lead finding](docs/roles/PROJECT_LEAD_AUDIT.md) |

## Closure Rules
A gap can be set to Closed only when all are present:
1. Root cause documented.
2. Fix implemented and linked.
3. Validation proof linked.
4. Product Owner sign-off.
5. Agenticana closure approval.

## Weekly Summary
- Total gaps: 10
- Open: 0
- In Progress: 0
- Closed: 10
- P0 open: 0
