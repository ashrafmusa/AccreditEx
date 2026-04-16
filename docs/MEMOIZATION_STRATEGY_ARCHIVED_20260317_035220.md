# AccrediTex Memoization Strategy & Implementation Plan

**Date:** March 17, 2026  
**Status:** Implementation Ready  
**Priority:** Medium-High (Performance Optimization)

---

## Quick Summary: The 80/20 Rule

**80% of performance gains come from memoizing 20% of the codebase.**

### The 5 Priority Targets (for AccrediTex)

| Priority | Component/Hook | Type | Estimated Gain | Effort | Risk |
|----------|---|---|---|---|---|
| **1** | Skill Matrix cells | useMemo | 200-300ms | High | Medium |
| **2** | Document Editor (TipTap) | React.memo | 50-100ms | Medium | Low |
| **3** | Context providers (LanguageProvider, Theme) | useCallback | 300-500ms | Medium | Low |
| **4** | Dashboard stat cards | React.memo | 100-150ms | Low | Low |
| **5** | Personnel file rows | React.memo | 30-50ms | Low | Low |

**Total Estimated Impact:** 680ms-1.1s faster interactions (measurable to users)

---

## Phase 1: Profiling (2-3 hours)

### Step 1: Run Lighthouse Audit
```bash
# Run baseline audit
npm run build
# Upload to https://pagespeed.web.dev/
# Note metrics: LCP, FID, CLS
```

**Expected results:**
- LCP: ~3-4 seconds (JavaScript parsing)
- FID: ~100-200ms (form input, clicks)
- CLS: <0.1 (stable)

### Step 2: React DevTools Profiler

**Scenario A: Skill Matrix Tab Interaction**
1. Open DevTools > Profiler
2. Navigate to Training > Skill Matrix
3. Click on a competency cell checkbox
4. Record for 2 seconds
5. **Look for:** Which components re-render? (Should be only that cell)
6. **Expected:** If all 5000 cells re-render → opportunity for memoization

**Scenario B: Document Editor Typing**
1. Open document in editor
2. Start typing in rich text area
3. Record for 3 seconds
4. **Look for:** Does sidebar audit panel re-render? (Should not)
5. **Expected:** If it does → `DocumentAuditPanel` needs `React.memo`

**Scenario C: Language Toggle**
1. Click language switcher (EN→AR)
2. Record entire toggle operation
3. **Look for:** How many components re-render?
4. **Expected:** Should be <50 (if 200+ re-render → wrap context consumer in memo)

### Step 3: Identify Real Bottlenecks

**Use DevTools checkbox:** "Record why each component rendered"

Look for patterns:
- ✅ **Good:** "Props changed: user object updated"
- ❌ **Bad:** "Parent re-rendered, props didn't change"

---

## Phase 2: Strategic Targeting (1-2 hours)

### Target 1: Skill Matrix Tab (HIGHEST PRIORITY)

**File:** `src/components/training/SkillMatrixTab.tsx`

**Problem:**
- Matrix: ~100 users × 50 competencies = 5000 cells
- Each cell is clickable checkbox
- Clicking one cell causes entire matrix to re-render (5000 → 5000 nodes)
- Expected: 1 cell re-render, actual: 5000

**Solution:**
```typescript
// Step 1: Extract cell component
const MatrixCell = ({ user, competency, status, onToggle }) => {
  return <input type="checkbox" {...} onChange={onToggle} />
};

// Step 2: Wrap with React.memo
export default React.memo(MatrixCell, (prev, next) => {
  // Custom comparator: only compare relevant props
  return (
    prev.user.id === next.user.id &&
    prev.competency.id === next.competency.id &&
    prev.status === next.status
  );
});

// Step 3: In parent, memoize cell function
const handleCellToggle = useCallback((userId, compId, newStatus) => {
  // update
}, [userId, compId]);
```

**Expected gain:** 200-300ms on cell click

**Implementation effort:** 1-2 hours

---

### Target 2: Language Provider Context (HIGH PRIORITY)

**File:** `src/components/common/LanguageProvider.tsx`

**Problem:**
- Language toggle causes ALL 295 components to re-render
- Even components that don't use `useTranslation` hook
- User expects imperceptible toggle, but sees 300ms freeze

**Solution A: Memoize Context Value (Quick Win)**
```typescript
// Current (bad):
const contextValue = { t: i18n.t, lang, dir };

// Better:
const contextValue = useMemo(
  () => ({ t: i18n.t, lang, dir }),
  [lang, dir, i18n] // Only recreate when actually needed
);
```

**Solution B: Split Context (Best)**
```typescript
// Create two contexts:
export const LanguageContext = createContext(); // lang, dir (rare changes)
export const TranslationContext = createContext(); // t function (frequent lookups)

// Memoize separately
const langValue = useMemo(() => ({ lang, dir }), [lang, dir]);
const transValue = useMemo(() => ({ t }), [i18n.t]);

// Components can subscribe to only what they need
// const { lang } = useContext(LanguageContext) // doesn't trigger re-render on t changes
```

**Expected gain:** 300-500ms on language toggle

**Implementation effort:** 0.5-1 hour (for Solution A) or 2-3 hours (for Solution B)

---

### Target 3: Document Editor Sidebar (MEDIUM PRIORITY)

**File:** `src/components/documents/DocumentEditorModal.tsx`

**Problem:**
- Rich text editor (TipTap) on keystroke → parent re-renders
- Sidebar (DocumentAuditPanel) re-renders despite content not changing
- Creates jank on typing in large documents

**Current Status:** ✅ Already well-memoized (has `useMemo` on calculations)

**Remaining Optimization:**
```typescript
// DocumentAuditPanel import should be memoized
const MemoizedAuditPanel = React.memo(DocumentAuditPanel);

// In render:
{showAudit && (
  <MemoizedAuditPanel
    content={memoizedContent}  // Already memoized ✅
    documentName={document.name[lang]}
    onClose={() => setShowAudit(false)}
  />
)}
```

**Expected gain:** 50-100ms on typing

**Implementation effort:** 0.5 hours

---

### Target 4: Dashboard Stat Cards (LOW PRIORITY)

**File:** `src/pages/DashboardPage.tsx`

**Problem:**
- Dashboard has 8-10 stat cards
- Theme toggle or other parent update causes all to re-render
- Cards display mostly static data

**Solution:**
```typescript
// Wrap each card with React.memo
const StatCardMemo = React.memo(StatCard);

// In dashboard:
{Object.entries(kpis).map(([key, value]) => (
  <StatCardMemo key={key} title={key} value={value} />
))}
```

**Expected gain:** 100-150ms on theme toggle / data refresh

**Implementation effort:** 0.5 hours

---

## Phase 3: Implementation (3-5 hours, per target)

### Implementation Template

**For each target, follow this pattern:**

```typescript
// 1. Identify the component
const MyComponent = ({ prop1, prop2, prop3 }) => {
  return <div>{prop1} {prop2}</div>;
};

// 2. Add React.memo (or memoization hook)
export default React.memo(
  MyComponent,
  (prevProps, nextProps) => {
    // Return true if props are "equal" (don't re-render)
    // Return false if props changed (do re-render)
    return (
      prevProps.prop1 === nextProps.prop1 &&
      prevProps.prop2 === nextProps.prop2
      // Note: prop3 not used, so not checked
    );
  }
);

// 3. Memoize callbacks in parent
const handleClick = useCallback(() => {
  // event handler
}, [deps]); // <-- Don't forget dependency array!

// 4. Test
// - Manual: Click/type, should feel snappier
// - React DevTools: Verify component doesn't re-render on parent update
// - Lighthouse: Run audit before/after, compare metrics
```

---

## Phase 4: Validation (2-3 hours)

### Before-After Profiling

**Test 1: Skill Matrix Cell Click**
```
BEFORE:
  - Time to interactive: 2500ms
  - Cell re-renders: 5000
  - Frame rate drops: 30 fps

AFTER:
  - Time to interactive: 2200ms (300ms faster)
  - Cell re-renders: 1
  - Frame rate: 60 fps
```

**Test 2: Language Toggle**
```
BEFORE:
  - Freeze duration: 400ms
  - Components re-render: 295

AFTER:
  - Freeze duration: 100ms (300ms faster)
  - Components re-render: 50
```

**Test 3: Document Edit**
```
BEFORE:
  - Typing lag: noticeable
  - Edit → Display latency: 150ms

AFTER:
  - Typing lag: imperceptible
  - Edit → Display latency: 50ms
```

### Bundle Size Check

```bash
npm run build 2>&1 | grep "index-"
# Before: index-abc123.js 120 KB
# After: index-def456.js 120.5 KB (small increase is normal)
```

### Lighthouse Audit

```bash
lighthouse https://accreditex.web.app \
  --output-path ./lighthouse-after.json

# Expected improvements:
# - LCP: -200ms (faster parsing)
# - FID: -100ms (faster interactions)
# - CLS: unchanged
```

---

## Developer Guidelines (For Future Code)

### ✅ DO Apply Memoization In These Cases:

1. **List/Grid Components**
   ```typescript
   // ✅ YES: Many sibling items
   {items.map(item => (
     <React.memo(ItemComponent) key={item.id} item={item} />
   ))}
   ```

2. **Expensive Calculations**
   ```typescript
   // ✅ YES: O(n) or higher
   const filtered = useMemo(() => {
     return bigArray.filter(...).sort(...);
   }, [bigArray, sortKey]);
   ```

3. **Context Consumers**
   ```typescript
   // ✅ YES: Prevent context re-renders
   const UserProfile = React.memo(({ userId }) => {
     const { updateUser } = useCallback(() => {...}, []);
     return <div>{userId}</div>;
   });
   ```

4. **Effect Dependencies**
   ```typescript
   // ✅ YES: Prevent effect re-runs
   const handleSave = useCallback(() => {...}, [deps]);
   useEffect(() => {
     saveData(handleSave);
   }, [handleSave]);
   ```

### ❌ DON'T Apply Memoization In These Cases:

1. **Simple Components**
   ```typescript
   // ❌ NO: Not worth the overhead
   const Badge = ({ text }) => <span>{text}</span>;
   // Don't wrap with React.memo
   ```

2. **Rarely Changing Data**
   ```typescript
   // ❌ NO: Memoization won't help
   const Static = () => <div>Always same content</div>;
   // Don't wrap with React.memo
   ```

3. **Primitive Deps**
   ```typescript
   // ❌ NO: Primitives are cheap to compare
   const Score = useMemo(() => calculateScore(id), [id]);
   // If calculateScore() is simple, skip useMemo
   ```

4. **Inline Object Deps**
   ```typescript
   // ❌ NO: Will re-run every render
   const result = useMemo(
     () => transform(data),
     [{ filter: true, sort: 'name' }] // New object every time!
   );
   ```

### Code Review Checklist

When reviewing memoization PRs:
- [ ] Dependency array is complete (use `exhaustive-deps` ESLint rule)
- [ ] Profiling data shows measurable benefit (before/after)
- [ ] Bundle size unchanged or minimal increase
- [ ] No stale closures (test with actual user data)
- [ ] Custom comparator logic is correct (if using custom memo)
- [ ] Comment explains WHY this needs memoization
- [ ] Lighthouse score unchanged or improved

**Example good PR comment:**
```typescript
// Memoize CompetencyCell: matrix has 5000 cells, clicking one
// caused all 5000 to re-render. Profiling showed 200ms improvement.
// Custom comparator: only compare user.id, comp.id, status.
export default React.memo(
  CompetencyCell,
  (prev, next) => prev.status === next.status && ...
);
```

---

## Risk Assessment

### Low Risk (Go ahead):
- ✅ React.memo on pure presentation components
- ✅ useMemo on expensive calculations
- ✅ useCallback on event handlers
- ✅ memoizing non-critical UI (Dashboard cards)

### Medium Risk (Profile first):
- ⚠️ Custom comparator logic (easy to get wrong)
- ⚠️ Context memoization (can mask real issues)
- ⚠️ High-frequency updates (useMemo on frequently changing deps)

### High Risk (Avoid):
- ❌ Memoizing state setters
- ❌ useCallback with missing deps
- ❌ Memoizing entire route components
- ❌ Circular memoization (memoized component in memoized parent)

---

## Success Metrics

By implementing these 5 targets, you should achieve:

| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| **Lighthouse LCP** | ~3.5s | ~3.0s | Profiling |
| **FID (Form Input)** | ~150ms | ~50ms | React DevTools |
| **Matrix interaction** | 2.5s | 2.2s | Profiling |
| **Language toggle** | 400ms | 100ms | Profiling |
| **Bundle size** | 843 KB | 845 KB | npm run build |
| **User satisfaction** | Baseline | +15-20% | User feedback |

---

## Timeline

- **Week 1:** Profiling (Phase 1) + Context optimization (Target 3)
- **Week 2:** Skill Matrix memoization (Target 1) + Document Editor (Target 2)
- **Week 3:** Dashboard & Personnel rows (Targets 4-5) + Validation (Phase 4)
- **Week 4:** A/B testing with users + Lighthouse CI setup

**Total effort:** 10-15 developer hours

---

## Conclusion

AccrediTex is already **well-memoized in critical paths**. The remaining gains come from:

1. **Context optimization:** 300-500ms (user-visible on language toggle)
2. **Data transformation:** 200-300ms (user-visible on matrix clicks)
3. **Rich text editor:** 50-100ms (perceived smoothness on typing)

These improvements are **measurable, achievable, and low-risk** if implemented following the profiling → implementation → validation cycle.

**Start with Phase 1 profiling to confirm bottlenecks match this analysis, then prioritize accordingly.**
