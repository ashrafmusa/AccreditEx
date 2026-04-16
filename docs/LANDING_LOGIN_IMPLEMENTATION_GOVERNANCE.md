# Landing/Login Upgrade Governance (Execution + Agent Team)

Date: March 17, 2026  
Status: Active

## Purpose
This document controls how landing/login upgrades are implemented safely, with clear ownership, validation, and documentation updates after each change.

## Scope
- Public landing experience (`src/pages/LandingPage.tsx`)
- Login experience (`src/pages/LoginPage.tsx`)
- Supporting i18n strings (`src/data/locales/en/common.ts`, `src/data/locales/ar/common.ts`)

## Operating Rules
1. Every change must map to the fact-based plan in `docs/LANDING_LOGIN_UI_UX_ENHANCEMENT_PLAN.md`.
2. No unsupported enterprise features are surfaced in UI (example: fake SSO toggles).
3. All user-facing strings use i18n keys in EN + AR.
4. Validate after each change: type checks/lint errors for touched files.
5. Update this file and the main plan after each completed slice.

## Agent Team Matrix
- `frontend-specialist`: component/UI implementation, responsive behavior.
- `debugger`: runtime/type error diagnosis after each patch.
- `test-engineer`: add/adjust tests for new auth/UX behavior.
- `performance-optimizer`: verify no regressions in landing/login performance.
- `security-auditor`: auth messaging and security posture claim checks.
- `documentation-writer`: synchronize docs after implementation slices.

## Current Implementation Slices

### Slice B1 (Completed)
Goal: Enterprise-safe login support improvements.

Changes:
- Implemented real forgot-password flow using Firebase `sendPasswordResetEmail`.
- Added enterprise provisioning guidance message.
- Improved invalid credential messaging for organization-provisioned accounts.
- Added new i18n keys in EN + AR.

Files:
- `src/pages/LoginPage.tsx`
- `src/data/locales/en/common.ts`
- `src/data/locales/ar/common.ts`

Risk control:
- No auth model changes, only UX behavior over existing Firebase auth.
- Biometric flow preserved.

### Slice A1 (Completed)
Goal: Landing hero and CTA copy alignment to enterprise procurement journey.

Changes:
- Hero CTA: "Start Free Trial" → "Request a Demo", "Explore Features" → "Talk to Sales".
- Hero copy: Reframed from personal/founder tone to organization-buyer messaging.
- Hero trust badges: "No credit card required" → "Enterprise-grade security".
- Navbar: "Launch App" → "Request Demo" with mailto demo request link.
- CTA Section: "Start Free Trial" → "Request a Demo", "Contact Founder" → "Talk to Sales".
- CTA trust badges: "14-day free trial" / "No credit card" → "Enterprise-grade security" / "CBAHI, JCI, ISO 15189 ready" / "Deployed in under a week".
- Pricing: Core "Get Started" → "Request a Demo", Enterprise "Start Free Trial" → "Request a Demo". All CTA hrefs now use mailto with subject-based routing.

Files:
- `src/pages/LandingPage.tsx`

Risk control:
- No structural/component changes — copy and href updates only.
- All existing sections preserved: Hero, TrustBar, Problem, Features, AIEngine, Market, Competitive, Pricing, Team, Roadmap, FAQ, CTA, Footer.
- No new dependencies added.

### Slice A2 (Completed)
Goal: Landing proof/claim audit pass — verify all trust, security, and integration claims against implemented code.

Audit findings and corrections:
- Stats: "15+ AI-Powered Tools" → "18+" (verified 18 distinct AI capabilities in ai.ts + aiDocumentGeneratorService.ts).
- Stats: "240+ Standards Loaded" → "256" (verified exact count in standards.json, OHAS chapters).
- Stats: "1,043 Sub-Standards" → "1,100+" (verified ~1,118 sub-standards/measures across all chapters).
- TrustBar: Removed false claim of supporting CBAHI/JCI/DOH/DHA — only OHAS is loaded. Changed to "OHAS (256 Standards)" with other bodies marked "Coming Soon" or "Planned".
- Hero trust badges: "SOC 2-ready" / "HIPAA-aligned" removed — replaced with verifiable claims: "Role-based access control", "Multi-tenant data isolation", "Firebase-secured infrastructure".
- Competitive section: "GCC Regional Templates ✓ DOH/DHA/MOH" → "GCC Regional Standards ✓ OHAS (expanding)". AI tools count updated to 18+. Standards count to "256 / 1,100+ Sub".
- CTA section bottom badges: "CBAHI, JCI, ISO 15189, DOH Abu Dhabi" → "OHAS, CBAHI (Soon), JCI (Planned), ISO 15189 (Planned)".

Files:
- `src/pages/LandingPage.tsx`

Risk control:
- All changes are copy/data corrections only — no structural changes.
- All stats now traceable to verified source data.

### Slice C (Completed)
Goal: Trust and proof hardening — ensure all remaining claims are defensible.

Changes:
- AI Engine section heading: "15+ AI-Powered Tools" → "18+ AI-Powered Tools" (aligned with verified count).
- Features section Standards Library card: "Pre-loaded accreditation programs (CBAHI, JCI, DOH) with 240+ standards and 1,043 sub-standards" → "Pre-loaded accreditation standards (OHAS) with 256 standards and 1,100+ sub-standards. More programs coming soon."

Claim audit matrix (all claims now verified):
| Claim | Status | Source |
|---|---|---|
| 18+ AI Tools | ✅ Verified | src/services/ai.ts, aiDocumentGeneratorService.ts |
| 256 Standards | ✅ Verified | src/data/standards.json |
| 1,100+ Sub-Standards | ✅ Verified | src/data/standards.json measures |
| Role-based access | ✅ Verified | firestore.rules (isAdmin, isProjectLead, etc.) |
| Multi-tenant isolation | ✅ Verified | src/utils/tenantQuery.ts, useTenantStore |
| Firebase-secured | ✅ Verified | firestore.rules, storage.rules |
| OHAS standards loaded | ✅ Verified | src/data/programs.json, standards.json |
| HIS integration support | ✅ Partial | src/services/hisIntegration/ (framework exists) |
| Bilingual EN/AR | ✅ Verified | src/data/locales/ (22 EN + 22 AR modules) |

Files:
- `src/pages/LandingPage.tsx`

### Slice D (Completed)
Goal: Quality gates — accessibility pass, mobile responsiveness, TypeScript validation.

Results:
- TypeScript: Zero errors across all modified files (LandingPage.tsx, LoginPage.tsx, en/common.ts, ar/common.ts).
- Accessibility: All new CTAs use semantic `<a>` tags with meaningful hrefs (mailto with subjects). No new a11y regressions introduced. Mobile menu retains `aria-label`.
- Mobile responsiveness: All changes use existing responsive class patterns (`flex-wrap`, responsive text sizing `sm:text-5xl lg:text-6xl`). No hardcoded pixel widths introduced.
- Pre-existing accessibility gaps in the broader landing page (missing aria attributes on most sections) are noted but out of scope for this initiative.

Files verified:
- `src/pages/LandingPage.tsx` — zero errors
- `src/pages/LoginPage.tsx` — zero errors
- `src/data/locales/en/common.ts` — zero errors
- `src/data/locales/ar/common.ts` — zero errors

## Implementation Complete

All 5 slices (B1, A1, A2, C, D) have been completed successfully. The landing/login experience is now aligned with AccreditEx's B2B enterprise positioning with defensible claims backed by verified code.

### Post-Slice: LoginForm Component Sync (Completed)
Goal: Sync the standalone `LoginForm.tsx` component with the same forgot-password flow implemented in Slice B1.

Changes:
- Replaced `<a href="#">` placeholder with real `sendPasswordResetEmail` flow.
- Added `resetLoading`/`resetNotice` state for UX feedback.
- Added enterprise access guidance text using `t("enterpriseAccessNotice")`.
- Uses same i18n keys already added in Slice B1 (enterEmailForReset, sendingReset, passwordResetSent, passwordResetFailed, enterpriseAccessNotice).

Files:
- `src/components/auth/LoginForm.tsx`

Risk control:
- Component is currently unused (not imported anywhere), so zero runtime risk.
- Ensures consistency if/when component is activated.

## Documentation Update Protocol
After each slice:
1. Update this governance file with completed scope and risks.
2. Update `docs/LANDING_LOGIN_UI_UX_ENHANCEMENT_PLAN.md` progress notes.
3. Add brief changelog entry in PR/commit notes.

## Rollback Strategy
- Keep changes limited to touched files for each slice.
- If regression appears, revert only last slice files.
- Do not modify unrelated modules during landing/login upgrades.
