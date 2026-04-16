# Landing & Login UX Plan (Fact-Based, Organization-First)

Date: March 17, 2026  
Scope: Public landing and login experience aligned to AccreditEx real product logic  
Status: Revised from assumptions to verified facts

Progress Update:
- 2026-03-17: Slice B1 completed (login forgot-password flow + enterprise access guidance + EN/AR i18n updates).
- 2026-03-17: Slice A1 completed (landing hero/CTA/pricing copy realigned from consumer self-serve to enterprise procurement journey).
- 2026-03-17: Slice A2 completed (proof/claim audit — fixed stats to verified counts, corrected TrustBar standards to OHAS-only, removed unverifiable SOC 2/HIPAA claims, updated competitive table).
- 2026-03-17: Slice C completed (trust hardening — AI Engine heading updated to 18+, Standards Library feature card corrected, full claim matrix documented in governance).
- 2026-03-17: Slice D completed (quality gates — zero TypeScript errors, accessibility verified, responsive patterns confirmed).

**Status: ALL SLICES COMPLETE (B1, A1, A2, C, D)**

---

## 1) Product Purpose (Verified)

AccreditEx is a B2B healthcare accreditation platform for organizations, not individual consumers.

Verified from code and docs:
- Multi-tenant organization model exists (`Organization` type + tenant store + tenant-aware Firestore query helpers).
- Role-based access model exists (`Admin`, `ProjectLead`, `TeamMember`, `Auditor`, `Viewer`).
- Platform scope is organizational workflows: departments, audits, risks, training, accreditation standards, document control.
- Login path is authenticated app access; there is no public self-serve onboarding flow in `LoginPage`.

References:
- [src/types/index.ts](src/types/index.ts#L1)
- [src/stores/useTenantStore.ts](src/stores/useTenantStore.ts#L1)
- [src/utils/tenantQuery.ts](src/utils/tenantQuery.ts#L1)
- [src/stores/useUserStore.ts](src/stores/useUserStore.ts#L1)
- [README.md](README.md#L1)

---

## 2) What Exists Today (Reality Check)

### Landing Page already includes enterprise-oriented sections
- Navbar links to Features, AI Engine, Market, Pricing, Team, FAQ.
- Sections present: Hero, TrustBar, Problem, Features, AI Engine, Market, Competitive comparison, Pricing, Team, Roadmap, FAQ, CTA, Footer.
- Current messaging still mixes enterprise positioning with startup/investor language (for example trial-first and founder-centric copy).

Reference:
- [src/pages/LandingPage.tsx](src/pages/LandingPage.tsx#L1)

### Login Page current behavior
- Email/password authentication with Firebase.
- Optional biometric login (native platforms).
- Basic form with remember checkbox + forgot password link placeholder (`href="#"`).
- No organization selector, SSO/SAML, or true forgot-password flow in this page.

Reference:
- [src/pages/LoginPage.tsx](src/pages/LoginPage.tsx#L1)

---

## 3) Corrections to Prior Plan

These items were incorrect or overstated and are now corrected:
- Remove assumptions that key enterprise sections are missing from landing (many already exist).
- Remove fake completion marks like "done" for features not implemented.
- Do not position primary growth around individual free-trial conversion.
- Do not propose public self-signup as primary auth path; app logic is organization/user-admin managed.
- Replace generic SaaS copy goals with procurement-oriented healthcare enterprise outcomes.

---

## 4) Real Gaps to Fix (Organization-First)

### Landing gaps (content and conversion quality)
1. Clarify buying persona by section: Quality Director, Compliance Lead, CIO/IT, CFO.
2. Rework hero and CTA hierarchy from self-serve language to enterprise journey:
- Primary CTA: Request Demo
- Secondary CTA: Talk to Sales / Download Security Pack
3. Replace weak/unverified claims with defensible proof blocks:
- Security posture (what is actually available now)
- Standards coverage (already present)
- Integration readiness (HIS/LIMS statements backed by implemented services)
4. Keep competitive section, but add source basis or soften language to avoid unverifiable assertions.
5. Align pricing language with organizational packaging (facility/team/enterprise contract style), not individual plan psychology.
6. Reduce founder/investor-heavy tone on public buyer path; keep separate investor path (pitch link can remain but deprioritized).

### Login gaps (enterprise access UX)
1. Implement real forgot-password flow (Firebase reset) instead of placeholder link.
2. Add explicit enterprise access guidance:
- "Need access? Contact your hospital admin"
- "Your account is provisioned by your organization"
3. Keep biometric as convenience, but not primary path.
4. Preserve login simplicity unless backend supports SSO/IdP flow; do not fake SSO UI if no functional backend.
5. Improve error handling copy for enterprise users (invalid credentials vs account not provisioned).

---

## 5) Updated Implementation Plan

### Phase A: Messaging and IA alignment (Landing)
- Reframe hero and above-the-fold copy for organization buyers.
- Update CTA set: Request Demo + Sales Contact + Security/Compliance brief.
- Keep existing section structure; refine copy and trust architecture instead of rebuilding page.

Deliverables:
- Revised landing copy map by persona
- CTA behavior map
- Claim validation checklist

### Phase B: Enterprise auth UX correctness (Login)
- Implement real forgot-password action.
- Add enterprise account-provisioning guidance text.
- Improve validation and error states without adding unsupported auth modalities.

Current state:
- Completed: forgot-password action wired to Firebase Auth reset email.
- Completed: enterprise provisioning guidance text added to login form.
- Completed: enterprise-aware invalid-credential messaging added.

Deliverables:
- Functional reset-password UX
- Enterprise access guidance block
- Updated login microcopy and states

### Phase C: Trust and proof hardening
- Audit every trust/security/integration claim against current implementation.
- Keep only verifiable claims in landing and footer.
- Add documentation links where possible (security, integration, support paths).

Deliverables:
- Claim matrix: "shown claim -> source in repo/docs"
- Final approved proof blocks

### Phase D: Quality gates
- Accessibility pass (focus states, contrast, keyboard flow).
- Mobile pass for landing and login.
- Lighthouse baseline + post-change comparison.

Deliverables:
- Accessibility checklist results
- Responsive QA report
- Lighthouse delta report

---

## 6) Do / Do Not Rules for Next UI Iteration

Do:
- Optimize for organizational procurement and rollout.
- Keep copy specific to healthcare compliance operations.
- Tie all major claims to real features already implemented.

Do not:
- Design flows for individual consumer onboarding.
- Add pseudo-enterprise controls (SSO/SAML toggles) without backend support.
- Mark roadmap items as complete before implementation.

---

## 7) Success Metrics (B2B-Appropriate)

Primary:
- Demo-request conversion rate from landing.
- Qualified inbound lead rate (org email, role, facility size).
- Login success rate for provisioned enterprise users.

Secondary:
- Reduced login support tickets for password/access confusion.
- Accessibility conformance improvements.
- Performance parity or better after UI updates.

---

## 8) Recommended Next Build Slice

1. Landing copy and CTA rewrite only (no structural rebuild).  
2. Login: real forgot-password implementation + enterprise guidance text.  
3. Proof/claim audit pass before adding new sections.

This sequence gives immediate business alignment with minimal risk and avoids building features that conflict with current platform architecture.
