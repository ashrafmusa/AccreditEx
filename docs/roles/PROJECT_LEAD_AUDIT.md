# Project Lead Role Audit

Date: March 17, 2026
Owner: Agenticana
Reviewer: Product Owner
Status: In Progress (Pass 1 - Code Evidence)

## Scope
- Project lifecycle management
- Checklist ownership
- Team coordination
- Risk and CAPA handling
- Delivery reporting

## Scenario Checklist
| ID | Scenario | Expected | Actual | Result |
|---|---|---|---|---|
| PL-001 | Create and configure project | Full flow without blockers | Create project route and form validation for required fields are implemented | Pass (code validated) |
| PL-002 | Assign team and responsibilities | Assignment persisted correctly | Team member assignment flow is implemented, but project lead picker currently lists all users without role filter | Partial |
| PL-003 | Manage checklist compliance | Status updates and evidence linking work | Project update permissions in rules allow ProjectLead and team roles with org checks | Pass (rules validated) |
| PL-004 | Trigger risk/CAPA workflows | Correct escalation and visibility | Workflow templates include escalation to Admin and ProjectLead for non-compliance | Pass (config validated) |
| PL-005 | Generate project reports | Data accurate and export succeeds | Project detail includes report generation flow; role-specific runtime assertions still needed | Partial |

## Satisfaction Scoring (1-5)
- Discoverability: 4
- Speed: 3
- Reliability: 4
- Coordination support: 3
- Overall: 3.5 (provisional)

## Findings
- PL-F01: Project lead selector should be filtered to eligible roles to avoid assignment mistakes and improve governance.
- PL-F02: Report generation path exists but role-based behavior and output quality need runtime evidence.
- PL-F03: Route-level ProjectLead workflow test coverage should be added before closure.

## Evidence Links
- [Create project route](src/router/routes.ts#L37)
- [Create project required validation](src/pages/CreateProjectPage.tsx#L255)
- [Project lead required validation](src/pages/CreateProjectPage.tsx#L274)
- [Project lead selector currently maps all users](src/pages/CreateProjectPage.tsx#L683)
- [Team assignment block](src/pages/CreateProjectPage.tsx#L772)
- [Project rules for create/update/delete](firestore.rules#L124)
- [ProjectLead role helper in rules](firestore.rules#L46)
- [Training program ProjectLead permissions](firestore.rules#L165)
- [Non-compliance escalation template to ProjectLead](src/types/workflow.ts#L232)
- [Project report generation entry point](src/pages/ProjectDetailPage.tsx#L227)

## Sign-off
- Product Owner:
- Agenticana:
