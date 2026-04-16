# Auditor Role Audit

Date: March 17, 2026
Owner: Agenticana
Reviewer: Product Owner
Status: In Progress (Pass 2 - Revalidated)

## Scope
- Audit planning and execution
- Findings documentation
- Evidence traceability
- Follow-up and closure visibility

## Scenario Checklist
| ID | Scenario | Expected | Actual | Result |
|---|---|---|---|---|
| AUD-001 | Access assigned audits | Correct scope and permissions | Auditor dashboard route exists and rules include Auditor in team-level access helper | Pass (code and rules validated) |
| AUD-002 | Record findings and severity | Accurate data capture | Rules allow auditor-level create/update through team-level role helper | Pass (rules validated) |
| AUD-003 | Link evidence to findings | Evidence is attached and retrievable | Audit planning modal supports assigned auditor and project linkage fields with auditor-eligible filtering | Pass (code validated) |
| AUD-004 | Track corrective actions | Follow-up status is visible | Non-compliance workflow template escalates notifications to Admin and ProjectLead; auditor follow-up runtime path needs verification | Partial |
| AUD-005 | Export audit report | Complete and compliant output | Report/export runtime evidence for auditor persona is not yet captured | Partial |

## Satisfaction Scoring (1-5)
- Discoverability: 3
- Speed: 3
- Reliability: 4
- Traceability confidence: 3
- Overall: 3.25 (provisional)

## Findings
- AUD-F01: Auditor export/report outcomes need runtime evidence before closure.
- AUD-F02: Auditor follow-up and corrective-action visibility still need runtime validation.

## Evidence Links
- [Auditor dashboard role route](src/pages/DashboardPage.tsx#L50)
- [Auditor included in rules helper](firestore.rules#L51)
- [Audit findings write permissions for team roles](firestore.rules#L196)
- [Eligible auditor filtering](src/components/audits/AuditPlanModal.tsx#L1)
- [Audit plan assigned auditor field](src/components/audits/AuditPlanModal.tsx#L26)
- [Audit plan save requires assigned auditor](src/components/audits/AuditPlanModal.tsx#L44)
- [Assigned auditor selector uses eligible auditors](src/components/audits/AuditPlanModal.tsx#L149)
- [Non-compliance workflow escalation template](src/types/workflow.ts#L232)

## Sign-off
- Product Owner:
- Agenticana:
