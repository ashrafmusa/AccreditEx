# Viewer Role Audit

Date: March 17, 2026
Owner: Agenticana
Reviewer: Product Owner
Status: In Progress (Pass 2 - Revalidated)

## Scope
- Read-only visibility
- Dashboard and report consumption
- Information clarity
- Access boundaries

## Scenario Checklist
| ID | Scenario | Expected | Actual | Result |
|---|---|---|---|---|
| VW-001 | Access allowed read-only views | No edit controls exposed | Rules helper for write access excludes Viewer from team-level write roles | Pass (rules validated) |
| VW-002 | Review dashboards and key metrics | Information is understandable | Viewer now has a dedicated dashboard branch plus quick navigation shortcuts for read-only journeys | Pass (code validated) |
| VW-003 | Access shared reports | Export and view actions work as intended | Routes and nav provide general authenticated access to analytics paths; viewer-specific report UX not yet evidenced | Partial |
| VW-004 | Attempt restricted actions | Properly denied with clear message | Write permissions in rules require ProjectLead/TeamMember/Auditor or Admin for major write collections | Pass (rules validated) |
| VW-005 | Navigate between major modules | Fast, clear, and consistent | Base navigation is available and Viewer now receives dedicated quick navigation chips and keyboard shortcuts | Pass (code validated) |

## Satisfaction Scoring (1-5)
- Discoverability: 3
- Speed: 3
- Reliability: 4
- Clarity: 3
- Overall: 3.25 (provisional)

## Findings
- VW-F01: Viewer-focused read-only reporting journey still lacks dedicated runtime evidence for report consumption/export confidence.

## Evidence Links
- [Role model includes Viewer](src/types/index.ts#L125)
- [Viewer dashboard branch](src/pages/DashboardPage.tsx#L58)
- [Viewer quick navigation actions](src/pages/DashboardPage.tsx#L56)
- [Viewer quick navigation chips](src/pages/DashboardPage.tsx#L166)
- [Viewer excluded from team-level write helper](firestore.rules#L51)
- [Documents write requires team-level role](firestore.rules#L136)
- [Projects update requires team-level role](firestore.rules#L127)

## Sign-off
- Product Owner:
- Agenticana:
