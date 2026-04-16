# AccrediTex — Next Phase Master Plan
**Version:** 3.0 — Strategic Realignment  
**Date:** April 2026  
**Classification:** Internal — Strategic  
**Vision:** Become the #1 AI-powered Healthcare Quality & Accreditation Management platform in the Middle East and Asia, then expand globally.

---

## Part 1 — Mission & Strategic North Star

### What AccrediTex Is
AccrediTex is an **AI-powered Healthcare Quality Management and Accreditation Management platform** designed for:

- **All scales:** From individual quality professionals to multi-site hospital networks
- **All programs:** JCI, CBAHI, DNV, CAP, ISO 15189, NABH, ISO 9001, HIMSS, and more
- **All regions:** Arabic/RTL-native for MENA; English + Asian language expansion next
- **All plans:** Tiered SaaS pricing from individual professionals to enterprise networks

### Where We Are Now (Live at accreditex.web.app)
| Module | Status | Notes |
|--------|--------|-------|
| 527-template library | ✅ Live | Favorites + ratings + Firestore analytics |
| AI Assistant (21+ tools) | ✅ Live | Groq/Llama 3.3-70b backend |
| Document Control | ✅ Live | Full lifecycle + TipTap editor |
| Risk Management Hub | ✅ Live | CAPA, RCA, 5-Why, Fishbone |
| Training/LMS | ✅ Live | CE credits, tracking |
| Audit Management | ✅ Live | Full lifecycle |
| Incident Management | ✅ Live | |
| Supplier Management | ✅ Live | |
| Multi-tenant / Whitelabel | ✅ Live | Brand tokens |
| Bilingual EN/AR + RTL | ✅ Live | 22 modules × 2 languages |
| Capacitor iOS/Android | ✅ Built | Needs store submission |
| HIS/LIMS Integration | ✅ Live | 18 HIS + 10 LIMS connectors |

---

## Part 2 — Selected Teams for the Next Phase

Based on the product vision, target market, and growth objectives, the following teams are activated:

### 🔵 TIER 1 — Core Execution (Active Every Sprint)

| Agent | Role | Why Selected |
|-------|------|-------------|
| **`@orchestrator`** | Sprint planning, cross-team coordination | Manages all 8 teams, resolves conflicts |
| **`@frontend-specialist`** | React 19, UI, TailwindCSS, mobile-first UX | Every feature needs production-grade UI |
| **`@backend-specialist`** | Firebase, Firestore, AI agent API | All data persistence and AI calls |
| **`@product-manager`** | Feature prioritization, customer-centric decisions | Ensures we build what users need |

### 🟢 TIER 2 — Phase-Specific (Activated Per Sprint)

| Agent | Role | Phase Activation |
|-------|------|-----------------|
| **`@mobile-developer`** | Capacitor iOS/Android, native features | Phase 1: App Store submission |
| **`@security-auditor`** | HIPAA/OWASP/Firestore rules, multi-tenant isolation | Phase 1 & ongoing |
| **`@database-architect`** | Firestore schema, indexes, rules | Phase 1: Multi-tenant schema hardening |
| **`@performance-optimizer`** | Lighthouse scores, bundle size, Core Web Vitals | Phase 2: <2s load on mobile 4G |

### 🟡 TIER 3 — Growth & Market (Activated for Go-To-Market)

| Agent | Role | Phase Activation |
|-------|------|-----------------|
| **`@seo-specialist`** | MENA/Asia search visibility, Arabic SEO | Phase 2: Regional SEO campaign |
| **`@test-engineer`** | Jest + Playwright, 80%+ coverage | Phase 1-2: Quality gates |
| **`@devops-engineer`** | CI/CD, Firebase + Render deploy, monitoring | Phase 1: Automated pipelines |
| **`@documentation-writer`** | Help center, onboarding docs, API docs | Phase 2: Self-serve onboarding |

### ⚫ RESERVE — Specialized (On-Demand)

| Agent | Trigger |
|-------|---------|
| **`@debugger`** | Any runtime error, TypeScript issue, Firebase rule violation |
| **`@penetration-tester`** | Before any major release — OWASP Top 10 check |
| **`@qa-automation-engineer`** | End-to-end Playwright suites for new modules |
| **`@code-archaeologist`** | When refactoring legacy code or understanding existing patterns |

---

## Part 3 — Next Phase Roadmap (April–December 2026)

### PHASE 6 — Foundation & Market Readiness (April–May 2026)
**Goal:** Lock the platform for production-grade use. Mobile apps in stores. Security hardened.

#### Sprint 6.1 — Mobile App Store Submission
**Team:** `@mobile-developer` + `@devops-engineer`
- [ ] Finalize iOS app icons, splash screens, App Store metadata (AR + EN)
- [ ] Finalize Android Play Store listing (AR + EN descriptions, screenshots)
- [ ] Capacitor native push notifications (appointment reminders, audit alerts)
- [ ] Biometric login (Face ID / fingerprint) via Capacitor Identity
- [ ] Offline-first mode: IndexedDB cache for critical screens (dashboard, audits)
- [ ] Submit to Apple App Store + Google Play Store

#### Sprint 6.2 — Security & Multi-Tenant Hardening
**Team:** `@security-auditor` + `@database-architect`
- [ ] Firestore rules audit — tenant isolation (no cross-tenant data leaks)
- [ ] HIPAA-aligned data handling review (PHI fields encrypted, audit logs immutable)
- [ ] Row-level security for all 13 Zustand stores
- [ ] API rate limiting on Render AI backend
- [ ] OWASP Top 10 penetration review
- [ ] Security badge / trust page for enterprise sales

#### Sprint 6.3 — SaaS Pricing & Subscription Engine
**Team:** `@backend-specialist` + `@product-manager`
- [ ] Define 4 plan tiers (see Part 4 — Pricing Model)
- [ ] Firebase plan gating: feature flags per tenant plan
- [ ] Stripe integration for subscription billing
- [ ] Usage metering (AI calls, documents, users per tenant)
- [ ] Plan upgrade/downgrade flow in Settings
- [ ] Free trial engine (14-day, card-free)

---

### PHASE 7 — AI Depth & Differentiation (May–July 2026)
**Goal:** Make AccrediTex's AI capabilities 3 years ahead of every competitor.

#### Sprint 7.1 — Predictive Compliance Intelligence
**Team:** `@backend-specialist` + `@frontend-specialist`
- [ ] AI Survey Risk Predictor: predicts accreditation outcome before surveyor visit
- [ ] Document Gap Auto-Filler: AI generates missing policy sections from scratch
- [ ] Real-time compliance score trends (daily tracking, Recharts sparklines)
- [ ] Accreditation readiness countdown with AI task prioritization
- [ ] Surveyor Question Bank (JCI, CBAHI, DNV): AI-powered drill practice

#### Sprint 7.2 — AI Clinical Intelligence Layer
**Team:** `@backend-specialist` + `@frontend-specialist`
- [ ] Clinical Indicator Benchmarking: compare KPIs against MENA/Asia regional averages
- [ ] Patient Safety Event AI Classifier: automatic severity/category on incident creation
- [ ] Predictive CAPA: AI suggests corrective actions based on incident patterns
- [ ] Drug Formulary & Infection Control standard auto-checks (CBAHI-specific)

#### Sprint 7.3 — Intelligent Onboarding & Guided Tours
**Team:** `@frontend-specialist` + `@product-manager`
- [ ] Role-based onboarding wizard (Quality Manager / Surveyor / CEO / Individual)
- [ ] Interactive product tour (step-by-step, with confetti on completion)
- [ ] Accreditation program selector wizard at account creation
- [ ] "What to do today" AI daily briefing on dashboard
- [ ] Progress gamification: badges, streaks, readiness percentage on profile

---

### PHASE 8 — Regional Expansion: Middle East & Asia (July–September 2026)
**Goal:** Win MENA and Southeast Asia markets. Localize deeply beyond translation.

#### Sprint 8.1 — Language & Locale Expansion
**Team:** `@frontend-specialist` + `@documentation-writer`
- [ ] Add **Turkish** language support (Turkey is top-3 medical tourism dest.)
- [ ] Add **Urdu** language support (Pakistan: 200M+ population, growing healthcare)
- [ ] Add **Bahasa (Indonesian/Malay)** support (250M+ population, JCI-active)
- [ ] Add **French** support (North Africa: Algeria, Morocco, Tunisia)
- [ ] Calendar: Hijri/Gregorian dual-calendar support for Saudi/UAE deadlines
- [ ] Right-to-left (RTL) audit for new languages

#### Sprint 8.2 — Regional Accreditation Programs
**Team:** `@backend-specialist` + `@product-manager`
- [ ] HIMSS EMRAM (Digital maturity — UAE, KSA, Qatar mandate)
- [ ] ISO 45001 (Occupational Health & Safety — required by many MENA regulators)
- [ ] Thailand HA (Thai Healthcare Accreditation — SE Asia entry point)
- [ ] NABH (India — 800M healthcare market entry)
- [ ] MOH Saudi / MOH UAE compliance checklists (government regulatory)
- [ ] DOH Abu Dhabi / HAAD standards module

#### Sprint 8.3 — MENA Go-To-Market Engine
**Team:** `@seo-specialist` + `@product-manager`
- [ ] Arabic SEO: target "اعتماد JCI", "CBAHI accreditation software", "برنامج جودة المستشفيات"
- [ ] Landing page variants per country (KSA, UAE, Egypt, Pakistan, Indonesia)
- [ ] Case study builder for early adopters (anonymized, Arabic + English)
- [ ] WhatsApp Business integration for demo requests (primary sales channel MENA)
- [ ] Referral program: quality consultants earn commission per referred hospital

---

### PHASE 9 — Enterprise Scale & Integration (September–November 2026)
**Goal:** Land multi-site hospital groups and healthcare networks.

#### Sprint 9.1 — Enterprise Multi-Site Management
**Team:** `@backend-specialist` + `@database-architect`
- [ ] Network Dashboard: aggregate compliance across 2–50 sites
- [ ] Cross-site benchmarking (which site scores highest in which standard)
- [ ] Centralized policy distribution: push documents from HQ to all sites
- [ ] Site-level vs. network-level role permissions
- [ ] Network-wide incident roll-up and trend analysis

#### Sprint 9.2 — EHR / HIS Deep Integration
**Team:** `@backend-specialist`
- [ ] HL7 FHIR R4 connector (global standard for EHR interoperability)
- [ ] Epic / Cerner webhook adapters (for US-expansion readiness)
- [ ] Existing HIS integration hardening (18 connectors → production-ready APIs)
- [ ] Lab (LIMS) result auto-import into clinical indicator tracking
- [ ] Automated KPI population from HIS (census, infection rates, mortality)

#### Sprint 9.3 — Public API & Partner Ecosystem
**Team:** `@backend-specialist` + `@devops-engineer`
- [ ] REST API v1 with API key management per tenant
- [ ] Webhook system (notify external systems on document approval, audit close)
- [ ] Partner portal for accreditation consultants
- [ ] SDK / embeddable widget for consultant-built apps
- [ ] API documentation (OpenAPI 3.0, hosted on docs.accreditex.app)

---

### PHASE 10 — Global Expansion Readiness (December 2026)
**Goal:** Prepare for US, UK, and EU market entry.

- [ ] HIPAA Business Associate Agreement (BAA) flow for US hospitals
- [ ] GDPR data residency controls for EU tenants
- [ ] SOC 2 Type II compliance preparation
- [ ] TJC (The Joint Commission) full standard library
- [ ] NHS standard compliance checklists (UK entry)
- [ ] Localization: German, Spanish (Latin America), Portuguese (Brazil)
- [ ] US pricing page and Stripe USD billing

---

## Part 4 — SaaS Pricing Model (4-Tier)

### Aligned to Customer Scale & Need

| Plan | Target | Price | Core Features |
|------|--------|-------|---------------|
| **🟢 Solo** | Individual quality professionals, consultants | Free forever | 1 user, 3 projects, 50 documents, 5 AI queries/day, 100 templates |
| **🔵 Clinic** | Small clinics, diagnostic labs, dental chains | $49/month | Up to 10 users, unlimited projects, 500 documents, full AI access, all templates, 2 accreditation programs |
| **🏥 Hospital** | Mid-size hospitals, single-site | $199/month | Up to 50 users, unlimited everything, all AI tools, all programs, HIS connectors, priority support |
| **🏢 Network** | Multi-site hospital groups, MOH departments | Custom | Unlimited users + sites, network dashboard, API access, custom onboarding, SLA, dedicated CSM |

### Plan Feature Matrix

| Feature | Solo | Clinic | Hospital | Network |
|---------|------|--------|----------|---------|
| AI Assistant queries | 5/day | 100/day | Unlimited | Unlimited |
| Template library access | 100 | All 527 | All 527 | All 527 + custom |
| Accreditation programs | 1 | 2 | All 7+ | All + custom |
| Document control | Basic | Full | Full + change control | Enterprise |
| Risk & CAPA management | View only | Full | Full | Full |
| Training LMS | No | Yes | Yes + CE credits | Yes + custom courses |
| Mobile app | PWA | Native app | Native app | Native app |
| HIS/EHR integration | No | No | Yes | Yes + FHIR |
| Multi-site dashboard | No | No | No | Yes |
| API access | No | No | No | Yes |
| White-label | No | No | Optional ($+) | Yes |
| SLA | None | Email 48h | Email 24h | Dedicated CSM + SLA |
| Language | EN / AR | EN / AR | EN / AR + 2 more | All languages |

---

## Part 5 — Quality KPIs & Success Metrics

### Platform Health (Monthly)
| Metric | Current | Phase 6 Target | Phase 8 Target |
|--------|---------|----------------|----------------|
| Lighthouse Performance | ~85 | >90 | >95 |
| Lighthouse Accessibility | ~88 | >95 | >98 |
| Mobile Load Time (4G) | ~3.2s | <2s | <1.5s |
| Test Coverage | ~45% | >70% | >80% |
| TypeScript errors | ~12 | 0 | 0 |

### Business (Quarterly)
| Metric | Q2 2026 | Q3 2026 | Q4 2026 |
|--------|---------|---------|---------|
| Registered tenants | 10 | 50 | 200 |
| Paying customers | 2 | 15 | 80 |
| MRR | $400 | $3,000 | $16,000 |
| Countries active | 2 (KSA, UAE) | 5 | 10 |
| Templates used (Firestore) | 500/mo | 5,000/mo | 25,000/mo |
| App Store downloads | 0 | 500 | 2,000 |

---

## Part 6 — Team Activation Map (Who Does What)

```
SPRINT STRUCTURE (2 weeks)
─────────────────────────────────────────────────────
Week 1: @orchestrator plans → @frontend-specialist + @backend-specialist build
Week 2: @test-engineer validates → @security-auditor reviews → @devops-engineer deploys
─────────────────────────────────────────────────────

FEATURE REQUEST FLOW
User Request
    → @orchestrator routes to right team
    → @product-manager validates against roadmap
    → @frontend-specialist (UI) + @backend-specialist (data) build in parallel
    → @test-engineer writes tests
    → @security-auditor reviews (especially auth/rules)
    → @devops-engineer deploys
    → @seo-specialist updates landing page content (if user-facing)
─────────────────────────────────────────────────────

BUG FLOW
Error reported
    → @debugger diagnoses (always first)
    → @code-archaeologist if it's legacy code
    → @frontend-specialist or @backend-specialist fixes
    → @test-engineer adds regression test
─────────────────────────────────────────────────────

RELEASE FLOW (every 2 weeks)
    → @penetration-tester (OWASP check on changed surfaces)
    → @performance-optimizer (Lighthouse delta check)
    → @devops-engineer (firebase deploy + Render redeploy)
    → @documentation-writer (changelog + help center update)
```

---

## Part 7 — Immediate Next Steps (This Week)

### Priority 1 — SaaS Subscription Engine
Build plan gating in Firebase so features are unlocked per tenant plan. This is the revenue unlock.

**Files to create/update:**
- `src/types/subscription.ts` — Plan enum, PlanFeatures type
- `src/stores/useSubscriptionStore.ts` — Current plan, feature gate checks
- `src/services/subscriptionService.ts` — Firestore reads/writes for plan
- `src/components/common/PlanGate.tsx` — HOC that blocks UI based on plan
- `src/pages/PricingPage.tsx` — Beautiful pricing page (4 tiers)
- `src/pages/UpgradePage.tsx` — Stripe checkout flow

### Priority 2 — Mobile App Store Preparation
Submit Capacitor builds to both stores. Mobile = key differentiator for field auditors.

**Actions:**
- `npx cap build ios` → Xcode → App Store Connect
- `npx cap build android` → Android Studio → Play Console
- App Store screenshots in Arabic + English
- App description optimized for "accreditation", "hospital quality", "CBAHI", "JCI"

### Priority 3 — Onboarding Wizard
First 5 minutes = retention. A guided wizard that asks role → programs → goals.

**Files to create:**
- `src/components/onboarding/OnboardingWizard.tsx`
- `src/components/onboarding/RoleSelector.tsx`
- `src/components/onboarding/ProgramSelector.tsx`
- `src/components/onboarding/GoalSetter.tsx`

---

## Part 8 — Competitive Intelligence Summary

### Why We Win in Middle East & Asia

| Advantage | vs. Competition |
|-----------|----------------|
| **Native Arabic + RTL** | Zero competitors offer true Arabic-first design |
| **CBAHI + JCI + MOH** | Most tools are US/EU-centric (TJC, ISO 13485) |
| **AI at every tier** | Competitors gate AI behind $50K+ enterprise plans |
| **Price** | $49/mo vs. $50K+/yr for equivalent enterprise tools |
| **Speed to value** | Free trial → first compliance report in <10 minutes |
| **Mobile-first** | Field auditors use phones; competitors built for desktops |
| **Template library** | 527 ready-to-use templates vs. blank-slate competitors |

### Why We Win Globally (2027+)

| Advantage | How We Scale It |
|-----------|----------------|
| **AI moat** | Proprietary training on MENA accreditation data |
| **Multi-language** | 6 languages by end of 2026 |
| **FHIR integration** | Universal EHR connector for US/EU |
| **API ecosystem** | Consultant partner network locks in accounts |
| **Network effects** | Benchmarking data gets more valuable with each new hospital |

---

*This document supersedes all previous roadmap documents (FEATURE_DEVELOPMENT_ROADMAP.md, MARKET_ANALYSIS_ENHANCEMENT_PLAN.md for planning purposes). Those files are retained for historical reference.*
