# HIS Deep Integration Closure Scope

Date: March 17, 2026
Owner: backend-specialist
Status: Closed (Scope and acceptance baseline approved)
Linked Gap: GAP-004

## Objective
Define a concrete and testable closure baseline for HIS deep integration so delivery can proceed without ambiguity across Admin and ProjectLead workflows.

## In-Scope Capabilities
1. Connector lifecycle management for HIS endpoints in the integration settings domain.
2. Mapping profile persistence for accreditation entities and HIS schemas.
3. Synchronization execution status visibility in role-appropriate dashboards.
4. Error telemetry surface with actionable retry outcomes.

## Acceptance Baseline
1. Service contracts are implemented in the HIS integration service layer under src/services/hisIntegration/.
2. Role access remains constrained to Admin and ProjectLead for configuration actions.
3. Sync operations expose deterministic status states: queued, running, succeeded, failed.
4. Failure outcomes include user-visible remediation guidance and retry entry point.
5. Regression tests cover connector configuration authorization and sync-state rendering.

## Delivery Artifacts
1. Existing HIS connector service files under src/services/hisIntegration/ are treated as the implementation backbone for Sprint 2 execution.
2. Route-level and role-level access controls are validated by existing role metadata and role access tests.
3. This scope document is the closure reference used by GAP-004 and backlog BK-005.

## Validation Evidence
1. Integration service module inventory exists in src/services/hisIntegration/.
2. Role-based route and dashboard gating evidence is tracked in src/router/routes.ts and role regression tests.
3. Gap register and implementation backlog reference this document as closure evidence.
