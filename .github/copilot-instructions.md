# AccrediTex — GitHub Copilot Instructions (Powered by Agentica v2)

# Auto-loaded by GitHub Copilot Chat in this workspace.

## Project: AccrediTex

**AccrediTex** is a SaaS accreditation management platform.

**Full Stack:**

- **Frontend:** React 19, TypeScript 5.8, TailwindCSS v4, Framer Motion v11
- **Routing:** react-router-dom v7 (`src/router/AppRouter.tsx`)
- **State:** Zustand v5 (`src/stores/`)
- **Rich text:** TipTap v3
- **Charts:** Recharts v3
- **Backend/DB:** Firebase v12 — Firestore, Auth, Storage (`src/firebase/`, `src/services/`)
- **Mobile:** Capacitor v8 — iOS + Android (`android/`, `ios/`)
- **Build:** Vite v6
- **Testing:** Jest 30 + Testing Library + Playwright
- **Deploy:** Firebase Hosting + Render

**Security model:** Firestore security rules in `firestore.rules`. Storage rules in `storage.rules`.

---

## Which Agent To Use (Auto-selected based on request)

| Task                                  | Agent                    | Loads Skill                                       |
| ------------------------------------- | ------------------------ | ------------------------------------------------- |
| React components, UI, TailwindCSS     | `@frontend-specialist`   | `accreditex-architecture` + `accreditex-ui`       |
| Firebase queries, services, Firestore | `@backend-specialist`    | `accreditex-architecture` + `accreditex-firebase` |
| Capacitor iOS/Android features        | `@mobile-developer`      | `accreditex-architecture`                         |
| Firestore schema, indexes, rules      | `@database-architect`    | `accreditex-architecture` + `accreditex-firebase` |
| Any bug, error, TypeScript error      | `@debugger`              | `accreditex-architecture`                         |
| Auth, Firestore rules, JWT, security  | `@security-auditor`      | `accreditex-architecture` + `accreditex-firebase` |
| GitHub Actions, Firebase deploy       | `@devops-engineer`       | `accreditex-architecture`                         |
| Jest unit tests, Playwright E2E       | `@test-engineer`         | `accreditex-architecture`                         |
| Performance, Lighthouse, bundle size  | `@performance-optimizer` | `accreditex-architecture` + `accreditex-ui`       |
| Multi-feature planning                | `@orchestrator`          | `accreditex-architecture` + `accreditex-roadmap`  |

---

## AccrediTex Agent Skills (Loaded Automatically)

All agents load project-specific skills from `.agent/skills/`:

| Skill                     | File                                             | Purpose                                                                   |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| `accreditex-architecture` | `.agent/skills/accreditex-architecture/SKILL.md` | Full codebase map, architecture rules, store list, naming conventions     |
| `accreditex-firebase`     | `.agent/skills/accreditex-firebase/SKILL.md`     | Firestore collection map, service patterns, auth, storage, security rules |
| `accreditex-ui`           | `.agent/skills/accreditex-ui/SKILL.md`           | Brand tokens, TailwindCSS v4, i18n, component templates, dark mode        |
| `accreditex-roadmap`      | `.agent/skills/accreditex-roadmap/SKILL.md`      | Feature status, build phases, quality gates, agent assignment             |

---

## AccrediTex Workflows

| Workflow       | Use When                                                    |
| -------------- | ----------------------------------------------------------- |
| `/feature`     | Building any new feature (component, service, page, widget) |
| `/orchestrate` | Complex multi-agent tasks                                   |
| `/debug`       | Bug investigation                                           |
| `/deploy`      | Firebase Hosting deploy                                     |
| `/test`        | Run tests                                                   |
| `/plan`        | Feature planning                                            |

---

## AccrediTex Architecture Rules

### State Management

```typescript
// ✅ Always use Zustand stores — never local useState for shared data
// Store location: src/stores/use{Name}Store.ts
// 13 total stores: Core (useAppStore), Projects, Auth (useUserStore),
// Theme (useCustomizationStore), AI, HIS, Lab, Workflow, Reports,
// ChangeControl, Modules, Suppliers, Tenant
import { useProjectStore } from "@/stores/useProjectStore";
const projects = useProjectStore((state) => state.projects);
```

### Firebase Queries — Services Layer

```typescript
// ✅ All Firestore queries go in src/services/ or src/firebase/
// NEVER query Firestore directly from a component
// src/services/projectService.ts
export async function getProject(id: string): Promise<Project | null> {
  const ref = doc(db, "projects", id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Project) : null;
}
```

### Internationalization (MANDATORY)

```typescript
// ✅ ALL user-facing strings MUST use i18n — no hardcoded English strings
// Real i18n system: src/data/locales/ (22 EN + 22 AR module files)
// ✅ Provider location: src/components/common/LanguageProvider
import { useLanguage } from '@/components/common/LanguageProvider';
const { t, lang } = useLanguage();
return <h1>{t('dashboard.title')}</h1>;

// ⚠️ Document names in Firestore are { en: string; ar: string }
// ALWAYS use optional chaining — older docs may have undefined name:
const name = doc.name?.[lang] || doc.name?.en || doc.id;
```

### Type Safety — No `any`

```typescript
// ✅ All types in src/types/
// ❌ NEVER use 'any'
// ❌ NEVER use ts-ignore without explanation
```

### TailwindCSS v4 + Brand Tokens

```tsx
// ✅ Use brand tokens — they support whitelabeling and dark mode
className = "bg-brand-background dark:bg-dark-brand-background";
className = "text-brand-text-primary dark:text-dark-brand-text-primary";
className = "bg-brand-primary hover:bg-brand-primary/90";

// ❌ NEVER use purple/violet/indigo as primary colors in AccrediTex
// ❌ NEVER use hardcoded hex colors in className
```

### Icons — Check icons.tsx First

```typescript
// Icons are in src/components/icons.tsx (custom set)
// ⚠️ NOT all HeroIcon names exist here
// ❌ ShieldExclamationIcon does NOT exist → use ShieldCheckIcon
// ✅ Always verify against src/components/icons.tsx before using
```

### Navigation Pattern

```typescript
// Navigation is driven by setNavigation() from useAppStore
const setNavigation = useAppStore((state) => state.setNavigation);
setNavigation({ view: "documentControl" });
setNavigation({ view: "capa", filter: "open" });
```

### Testing Rules

```typescript
// Unit tests: src/test/**/*.test.ts | *.test.tsx
// AAA pattern mandatory:
it('should update project name', async () => {
  // Arrange
  const { getByRole } = render(<ProjectForm />);
  // Act
  await userEvent.type(getByRole('textbox', { name: /name/i }), 'New Name');
  // Assert
  expect(getByRole('textbox', { name: /name/i })).toHaveValue('New Name');
});

// Mock Firebase:
jest.mock('@/firebase/firebaseConfig');
```

### Mobile (Capacitor) — Use mobile-developer ONLY

```typescript
// ✅ Capacitor APIs — always check platform first
import { Capacitor } from "@capacitor/core";
if (Capacitor.isNativePlatform()) {
  // native-only code
}
// ❌ NEVER use mobile-specific code without platform checks
```

---

## Known Patterns & Pitfalls

| Pattern            | Rule                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Dashboard title    | Use `t("welcomeBack")!` — already contains `{name}` placeholder replaced by `DashboardHeader`         |
| Document names     | Always `doc.name?.[lang] \|\| doc.name?.en \|\| doc.id` — never `doc.name[lang]`                      |
| Globe canvas style | `transition: "opacity 1s ease"` — Prettier may corrupt this to `transition,` → always explicit string |
| New widgets        | Add to `src/components/dashboard/` and wire into the relevant role dashboard                          |
| Store selection    | Extend existing stores — don't create new ones unless truly a new domain                              |

---

## Quick Commands

```bash
npm run dev              # Start dev server
npm run test             # Run Jest unit tests
npm run test:coverage    # Tests with coverage report
npm run test:e2e         # Run Playwright E2E
npm run build            # Production build
firebase deploy --only hosting   # Deploy to accreditex.web.app
npx cap sync             # Sync web → mobile
```

---

## Auto-Recording — Session Start Protocol (MANDATORY)

**BEFORE DOING ANYTHING ELSE at the start of every session:**

1. Check if `logs/pending-reasoningbank.jsonl` exists and is non-empty:
   ```
   read_file("logs/pending-reasoningbank.jsonl")
   ```
2. If the file has entries, for **each JSON line** call `reasoningbank_record` with:
   - `task` → the `task` field
   - `decision` → the `decision` field
   - `outcome` → the `outcome` field
   - `success` → the `success` field (boolean)
   - `tags` → the `tags` array
3. After recording ALL entries, **clear the file** (write empty string to it)
4. Call `reasoningbank_distill` once after processing ≥ 3 entries
5. Only then proceed to the user's request

---

## MCP Tools — MANDATORY Workflow (Every Task)

**These steps are REQUIRED for every task — features, bug fixes, debugging, refactors, and analysis.**

### Before starting ANY task:

1. `reasoningbank_retrieve` — search for prior solutions to this exact problem
2. `memory_search` — find any stored context about this component/file
3. `router_route` — confirm the optimal model/strategy

### After completing ANY task successfully:

4. `reasoningbank_record` — record what was done, why it worked, and what to avoid
   - Include: `task`, `decision`, `outcome`, `success: true`, relevant `tags`
   - Tags must include: component names, error type, pattern name, "accreditex"
5. `reasoningbank_distill` — call after every 3–5 recorded decisions to extract reusable patterns

---

## Folder Structure

```
src/
├── components/      # 295+ feature components across 33 domains
│   ├── ai/         # AI assistant components
│   ├── common/     # Layout, Nav, Theme, Toast (includes LanguageProvider)
│   ├── dashboard/  # Role dashboards + shared widgets
│   └── [domain]/   # One folder per feature domain
├── pages/          # 39 page components (route-level)
├── stores/         # 13 Zustand state stores
├── services/       # 107+ Firebase/API service functions
│   ├── hisIntegration/  # 18 HIS connector files
│   └── limsIntegration/ # 10 LIMS connector files
├── firebase/       # Firebase config + hooks
├── hooks/          # 27 custom React hooks
├── types/          # 12 TypeScript type definitions
├── utils/          # 37 pure utility functions
├── data/locales/   # ✅ i18n translations (22 EN + 22 AR modules) — PRIMARY SYSTEM
├── router/         # AppRouter.tsx + routes.ts (34 routes)
├── test/           # Jest test setup
└── i18n/           # ⚠️ Legacy (ar.js only) — do not use for new code

.agent/
├── agents/         # 20 specialist agent definitions (all include accreditex-* skills)
├── skills/         # Generic skills + 4 AccrediTex-specific skills
│   ├── accreditex-architecture/   # Codebase map + rules
│   ├── accreditex-firebase/       # Firebase patterns
│   ├── accreditex-ui/             # Brand tokens + UI patterns
│   └── accreditex-roadmap/        # Feature status + build process
└── workflows/      # /feature, /orchestrate, /debug, /deploy, /test

e2e/                # Playwright E2E tests
android/            # Capacitor Android
ios/                # Capacitor iOS
scripts/            # Deployment & utility scripts
```

---

## Quick Commands

```bash
npm run dev              # Start dev server
npm run test             # Run Jest unit tests
npm run test:coverage    # Tests with coverage report
npm run test:e2e         # Run Playwright E2E
npm run build            # Production build
npx cap sync             # Sync web → mobile
```
