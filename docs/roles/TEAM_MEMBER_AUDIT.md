# Team Member Role Audit

Date: March 17, 2026
Owner: Agenticana
Reviewer: Product Owner
Status: In Progress (Pass 1 - Code Evidence)

## Scope
- Task execution workflows
- Document contribution
- Training and competency actions
- Notifications and follow-up

## Scenario Checklist
| ID | Scenario | Expected | Actual | Result |
|---|---|---|---|---|
| TM-001 | View assigned tasks and priorities | Clear and accurate list | TeamMember dashboard is selected by role and My Tasks widget is always rendered | Pass (code validated) |
| TM-002 | Upload/link evidence to checklist | Upload and linkage successful | Rules allow TeamMember create/update in documents under org constraints | Pass (rules validated) |
| TM-003 | Complete training assignment | Progress and completion tracked | TeamMember role is included in dashboard routing; runtime training completion validation pending | Partial |
| TM-004 | Respond to findings/CAPA tasks | Action workflow is clear | Rules allow team-level update on risk and audit findings data paths | Pass (rules validated) |
| TM-005 | Handle validation errors | Errors are understandable and recoverable | Core forms (example: create project) include structured validation and error state handling patterns | Pass (code validated) |

## Satisfaction Scoring (1-5)
- Discoverability: 4
- Speed: 3
- Reliability: 4
- Ease of completion: 3
- Overall: 3.5 (provisional)

## Findings
- TM-F01: TeamMember journey is broadly supported in rules and dashboard routing, but key flow completion evidence should be added via runtime scenarios.
- TM-F02: Document and findings workflows are permissioned for team roles, but UI-level affordance consistency should be verified across pages.

## Evidence Links
- [TeamMember dashboard role route](src/pages/DashboardPage.tsx#L52)
- [My tasks widget always rendered](src/pages/DashboardPage.tsx#L69)
- [TeamMember included in rules helper](firestore.rules#L51)
- [Documents create/update for team roles](firestore.rules#L136)
- [Risk create/update for team roles](firestore.rules#L181)
- [Audit findings create/update for team roles](firestore.rules#L196)
- [Validation pattern example](src/pages/CreateProjectPage.tsx#L255)

## Sign-off
- Product Owner:
- Agenticana:
