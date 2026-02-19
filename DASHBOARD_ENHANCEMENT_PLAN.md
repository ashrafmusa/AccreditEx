# Dashboard Enhancement Plan - AccreditEx

**Based On:** Product Features Audit 2026  
**Agent Guidance:** frontend-specialist, performance-optimizer, product-manager  
**Date:** February 13, 2026 (Updated: February 19, 2026)  
**Priority:** High (Immediate Impact)  
**Status:** ✅ Partially Implemented — Feature Discovery Widget deployed

---

## 📋 UPDATE NOTE — February 19, 2026

> **Implementation Status Summary:**
>
> | Story | Status | Details |
> |-------|--------|---------|
> | Story 1: Feature Discovery Widget | ✅ **IMPLEMENTED** | Deployed to all dashboards. See `FEATURE_DISCOVERY_IMPLEMENTATION.md` for details. |
> | Story 2: Quick Actions AI Widget | 🔄 In backlog | AI tools accessible via DocumentControlHub and project-level AI buttons |
> | Story 3: PDCA Quick View Widget | 🔄 In backlog | PDCA tracking available in AnalyticsHub (formerly QualityInsightsPage) |
> | Story 4: Compliance Score Widget | ✅ **AVAILABLE** | Compliance scores shown in role-based dashboards |
> | Story 5: Training Quick View | ✅ **AVAILABLE** | Training hub fully implemented with CE Credits, Skill Matrix, Learning Paths |
>
> **Additional achievements since this plan was written:**
> - 33 page components (up from 30)
> - 7 Zustand stores (up from 3)
> - 95+ services including HIS (18 files) and LIMS (10 files) integration
> - Lab Operations hub with 5 tabs (CAP Assessment, QC Import, etc.)
> - Knowledge Base, Tracer Worksheets, and more — all deployed to https://accreditex.web.app

---

## 🎯 Executive Summary

**Problem:** AI features and advanced capabilities have only 40% user adoption due to poor discoverability. Users don't know features exist until training.

**Solution:** Strategic dashboard enhancements with quick-access widgets, tooltips, and "Pro Tips" carousel—all without breaking existing functionality.

**Impact:**
- 📈 Increase AI feature usage from 40% → 75%
- 📈 Reduce time-to-value from 7 days → 3 days
- 📈 Improve user activation rate by 35%
- ✅ Zero breaking changes to existing dashboards

---

## 📋 Requirements (Product Manager View)

### User Stories

#### Story 1: Feature Discovery Widget
**As a** Quality Manager  
**I want to** see hidden features highlighted on my dashboard  
**So that** I can leverage powerful tools I didn't know existed

**Acceptance Criteria:**
- [ ] Widget displays 3-4 underutilized features with icons and descriptions
- [ ] Click-to-navigate to each feature
- [ ] Widget is dismissible per user (preference saved)
- [ ] Updates weekly with different features (rotation)
- [ ] Available in English and Arabic

---

#### Story 2: Quick Actions AI Widget
**As a** Project Lead  
**I want to** quick-access AI tools from my dashboard  
**So that** I can generate policies and action plans without navigating deep menus

**Acceptance Criteria:**
- [ ] One-click access to AI Document Generator
- [ ] One-click access to AI Action Plan for selected project
- [ ] One-click access to AI Root Cause Analysis
- [ ] Widget shows last used AI feature timestamp
- [ ] Displays AI usage count (gamification)

---

#### Story 3: PDCA Quick View Widget
**As a** Quality Manager  
**I want to** see active PDCA cycles on my dashboard  
**So that** I can track improvement initiatives without navigating to Quality Insights

**Acceptance Criteria:**
- [ ] Display 3-5 active PDCA cycles with status
- [ ] Show next action for each cycle
- [ ] Click to expand details inline
- [ ] Link to full PDCA Tracker
- [ ] Color-coded by priority (High/Medium/Low)

---

#### Story 4: Mock Survey Reminder Widget
**As a** Project Lead  
**I want to** be reminded to conduct mock surveys before audits  
**So that** I don't miss this critical preparation step

**Acceptance Criteria:**
- [ ] Display projects approaching audit dates (60 days out)
- [ ] Show "Conduct Mock Survey" CTA if not done
- [ ] Show mock survey completion status
- [ ] One-click to start new mock survey
- [ ] Dismissible per project

---

### Out of Scope (Won't Do Now)
- ❌ Custom dashboard builder (Q3 2026)
- ❌ Drag-and-drop widget rearrangement (future)
- ❌ Widget marketplace (not MVP)
- ❌ Video tutorials embedded (separate initiative)

---

## 🏗️ Architecture (Frontend Specialist View)

### Design Principles (Following Agent Guidelines)

✅ **Performance First:**
- All widgets lazy-loaded
- Data fetched only when widget visible
- Memoized calculations
- No unnecessary re-renders

✅ **Component Reusability:**
- Create `<DashboardWidget>` base component
- Widget types as props, not separate components
- Shared skeleton loaders

✅ **Accessibility:**
- WCAG 2.1 Level AA compliant
- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels for all widgets
- Screen reader tested

✅ **Type Safety:**
- TypeScript interfaces for all widget props
- Strict type checking
- No `any` types

---

### Component Structure

```
src/components/dashboard/widgets/
├── DashboardWidget.tsx         # Base container component
├── FeatureDiscoveryWidget.tsx  # Highlights hidden features
├── AIQuickActionsWidget.tsx    # AI tool shortcuts
├── PDCAQuickViewWidget.tsx     # Active PDCA cycles
├── MockSurveyReminderWidget.tsx # Pre-audit reminders
├── ProTipsCarousel.tsx         # Rotating tips
└── WidgetSkeleton.tsx          # Loading state
```

**Decision:** Create separate widget components (not monolithic) for:
- Better code splitting
- Easier testing
- Individual lazy loading
- Maintainability

---

### Data Flow

```
Dashboard Page (Role-specific)
    ↓
  Widget Grid (Responsive layout)
    ↓
  Individual Widgets (Lazy loaded)
    ↓
  Zustand Stores (useProjectStore, useAppStore)
    ↓
  Backend Service (Firestore)
```

**Decision:** Use existing Zustand stores, no new global state needed.

---

## 🎨 UI/UX Design (Following Frontend-Specialist Guidelines)

### Layout Strategy

**Avoid Modern Clichés:**
- ❌ NO Bento Grid (overused in 2025)
- ❌ NO Mesh Gradients (too trendy)
- ✅ YES Clean card-based layout
- ✅ YES Subtle elevation and shadows
- ✅ YES Purposeful whitespace

**Layout Approach:**
```
┌─────────────────────────────────────────────────┐
│  Dashboard Header (Existing)                    │
├─────────────────────────────────────────────────┤
│  [Stat Cards Row - Existing, unchanged]         │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Feature      │  │ AI Quick     │            │
│  │ Discovery    │  │ Actions      │  [Charts]  │
│  │ Widget       │  │ Widget       │  (Existing)│
│  └──────────────┘  └──────────────┘            │
├─────────────────────────────────────────────────┤
│  [Existing Compliance Charts - unchanged]       │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐            │
│  │ PDCA Quick   │  │ Mock Survey  │            │
│  │ View         │  │ Reminders    │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
```

**Placement Strategy:**
- Widgets inserted ABOVE existing charts (no layout shift)
- Grid responsive: 2 columns desktop, 1 column mobile
- Skeleton loaders prevent CLS (Cumulative Layout Shift)

---

### Visual Design Specs

**Widget Card:**
```tsx
Background: White (light) / Slate-800 (dark)
Border: 1px solid slate-200 / slate-700
Border Radius: 12px
Shadow: 0 1px 3px rgba(0,0,0,0.1)
Padding: 20px
Transition: shadow 0.2s ease (on hover)
```

**Color Palette:**
```tsx
Primary Action: brand-primary (#4f46e5)
Success: green-500 (#22c55e)
Warning: amber-500 (#f59e0b)
Danger: red-500 (#ef4444)
Info: blue-500 (#3b82f6)
Muted Text: slate-500
```

**Typography:**
```tsx
Widget Title: font-semibold text-lg
Widget Description: font-normal text-sm text-slate-600
CTA Buttons: font-medium text-sm
```

---

## ⚡ Performance Optimization (Performance-Optimizer View)

### Lazy Loading Strategy

```tsx
// Lazy load widget components
const FeatureDiscoveryWidget = lazy(() => 
  import('./widgets/FeatureDiscoveryWidget')
);
const AIQuickActionsWidget = lazy(() => 
  import('./widgets/AIQuickActionsWidget')
);

// Wrap in Suspense with skeleton
<Suspense fallback={<WidgetSkeleton />}>
  <FeatureDiscoveryWidget />
</Suspense>
```

**Benefit:** Only load widget code when dashboard is accessed.

---

### Data Fetching Optimization

**Problem:** Don't want widgets to trigger individual Firestore queries.

**Solution:** Use existing Zustand store data (already loaded by Dashboard).

```tsx
// ✅ GOOD: Use existing store data
const { projects } = useProjectStore();
const pdcaCycles = projects.flatMap(p => p.pdcaCycles || []);

// ❌ BAD: Don't fetch separately
// const pdcaCycles = await fetchPDCACycles(); // Extra network call
```

---

### Memoization Strategy

```tsx
// Memoize expensive calculations
const activeFeatures = useMemo(() => {
  return calculateUnderutilizedFeatures(projects, documents);
}, [projects, documents]);

// Memoize widget rendering
const PDCAWidget = React.memo(({ cycles }) => {
  // Widget content
});
```

---

### Core Web Vitals Impact

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| **LCP** | 1.8s | 1.9s | < 2.5s ✅ |
| **INP** | 150ms | 160ms | < 200ms ✅ |
| **CLS** | 0.05 | 0.05 | < 0.1 ✅ |

**Analysis:** Minimal impact due to lazy loading + skeletons.

---

## 🔒 Non-Breaking Changes Checklist

### Existing Functionality Preserved

✅ **All current dashboard components unchanged:**
- StatCard row (Total Projects, In Progress, Compliance %)
- Compliance bar chart
- Project status pie chart
- Recent CAPA list
- Dashboard header

✅ **No breaking changes to:**
- Data fetching logic
- Zustand stores
- Navigation flow
- Existing widget props

✅ **Backward compatibility:**
- Old dashboard code continues to work if widgets fail
- Feature flags for gradual rollout
- Error boundaries around each widget

---

### Testing Strategy

**Unit Tests:**
```tsx
// Test widget rendering
test('FeatureDiscoveryWidget renders correctly', () => {
  render(<FeatureDiscoveryWidget />);
  expect(screen.getByText(/AI Document Generator/i)).toBeInTheDocument();
});

// Test widget dismissal
test('Widget can be dismissed and preference saved', () => {
  // Test localStorage persistence
});
```

**Integration Tests:**
```tsx
// Test dashboard layout is not broken
test('Dashboard renders with all widgets', () => {
  render(<AdminDashboard />);
  expect(screen.getByText(/Total Projects/i)).toBeInTheDocument();
  expect(screen.getByText(/Feature Discovery/i)).toBeInTheDocument();
});
```

**Visual Regression Tests:**
```tsx
// Playwright screenshot comparison
test('Dashboard visual regression', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard-with-widgets.png');
});
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)

**Day 1-2: Base Components**
- [ ] Create `DashboardWidget` base component
- [ ] Create `WidgetSkeleton` loading component
- [ ] Add widget grid layout to AdminDashboard
- [ ] Test responsive layout (desktop, tablet, mobile)

**Day 3-4: Feature Discovery Widget**
- [ ] Implement `FeatureDiscoveryWidget`
- [ ] Add feature rotation logic (weekly rotation)
- [ ] Add dismiss functionality (localStorage)
- [ ] Add translations (EN/AR)
- [ ] Add click tracking (usage analytics)

**Day 5: Testing & QA**
- [ ] Unit tests for widget components
- [ ] Visual regression tests
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance profiling (Lighthouse)

**Deliverable:** Feature Discovery Widget live on Admin Dashboard

---

### Phase 2: AI & PDCA Widgets (Week 2)

**Day 1-2: AI Quick Actions Widget**
- [ ] Implement `AIQuickActionsWidget`
- [ ] Add one-click AI Document Generator
- [ ] Add AI Action Plan shortcut
- [ ] Add AI Root Cause Analysis shortcut
- [ ] Add usage counter (gamification)

**Day 3-4: PDCA Quick View Widget**
- [ ] Implement `PDCAQuickViewWidget`
- [ ] Display active PDCA cycles (top 5)
- [ ] Add inline expand/collapse
- [ ] Add status indicators (color-coded)
- [ ] Add "View All" link to Quality Insights

**Day 5: Testing & Rollout**
- [ ] Integration tests
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] RTL testing (Arabic layout)
- [ ] Deploy to staging environment

**Deliverable:** AI and PDCA widgets live on Admin + ProjectLead dashboards

---

### Phase 3: Mock Survey & Pro Tips (Week 3)

**Day 1-2: Mock Survey Reminder Widget**
- [ ] Implement `MockSurveyReminderWidget`
- [ ] Calculate projects approaching audit (60 days)
- [ ] Check if mock survey conducted
- [ ] Add "Start Mock Survey" CTA
- [ ] Add dismissal per project

**Day 3-4: Pro Tips Carousel**
- [ ] Implement `ProTipsCarousel`
- [ ] Create tip database (20+ tips)
- [ ] Add auto-rotation (every 10 seconds)
- [ ] Add manual navigation (prev/next)
- [ ] Add "Learn More" links

**Day 5: Final Testing & Documentation**
- [ ] End-to-end testing
- [ ] User acceptance testing (UAT) with beta users
- [ ] Update user manual with new features
- [ ] Create video walkthrough (optional)

**Deliverable:** All widgets complete, deployed to production

---

### Phase 4: Rollout & Monitoring (Week 4)

**Day 1-3: Gradual Rollout**
- [ ] Enable for 10% of users (feature flag)
- [ ] Monitor error rates (Firestore logs)
- [ ] Collect user feedback (in-app survey)
- [ ] Iterate based on feedback

**Day 4-5: Full Rollout**
- [ ] Enable for 100% of users
- [ ] Announce new features (email, in-app notification)
- [ ] Monitor analytics (widget click rates)
- [ ] Measure success metrics (AI usage, PDCA usage, Mock Survey usage)

**Deliverable:** Dashboard enhancements live for all users

---

## 📊 Success Metrics & KPIs

### Primary Metrics

| Metric | Baseline | Target (30 days) | Measurement |
|--------|----------|------------------|-------------|
| **AI Feature Usage** | 40% | 75% | % users clicking AI widgets |
| **PDCA Feature Usage** | 30% | 60% | % users accessing PDCA tracker |
| **Mock Survey Usage** | 30% | 70% | % projects with mock surveys before audit |
| **Time to First Value** | 7 days | 3 days | Days until user uses advanced feature |

### Secondary Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Widget Dismiss Rate** | N/A | < 20% | % users dismissing widgets |
| **Widget Click-Through** | N/A | > 40% | % users clicking widget CTAs |
| **Dashboard Load Time** | 1.8s | < 2.0s | Lighthouse LCP |
| **User Satisfaction (NPS)** | Unknown | > +30 | In-app survey |

---

## 🎓 User Education & Onboarding

### In-App Tooltips (First-Time Users)

**Trigger:** First dashboard visit after enhancement deployment

**Tooltip Flow:**
1. **Welcome:** "We've added quick-access widgets to help you discover powerful features!"
2. **Feature Discovery Widget:** "Click here to learn about hidden features"
3. **AI Quick Actions:** "Access AI tools with one click"
4. **PDCA Widget:** "Track quality improvement cycles"
5. **Mock Survey Reminder:** "Never miss pre-audit preparation"

**Tool:** Use `react-joyride` or `shepherd.js` for tooltip tour

---

### Pro Tips Content (20 Tips)

**Examples:**
1. "Did you know? AI can generate a policy document in 15 minutes. Try it now!"
2. "Conducting mock surveys 60 days before audits increases pass rates by 40%."
3. "PDCA cycles help you demonstrate continuous improvement to auditors."
4. "Use root cause analysis to turn audit findings into systematic improvements."
5. "Competency gap reports identify training needs before they become problems."

---

## 🛡️ Risk Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Widget load failure** | Low | Medium | Error boundaries + fallback UI |
| **Performance regression** | Low | High | Performance budget monitoring |
| **Layout shift (CLS)** | Medium | Medium | Skeleton loaders with fixed heights |
| **Data fetching errors** | Low | Medium | Graceful error handling + retry logic |

---

### User Experience Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Widget overload** | Medium | Medium | Start with 2 widgets, add gradually |
| **User confusion** | Low | Medium | Tooltips + help documentation |
| **Widget fatigue** | Low | Low | Allow dismissal + preferences |
| **RTL layout issues** | Low | Medium | Thorough Arabic testing |

---

## 📝 Component Code Examples

### 1. DashboardWidget Base Component

```tsx
// src/components/dashboard/widgets/DashboardWidget.tsx
import React, { ReactNode } from 'react';
import { XMarkIcon } from '@/components/icons';

interface DashboardWidgetProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  onDismiss?: () => void;
  isDismissible?: boolean;
  className?: string;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  description,
  icon,
  children,
  onDismiss,
  isDismissible = false,
  className = '',
}) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && <div className="text-brand-primary dark:text-brand-primary-400">{icon}</div>}
          <div>
            <h3 className="font-semibold text-lg text-brand-text-primary dark:text-dark-brand-text-primary">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {isDismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Dismiss widget"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
};
```

---

### 2. Feature Discovery Widget

```tsx
// src/components/dashboard/widgets/FeatureDiscoveryWidget.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { DashboardWidget } from './DashboardWidget';
import { SparklesIcon, LightBulbIcon } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { NavigationState } from '@/types';

interface FeatureDiscoveryWidgetProps {
  setNavigation: (state: NavigationState) => void;
}

interface Feature {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  navigationState: NavigationState;
  usageRate: number; // Current usage percentage
}

export const FeatureDiscoveryWidget: React.FC<FeatureDiscoveryWidgetProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('featureDiscoveryWidget:dismissed');
    setIsDismissed(dismissed === 'true');
  }, []);

  // Feature database (sorted by lowest usage)
  const allFeatures: Feature[] = useMemo(() => [
    {
      id: 'ai-document-generator',
      titleKey: 'aiDocumentGenerator',
      descriptionKey: 'aiDocumentGeneratorDesc',
      icon: <SparklesIcon className="w-5 h-5" />,
      navigationState: { view: 'documentControl', section: undefined },
      usageRate: 35,
    },
    {
      id: 'mock-survey',
      titleKey: 'mockSurvey',
      descriptionKey: 'mockSurveyDesc',
      icon: <LightBulbIcon className="w-5 h-5" />,
      navigationState: { view: 'mockSurvey' },
      usageRate: 28,
    },
    {
      id: 'pdca-cycles',
      titleKey: 'pdcaCycles',
      descriptionKey: 'pdcaCyclesDesc',
      icon: <LightBulbIcon className="w-5 h-5" />,
      navigationState: { view: 'qualityInsights' },
      usageRate: 30,
    },
    // Add more features...
  ], []);

  // Rotate features weekly
  const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const featuredFeatures = useMemo(() => {
    const sorted = [...allFeatures].sort((a, b) => a.usageRate - b.usageRate);
    const startIndex = currentWeek % sorted.length;
    return sorted.slice(startIndex, startIndex + 3);
  }, [allFeatures, currentWeek]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('featureDiscoveryWidget:dismissed', 'true');
    
    // Track dismissal
    console.log('Feature Discovery Widget dismissed');
  };

  if (isDismissed) return null;

  return (
    <DashboardWidget
      title={t('discoverHiddenFeatures')}
      description={t('discoverHiddenFeaturesDesc')}
      icon={<SparklesIcon className="w-6 h-6" />}
      isDismissible
      onDismiss={handleDismiss}
    >
      <div className="space-y-3">
        {featuredFeatures.map((feature) => (
          <button
            key={feature.id}
            onClick={() => {
              setNavigation(feature.navigationState);
              // Track click
              console.log(`Feature clicked: ${feature.id}`);
            }}
            className="w-full flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 transition-colors text-left group"
          >
            <div className="text-brand-primary dark:text-brand-primary-400 mt-0.5">
              {feature.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary group-hover:text-brand-primary transition-colors">
                {t(feature.titleKey)}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {t(feature.descriptionKey)}
              </p>
              <span className="text-xs text-brand-primary dark:text-brand-primary-400 mt-1 inline-block">
                {t('learnMore')} →
              </span>
            </div>
          </button>
        ))}
      </div>
    </DashboardWidget>
  );
};
```

---

### 3. AI Quick Actions Widget

```tsx
// src/components/dashboard/widgets/AIQuickActionsWidget.tsx
import React, { useState } from 'react';
import { DashboardWidget } from './DashboardWidget';
import { SparklesIcon, DocumentTextIcon, MagnifyingGlassIcon } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectStore } from '@/stores/useProjectStore';
import { NavigationState } from '@/types';

interface AIQuickActionsWidgetProps {
  setNavigation: (state: NavigationState) => void;
}

export const AIQuickActionsWidget: React.FC<AIQuickActionsWidgetProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const { projects } = useProjectStore();
  
  const [aiUsageCount, setAiUsageCount] = useState(() => {
    return parseInt(localStorage.getItem('aiUsageCount') || '0', 10);
  });

  const handleAIAction = (action: string, navigationState: NavigationState) => {
    // Track usage
    const newCount = aiUsageCount + 1;
    setAiUsageCount(newCount);
    localStorage.setItem('aiUsageCount', newCount.toString());
    
    // Navigate
    setNavigation(navigationState);
    
    console.log(`AI action: ${action}, total usage: ${newCount}`);
  };

  const actions = [
    {
      id: 'generate-policy',
      titleKey: 'generatePolicy',
      descriptionKey: 'aiGeneratePolicyDesc',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      navigationState: { view: 'documentControl' } as NavigationState,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      id: 'action-plan',
      titleKey: 'generateActionPlan',
      descriptionKey: 'aiActionPlanDesc',
      icon: <SparklesIcon className="w-5 h-5" />,
      navigationState: { view: 'projects' } as NavigationState,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      id: 'root-cause',
      titleKey: 'rootCauseAnalysis',
      descriptionKey: 'aiRootCauseDesc',
      icon: <MagnifyingGlassIcon className="w-5 h-5" />,
      navigationState: { view: 'qualityInsights' } as NavigationState,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
  ];

  return (
    <DashboardWidget
      title={t('aiQuickActions')}
      description={t('aiQuickActionsDesc')}
      icon={<SparklesIcon className="w-6 h-6" />}
    >
      <div className="space-y-2 mb-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAIAction(action.id, action.navigationState)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${action.bgColor} hover:shadow-md transition-all text-left group`}
          >
            <div className={action.color}>{action.icon}</div>
            <div className="flex-1">
              <h4 className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                {t(action.titleKey)}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t(action.descriptionKey)}
              </p>
            </div>
            <span className="text-brand-primary dark:text-brand-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </span>
          </button>
        ))}
      </div>

      {/* Gamification: Usage count */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          {t('aiToolsUsed')}: <span className="font-bold text-brand-primary">{aiUsageCount}</span> {t('times')}
        </p>
      </div>
    </DashboardWidget>
  );
};
```

---

## 🔄 Rollback Plan

**If issues occur, we can rollback safely:**

### Option 1: Feature Flag Disable
```tsx
// In environment config
ENABLE_DASHBOARD_WIDGETS=false

// In dashboard component
{process.env.ENABLE_DASHBOARD_WIDGETS === 'true' && (
  <WidgetGrid />
)}
```

### Option 2: Individual Widget Disable
```tsx
// Widget-specific flags
ENABLE_FEATURE_DISCOVERY_WIDGET=false
ENABLE_AI_QUICK_ACTIONS_WIDGET=false
ENABLE_PDCA_WIDGET=false
ENABLE_MOCK_SURVEY_WIDGET=false
```

### Option 3: Full Rollback
- Revert Git commit
- Deploy previous version
- Notify users of temporary rollback

---

## 📚 Translation Keys to Add

### English (en/common.ts)
```typescript
// Feature Discovery Widget
discoverHiddenFeatures: "Discover Hidden Features",
discoverHiddenFeaturesDesc: "Powerful tools you might not know about",
aiDocumentGenerator: "AI Document Generator",
aiDocumentGeneratorDesc: "Generate policies with AI in minutes",
mockSurvey: "Mock Survey Simulator",
mockSurveyDesc: "Practice before your real audit",
pdcaCycles: "PDCA Improvement Cycles",
pdcaCyclesDesc: "Track continuous quality improvements",
learnMore: "Learn More",

// AI Quick Actions Widget
aiQuickActions: "AI Quick Actions",
aiQuickActionsDesc: "One-click access to AI tools",
generatePolicy: "Generate Policy Document",
aiGeneratePolicyDesc: "AI writes policies based on standards",
generateActionPlan: "Create Action Plan",
aiActionPlanDesc: "AI suggests compliance roadmap",
rootCauseAnalysis: "Root Cause Analysis",
aiRootCauseDesc: "AI identifies underlying issues",
aiToolsUsed: "AI Tools Used",
times: "times",

// PDCA Widget
pdcaQuickView: "Active PDCA Cycles",
pdcaQuickViewDesc: "Track quality improvement initiatives",
viewAllPDCA: "View All PDCA Cycles",
nextAction: "Next Action",

// Mock Survey Reminder
mockSurveyReminders: "Mock Survey Reminders",
mockSurveyRemindersDesc: "Projects approaching audit dates",
conductMockSurvey: "Conduct Mock Survey",
daysUntilAudit: "days until audit",
mockSurveyCompleted: "Mock survey completed",
```

### Arabic (ar/common.ts)
```typescript
// Feature Discovery Widget
discoverHiddenFeatures: "اكتشف الميزات المخفية",
discoverHiddenFeaturesDesc: "أدوات قوية قد لا تعرفها",
aiDocumentGenerator: "مولد المستندات بالذكاء الاصطناعي",
aiDocumentGeneratorDesc: "إنشاء السياسات بالذكاء الاصطناعي في دقائق",
mockSurvey: "محاكاة المسح التجريبي",
mockSurveyDesc: "تدرب قبل التدقيق الفعلي",
pdcaCycles: "دورات تحسين PDCA",
pdcaCyclesDesc: "تتبع تحسينات الجودة المستمرة",
learnMore: "تعلم المزيد",

// AI Quick Actions Widget
aiQuickActions: "إجراءات الذكاء الاصطناعي السريعة",
aiQuickActionsDesc: "وصول بنقرة واحدة لأدوات الذكاء الاصطناعي",
generatePolicy: "إنشاء وثيقة سياسة",
aiGeneratePolicyDesc: "الذكاء الاصطناعي يكتب السياسات بناءً على المعايير",
generateActionPlan: "إنشاء خطة عمل",
aiActionPlanDesc: "الذكاء الاصطناعي يقترح خارطة طريق الامتثال",
rootCauseAnalysis: "تحليل السبب الجذري",
aiRootCauseDesc: "الذكاء الاصطناعي يحدد القضايا الأساسية",
aiToolsUsed: "أدوات الذكاء الاصطناعي المستخدمة",
times: "مرات",

// PDCA Widget
pdcaQuickView: "دورات PDCA النشطة",
pdcaQuickViewDesc: "تتبع مبادرات تحسين الجودة",
viewAllPDCA: "عرض جميع دورات PDCA",
nextAction: "الإجراء التالي",

// Mock Survey Reminder
mockSurveyReminders: "تذكيرات المسح التجريبي",
mockSurveyRemindersDesc: "المشاريع التي تقترب من تواريخ التدقيق",
conductMockSurvey: "إجراء مسح تجريبي",
daysUntilAudit: "أيام حتى التدقيق",
mockSurveyCompleted: "تم إكمال المسح التجريبي",
```

---

## ✅ Definition of Done

**Widget is considered "Done" when:**

- [ ] Code implemented with TypeScript
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Visual regression tests passing
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] RTL layout tested and working
- [ ] Performance budget met (no LCP regression)
- [ ] Translations added (EN + AR)
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] Deployed to staging and tested
- [ ] Product owner approval

---

## 📞 Stakeholder Communication

### Weekly Status Updates (Email)

**Subject:** Dashboard Enhancement Progress - Week [X]

**Body:**
```
Hi Team,

Dashboard Enhancement Update:

✅ Completed This Week:
- [List completed tasks]

🚧 In Progress:
- [Current work]

📊 Metrics:
- AI Feature Usage: 40% → [current %]
- Widget Click-Through: [current %]
- User Satisfaction: [NPS score]

🔜 Next Week:
- [Planned tasks]

🚨 Blockers:
- [Any issues or dependencies]

Let me know if you have questions!
```

---

## 🎯 Final Recommendation

**Proceed with Phase 1 immediately:**
- Feature Discovery Widget (highest ROI)
- Add to AdminDashboard first (largest user base)
- Measure impact for 1 week
- Expand to other role dashboards based on results

**Expected Outcome:**
- 35% increase in AI feature adoption within 30 days
- 50% increase in PDCA and Mock Survey usage
- Improved user activation (faster time-to-value)
- Positive impact on NPS (Net Promoter Score)

**Investment:**
- 3 weeks development time (1 frontend dev)
- Minimal performance impact (<0.1s LCP increase)
- Zero breaking changes
- High user value, low technical risk

---

## Document Control

**Version:** 1.0  
**Status:** ✅ Approved for Implementation  
**Next Review:** March 13, 2026  
**Owner:** Frontend Team  

**Changelog:**
- v1.0 (Feb 13, 2026): Initial plan based on Product Audit 2026

---

**End of Plan - Ready for Implementation** 🚀
