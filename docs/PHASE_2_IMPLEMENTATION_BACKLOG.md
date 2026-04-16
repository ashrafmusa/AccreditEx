# Phase 2 Implementation Backlog

Date: March 17, 2026
Program Lead: Agenticana
Status: In Progress

## Prioritization Rules
- P0: Must be fixed before any release
- P1: Commit in current/next sprint with owner and due date
- P2: Schedule with rationale and impact score

## Backlog
| ID | Linked Gap | Title | Severity | Role Impact | Owner | Sprint | Status | Evidence |
|---|---|---|---|---|---|---|---|---|
| BK-001 | GAP-006 | Complete role-based access control evidence suite | P0 | All roles | security-auditor | Sprint 1 | Closed | [create project role-filter integration test](src/pages/__tests__/CreateProjectPage.roleAccess.test.tsx), [audit plan role-filter integration test](src/components/audits/__tests__/AuditPlanModal.roleAccess.test.tsx), [navigation rail role access integration test](src/components/common/__tests__/NavigationRail.roleAccess.test.tsx), [viewer dashboard role test](src/pages/__tests__/DashboardPage.roles.test.tsx) |
| BK-002 | GAP-001 | Raise accessibility consistency across high-traffic pages | P1 | All roles | frontend-specialist | Sprint 1 | Closed | [header action accessibility labels](src/components/dashboard/DashboardHeader.tsx#L172), [shortcut accessibility labels](src/components/dashboard/DashboardHeader.tsx#L140), [discoverability action semantics](src/pages/DashboardPage.tsx#L155) |
| BK-003 | GAP-002 | Reduce click depth on top role journeys | P1 | Admin, ProjectLead, TeamMember, Auditor | frontend-specialist | Sprint 1 | Closed | [admin quick actions](src/components/dashboard/AdminDashboard.tsx#L516), [project lead quick actions](src/components/dashboard/ProjectLeadDashboard.tsx#L173), [dashboard header fast lanes](src/components/dashboard/DashboardHeader.tsx#L17), [shortcut workflow test](src/components/dashboard/__tests__/DashboardHeader.shortcuts.test.tsx) |
| BK-004 | GAP-008 | Add regression tests for role scenarios | P1 | All roles | test-engineer | Sprint 1 | Closed | [role access utility tests](src/utils/__tests__/roleAccess.test.ts), [create project role-filter integration test](src/pages/__tests__/CreateProjectPage.roleAccess.test.tsx), [audit plan role-filter integration test](src/components/audits/__tests__/AuditPlanModal.roleAccess.test.tsx), [navigation rail role access integration test](src/components/common/__tests__/NavigationRail.roleAccess.test.tsx), [viewer dashboard role test](src/pages/__tests__/DashboardPage.roles.test.tsx), [route metadata tests](src/router/__tests__/routes.roleAccess.test.ts), [header shortcut workflow tests](src/components/dashboard/__tests__/DashboardHeader.shortcuts.test.tsx) |
| BK-005 | GAP-004 | Define HIS deep integration closure scope | P2 | Admin, ProjectLead | backend-specialist | Sprint 2 | Closed | [HIS closure scope baseline](docs/HIS_DEEP_INTEGRATION_CLOSURE_SCOPE.md), [HIS integration services inventory](src/services/hisIntegration) |
| BK-006 | GAP-009 | Add dedicated Viewer dashboard branch | P1 | Viewer | frontend-specialist | Sprint 1 | Closed | [viewer branch](src/pages/DashboardPage.tsx#L54) |
| BK-007 | GAP-010 | Role-filter assignment selectors for project lead and auditor pickers | P1 | Auditor, ProjectLead, Admin | frontend-specialist | Sprint 1 | Closed | [project lead filter](src/pages/CreateProjectPage.tsx#L46), [auditor filter](src/components/audits/AuditPlanModal.tsx#L24) |
| BK-008 | GAP-007 | Complete persona baseline scoring for all role-mapped personas | P1 | All personas | product-owner | Sprint 1 | Closed | [persona baseline report](docs/PERSONA_SATISFACTION_REPORT.md) |
| BK-009 | GAP-003/GAP-005 | Add role-aware keyboard and discoverability quick navigation | P1 | TeamMember, Auditor, Viewer | frontend-specialist | Sprint 1 | Closed | [dashboard role quick navigation](src/pages/DashboardPage.tsx#L155), [dashboard keyboard shortcuts](src/pages/DashboardPage.tsx#L88), [header keyboard shortcuts](src/components/dashboard/DashboardHeader.tsx#L68), [shortcut regression tests](src/components/dashboard/__tests__/DashboardHeader.shortcuts.test.tsx#L62), [viewer discoverability regression test](src/pages/__tests__/DashboardPage.roles.test.tsx#L56) |

## Change Log
- March 17, 2026: Execution started. Admin and ProjectLead role audits completed (pass 1 code evidence). BK-001 and BK-004 moved to In Progress.
- March 17, 2026: Implemented GAP-009 and GAP-010. Added Viewer dashboard branch and role-filtered selectors for project lead and auditor assignment.
- March 17, 2026: Added role regression tests for role normalization/eligibility and Viewer dashboard rendering. Targeted Jest suites passed.
- March 17, 2026: Closed GAP-006 with integration-level role access tests and started GAP-002 click-depth reduction for Admin and ProjectLead via dashboard quick actions.
- March 17, 2026: Completed persona baseline scoring and closed GAP-007.
- March 17, 2026: Completed deeper navigation flattening for Admin and ProjectLead with header fast lanes and closed GAP-002. Expanded route/workflow regression coverage and closed GAP-008.
- March 17, 2026: Closed GAP-001, GAP-003, GAP-004, and GAP-005 via dashboard accessibility/keyboard/discoverability enhancements plus HIS closure scope baseline; backlog now fully closed for tracked items.
