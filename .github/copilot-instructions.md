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

| Task | Agent |
|------|-------|
| React components, UI, TailwindCSS | `@frontend-specialist` |
| Firebase queries, services, Firestore | `@backend-specialist` |
| Capacitor iOS/Android features | `@mobile-developer` |
| Firestore schema, indexes, rules | `@database-architect` |
| Any bug, error, TypeScript error | `@debugger` |
| Auth, Firestore rules, JWT, security | `@security-auditor` |
| GitHub Actions, Firebase deploy | `@devops-engineer` |
| Jest unit tests, Playwright E2E | `@test-engineer` |
| Performance, Lighthouse, bundle size | `@performance-optimizer` |
| Multi-feature planning | `@orchestrator` |

---

## AccrediTex Architecture Rules

### State Management
```typescript
// ✅ Always use Zustand stores — never local useState for shared data
// Store location: src/stores/use{Name}Store.ts
// 13 total stores: Core (useAppStore), Projects, Auth (useUserStore),
// Theme (useCustomizationStore), AI, HIS, Lab, Workflow, Reports,
// ChangeControl, Modules, Suppliers, Tenant
import { useProjectStore } from '@/stores/useProjectStore';
const projects = useProjectStore((state) => state.projects);
```

### Firebase Queries — Services Layer
```typescript
// ✅ All Firestore queries go in src/services/ or src/firebase/
// NEVER query Firestore directly from a component
// src/services/projectService.ts
export async function getProject(id: string): Promise<Project | null> {
  const ref = doc(db, 'projects', id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } as Project : null;
}
```

### Internationalization (MANDATORY)
```typescript
// ✅ ALL user-facing strings MUST use i18n — no hardcoded English strings
// Real i18n system: src/data/locales/ (22 EN + 22 AR module files)
// ✅ Provider location: src/components/common/LanguageProvider
import { useLanguage } from '@/components/common/LanguageProvider';
const { t } = useLanguage();
return <h1>{t('dashboard.title')}</h1>;
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
className="bg-brand-background dark:bg-dark-brand-background"
className="text-brand-text-primary dark:dark-brand-text-primary"
className="bg-brand-primary hover:bg-brand-primary/90"

// ❌ NEVER use purple/violet/indigo as primary colors in AccrediTex
// ❌ NEVER use hardcoded hex colors in className
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
import { Capacitor } from '@capacitor/core';
if (Capacitor.isNativePlatform()) {
  // native-only code
}
// ❌ NEVER use mobile-specific code without platform checks
```

---

## MCP Tools — Use Me First

Before starting any feature:
1. `reasoningbank_retrieve` — check if we solved this before
2. `router_route` — confirm which model/strategy to use
3. After success: `reasoningbank_record` — save the pattern

---

## Folder Structure
```
src/
├── components/      # 295 feature components across 33 domains
│   ├── ai/         # AI assistant components
│   └── common/     # Layout, Nav, Theme, Toast (includes LanguageProvider)
├── pages/          # 39 page components (route-level)
├── stores/         # 13 Zustand state stores
├── services/       # 107 Firebase/API service functions
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

e2e/                # Playwright E2E tests
android/            # Capacitor Android
ios/                # Capacitor iOS
scripts/            # Deployment & utility scripts (deploy-render.ps1, test-ai-agent.ps1, etc.)
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
