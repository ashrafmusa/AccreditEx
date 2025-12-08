# AccreditEx - Improvements TODO List

**Created:** December 4, 2025  
**Status:** Active Implementation Plan  
**Total Tasks:** 40+ items across 4 phases  
**Estimated Total Effort:** 50-60 hours

---

## 🎯 Phase 1: IMMEDIATE CODE CLEANUP (This Week)
**Effort:** 5 hours | **Risk:** Very Low | **Priority:** 🔴 CRITICAL

### ✅ Code Organization & File Structure

#### Code Cleanup Tasks
- [ ] **Task 1.1** Delete deprecated DocumentsPage
  - File: `pages/DocumentsPage.tsx`
  - Action: Delete the file
  - Reason: Replaced by DocumentControlHubPage
  - Effort: 5 minutes
  - Verification: Build succeeds

- [ ] **Task 1.2** Move DesignControlsPage to components
  - Current: `pages/DesignControlsPage.tsx`
  - Target: `components/projects/DesignControlsComponent.tsx`
  - Action: Move file and rename
  - Effort: 10 minutes
  - Files to update:
    - [ ] `src/pages/ProjectDetailPage.tsx` - Update import path
    - [ ] `src/components/common/MainRouter.tsx` - Remove from imports (no longer a page)

- [ ] **Task 1.3** Move MockSurveyPage to components
  - Current: `pages/MockSurveyPage.tsx`
  - Target: `components/projects/SurveyComponent.tsx`
  - Action: Move file and rename
  - Effort: 10 minutes
  - Files to update:
    - [ ] `src/pages/ProjectDetailPage.tsx` - Update import
    - [ ] `src/components/common/MainRouter.tsx` - Remove from imports

- [ ] **Task 1.4** Move MockSurveyListPage to components
  - Current: `pages/MockSurveyListPage.tsx`
  - Target: `components/projects/SurveyListComponent.tsx`
  - Action: Move file and rename
  - Effort: 10 minutes
  - Files to update:
    - [ ] `src/pages/ProjectDetailPage.tsx` - Update import
    - [ ] `src/components/common/MainRouter.tsx` - Remove from imports

#### Import Updates
- [ ] **Task 1.5** Update MainRouter imports
  - File: `src/components/common/MainRouter.tsx`
  - Changes:
    - [ ] Remove DocumentsPage import
    - [ ] Remove DesignControlsPage import
    - [ ] Remove MockSurveyPage import
    - [ ] Remove MockSurveyListPage import
  - Effort: 15 minutes
  - Verification: MainRouter still compiles, no unused imports

- [ ] **Task 1.6** Update ProjectDetailPage imports
  - File: `src/pages/ProjectDetailPage.tsx`
  - Changes:
    - [ ] Update DesignControlsPage import path
    - [ ] Update MockSurveyPage import path
    - [ ] Update MockSurveyListPage import path
  - Effort: 10 minutes
  - Verification: ProjectDetailPage renders correctly

#### Build Verification
- [ ] **Task 1.7** Verify Phase 1 cleanup build
  - Command: `npm run build`
  - Target: 0 errors, 0 new warnings
  - Expected modules: 1,725 (same as baseline)
  - Effort: 5 minutes
  - Success criteria:
    - [ ] Build completes without errors
    - [ ] TypeScript compilation: ✅
    - [ ] No missing imports

---

### 🟡 Page Navigation Consolidation

#### Audit Hub Refactoring
- [ ] **Task 1.8** Create unified AuditHubPage with 2 tabs
  - Current state:
    - `pages/AuditHubPage.tsx` - Audit planning
    - `pages/AuditLogPage.tsx` - System audit log
  - Action: Merge into single tabbed interface
  - New structure:
    ```tsx
    AuditHubPage (2 tabs)
    ├── Tab 1: Audit Planning (from AuditHubPage)
    └── Tab 2: Audit Log (from AuditLogPage)
    ```
  - Effort: 2-3 hours
  - Steps:
    - [ ] Create new tab state variable
    - [ ] Copy Tab 1 content from AuditHubPage
    - [ ] Copy Tab 2 content from AuditLogPage
    - [ ] Create tab navigation buttons
    - [ ] Style tabs consistently
    - [ ] Test tab switching
    - [ ] Delete old AuditLogPage.tsx

- [ ] **Task 1.9** Update navigation routes
  - Files to update:
    - [ ] `src/components/common/MainRouter.tsx` - Remove AuditLogPage import
    - [ ] `src/components/common/NavigationRail.tsx` - Update audit navigation
    - [ ] `src/components/common/MobileSidebar.tsx` - Update audit navigation
  - Effort: 20 minutes
  - Verification: Navigation still works, no broken links

- [ ] **Task 1.10** Test audit page functionality
  - Test cases:
    - [ ] Tab 1 (Audit Planning) loads correctly
    - [ ] Tab 2 (Audit Log) loads correctly
    - [ ] Switching between tabs works smoothly
    - [ ] All audit features function properly
    - [ ] No data loss during transition
  - Effort: 30 minutes
  - Build verification: 0 errors after merge

#### Build Verification
- [ ] **Task 1.11** Verify Phase 1 final build
  - Command: `npm run build`
  - Target: 0 errors
  - Expected modules: 1,724 (1 fewer page)
  - Effort: 5 minutes
  - Success criteria:
    - [ ] Build completes without errors
    - [ ] TypeScript: 0 errors
    - [ ] All routes work
    - [ ] No console warnings

---

## 🟡 Phase 2: QUALITY ASSURANCE (Next 2-3 Weeks)
**Effort:** 12-15 hours | **Risk:** Low | **Priority:** 🟠 HIGH

### 🧪 Test Coverage Enhancement

#### Unit Testing
- [ ] **Task 2.1** Add service layer tests
  - File: `src/services/__tests__/firebaseSetupService.test.ts`
  - Coverage:
    - [ ] testFirebaseConnection()
    - [ ] getAppSettings()
    - [ ] validateAppSettings()
    - [ ] Collection operations (create, delete, search)
    - [ ] Export/import functionality
  - Target: 80%+ coverage for firebaseSetupService
  - Effort: 4 hours
  - Success criteria: All functions have test cases with assertions

- [ ] **Task 2.2** Add store tests
  - Files:
    - [ ] `src/stores/__tests__/useAppStore.test.ts` (if missing)
    - [ ] `src/stores/__tests__/useUserStore.test.ts` (if missing)
    - [ ] `src/stores/__tests__/useProjectStore.test.ts` (if missing)
  - Coverage:
    - [ ] State initialization
    - [ ] State updates
    - [ ] Side effects
    - [ ] Error handling
  - Target: 70%+ coverage per store
  - Effort: 3 hours
  - Success criteria: All store operations tested

- [ ] **Task 2.3** Add custom hook tests
  - Hooks to test:
    - [ ] useTranslation()
    - [ ] useToast()
    - [ ] useTheme()
    - [ ] useFirebaseStatus() (if exists)
  - Effort: 2 hours
  - Success criteria: Hooks properly isolated and tested

#### Integration Testing
- [ ] **Task 2.4** Add critical path integration tests
  - Paths to test:
    - [ ] User login → Dashboard → Projects → Project Detail
    - [ ] Create new project → Add checklist items → Export
    - [ ] Firebase configuration → Test connection → Collections
    - [ ] User creation → Assignment → Task management
  - Effort: 3 hours
  - Success criteria: Critical workflows verified

- [ ] **Task 2.5** Add Firebase integration tests
  - Test cases:
    - [ ] Connection establishment
    - [ ] CRUD operations on collections
    - [ ] Batch operations
    - [ ] Real-time listeners
    - [ ] Error handling for offline
  - Effort: 2 hours
  - Success criteria: Firebase operations properly tested

#### End-to-End Testing
- [ ] **Task 2.6** Add E2E test scenarios
  - Use Playwright for:
    - [ ] Login and authentication flow
    - [ ] Project creation workflow
    - [ ] Firebase setup process
    - [ ] Data export functionality
    - [ ] Settings modifications
  - Effort: 2 hours
  - Success criteria: E2E tests runnable with `npm run test:e2e`

#### Coverage Reporting
- [ ] **Task 2.7** Setup coverage tracking
  - Action: Configure coverage thresholds
  - Target: >80% overall coverage
  - Action: Run coverage reports
    ```bash
    npm run test:coverage
    ```
  - Effort: 30 minutes
  - Success criteria: Coverage report shows >80%

---

### 🛡️ Error Handling & Boundaries

#### Error Boundary Implementation
- [ ] **Task 2.8** Add error boundaries to major sections
  - Components to wrap:
    - [ ] Dashboard (analytics, widgets) → DashboardErrorBoundary
    - [ ] Projects (list, detail) → ProjectsErrorBoundary
    - [ ] Settings (Firebase setup) → SettingsErrorBoundary
    - [ ] Training (list, detail) → TrainingErrorBoundary
    - [ ] Risk Management (hub) → RiskErrorBoundary
  - Effort: 2 hours
  - Success criteria: Error boundaries prevent full page crashes

- [ ] **Task 2.9** Create ErrorFallback component
  - Features:
    - [ ] Error message display
    - [ ] Stack trace (in dev only)
    - [ ] Retry button
    - [ ] Report button (optional)
    - [ ] Styled consistently with app
  - Effort: 30 minutes
  - Location: `src/components/common/ErrorFallback.tsx`

- [ ] **Task 2.10** Implement error logging
  - Create `src/utils/errorLogger.ts`
  - Features:
    - [ ] Log to console with context
    - [ ] Log to error tracking service (Sentry - future)
    - [ ] Include stack traces
    - [ ] Include user context (if available)
  - Effort: 1 hour
  - Success criteria: Errors properly logged and contextual

#### Error Handling Improvements
- [ ] **Task 2.11** Add null checks and guards
  - Review and update:
    - [ ] Component prop validations
    - [ ] Async operation error catches
    - [ ] Null coalescing operators
  - Effort: 1 hour
  - Success criteria: No unhandled null/undefined errors

---

### 📚 Documentation Expansion

#### API Documentation
- [ ] **Task 2.12** Document Firebase service API
  - File: `src/services/FIREBASE_SERVICE_API.md` (new)
  - Contents:
    - [ ] Function signatures
    - [ ] Parameter descriptions
    - [ ] Return value types
    - [ ] Usage examples
    - [ ] Error handling
  - Effort: 2 hours
  - Success criteria: Complete API reference available

#### Architecture Documentation
- [ ] **Task 2.13** Create architecture decision records (ADRs)
  - File: `docs/adr/` (new directory)
  - Records to document:
    - [ ] ADR-001: Why Zustand for state management
    - [ ] ADR-002: Firebase as backend choice
    - [ ] ADR-003: Service-based architecture pattern
    - [ ] ADR-004: Component composition strategy
  - Effort: 2 hours
  - Success criteria: Key decisions documented

#### Deployment Guide
- [ ] **Task 2.14** Create deployment documentation
  - File: `DEPLOYMENT_GUIDE.md` (new)
  - Contents:
    - [ ] Prerequisites
    - [ ] Environment setup
    - [ ] Build process
    - [ ] Deployment steps
    - [ ] Verification checklist
    - [ ] Rollback procedures
  - Effort: 1.5 hours
  - Success criteria: Anyone can deploy following guide

#### Troubleshooting Runbook
- [ ] **Task 2.15** Create common issues runbook
  - File: `TROUBLESHOOTING_RUNBOOK.md` (new)
  - Issues to document:
    - [ ] Firebase connection failures
    - [ ] Build errors and solutions
    - [ ] Performance bottlenecks
    - [ ] Authentication issues
    - [ ] Data sync problems
  - Effort: 1.5 hours
  - Success criteria: Quick solutions for common issues

---

## 🚀 Phase 3: PERFORMANCE & MONITORING (Next Month)
**Effort:** 12-15 hours | **Risk:** Low | **Priority:** 🟠 HIGH

### 📊 Performance Monitoring Setup

#### Web Vitals Integration
- [ ] **Task 3.1** Implement Web Vitals tracking
  - Library: `web-vitals`
  - Metrics to track:
    - [ ] Largest Contentful Paint (LCP)
    - [ ] First Input Delay (FID)
    - [ ] Cumulative Layout Shift (CLS)
    - [ ] First Contentful Paint (FCP)
  - File: `src/utils/webVitals.ts`
  - Effort: 1 hour
  - Success criteria: Metrics logged to console in development

#### Error Tracking Integration
- [ ] **Task 3.2** Setup Sentry error tracking
  - Service: https://sentry.io
  - Actions:
    - [ ] Create Sentry account/project
    - [ ] Install @sentry/react package
    - [ ] Initialize Sentry in App.tsx
    - [ ] Configure error boundary integration
    - [ ] Setup release tracking
  - Effort: 2 hours
  - Success criteria: Errors reported to Sentry dashboard

- [ ] **Task 3.3** Configure error context in Sentry
  - Features:
    - [ ] User context (user ID, email, role)
    - [ ] Release/version tracking
    - [ ] Environment tagging
    - [ ] Custom breadcrumbs
  - Effort: 1 hour
  - Success criteria: Sentry reports include context

#### Analytics Integration
- [ ] **Task 3.4** Setup Google Analytics or Plausible
  - Choice: Google Analytics 4 (GA4) or Plausible
  - Tracking:
    - [ ] Page views
    - [ ] User interactions
    - [ ] Feature usage
    - [ ] Error rates
  - File: `src/utils/analytics.ts`
  - Effort: 2 hours
  - Success criteria: Analytics dashboard shows data

#### Structured Logging
- [ ] **Task 3.5** Implement structured logging system
  - File: `src/utils/logger.ts` (new)
  - Features:
    - [ ] Log levels (DEBUG, INFO, WARN, ERROR)
    - [ ] Structured format (JSON)
    - [ ] Timestamp and context
    - [ ] Integration with error tracking
  - Effort: 1.5 hours
  - Success criteria: Logs properly formatted and collected

---

### ⚡ Performance Optimization

#### Image Optimization
- [ ] **Task 3.6** Implement image lazy loading
  - Libraries: `react-intersection-observer` or native
  - Targets:
    - [ ] Dashboard widgets
    - [ ] Project cards
    - [ ] User profile images
    - [ ] Document thumbnails
  - Effort: 2 hours
  - Success criteria: Images load only when visible

- [ ] **Task 3.7** Add image compression
  - Action: Review existing image sizes
  - Options:
    - [ ] WebP format conversion
    - [ ] Responsive image sizing
    - [ ] CDN integration
  - Effort: 1 hour
  - Success criteria: Images optimized for web

#### List Virtualization
- [ ] **Task 3.8** Add virtual scrolling for large lists
  - Library: `react-window` or similar
  - Apply to:
    - [ ] Project list (if >100 items)
    - [ ] User list (if >100 items)
    - [ ] Audit log (if >1000 items)
    - [ ] Collections search results
  - Effort: 2 hours
  - Success criteria: Large lists scroll smoothly

#### Code Splitting Optimization
- [ ] **Task 3.9** Review and optimize code splitting
  - Actions:
    - [ ] Analyze bundle with webpack-bundle-analyzer
    - [ ] Identify large modules
    - [ ] Consider lazy loading heavy modals
    - [ ] Optimize Firebase imports
  - Effort: 1 hour
  - Success criteria: Bundle analysis completed, insights documented

#### Route Prefetching
- [ ] **Task 3.10** Implement route prefetching
  - Strategy:
    - [ ] Prefetch on hover (navigation links)
    - [ ] Prefetch critical routes
    - [ ] Prefetch on idle (if bandwidth available)
  - Effort: 1 hour
  - Success criteria: Routes load faster due to prefetching

---

### 🔐 Security Hardening

#### Content Security Policy (CSP)
- [ ] **Task 3.11** Implement CSP headers
  - Actions:
    - [ ] Define CSP policy
    - [ ] Add CSP headers to server/vercel.json
    - [ ] Test with browser CSP enforcement
    - [ ] Monitor CSP violations
  - Effort: 1.5 hours
  - Success criteria: CSP headers properly configured

#### Input Sanitization
- [ ] **Task 3.12** Add sanitization for rich text editor
  - Library: `isomorphic-dompurify`
  - Apply to:
    - [ ] TipTap editor output
    - [ ] User-generated content
    - [ ] Imported data
  - Effort: 1 hour
  - Success criteria: XSS vulnerabilities eliminated

#### Rate Limiting
- [ ] **Task 3.13** Implement client-side rate limiting
  - Features:
    - [ ] Form submission throttling
    - [ ] API call rate limiting
    - [ ] Firebase operation limiting
  - Library: `lodash.throttle` or custom
  - Effort: 1 hour
  - Success criteria: Rate limits enforced

#### Dependency Auditing
- [ ] **Task 3.14** Setup automated dependency auditing
  - Actions:
    - [ ] Run `npm audit` regularly
    - [ ] Setup Dependabot (GitHub)
    - [ ] Review vulnerability reports
    - [ ] Update vulnerable packages
  - Schedule: Weekly
  - Effort: 30 minutes (recurring)
  - Success criteria: No critical vulnerabilities

---

## 💻 Phase 4: ADVANCED FEATURES (Next Quarter)
**Effort:** 30+ hours | **Risk:** Medium | **Priority:** 🟢 LOW

### 🏥 HIS Integration Completion

#### Real HIS Connection
- [ ] **Task 4.1** Connect to actual HIS system
  - Actions:
    - [ ] Obtain HIS API credentials
    - [ ] Document HIS API endpoints
    - [ ] Implement authentication
    - [ ] Create request/response mappers
  - Effort: 8 hours
  - Files:
    - [ ] `src/services/hisIntegration/hisApiClient.ts`
    - [ ] `src/services/hisIntegration/dataMapper.ts`

#### Data Synchronization
- [ ] **Task 4.2** Implement bidirectional data sync
  - Features:
    - [ ] Pull patient data from HIS
    - [ ] Push accreditation data to HIS
    - [ ] Handle conflicts
    - [ ] Retry failed syncs
    - [ ] Transaction logging
  - Effort: 6 hours
  - File: `src/services/hisIntegration/dataSync.ts`

#### Sync Scheduling
- [ ] **Task 4.3** Add scheduled sync operations
  - Features:
    - [ ] Cron-based scheduling
    - [ ] Manual sync trigger
    - [ ] Sync status dashboard
    - [ ] Error notifications
  - Effort: 3 hours
  - File: `src/services/hisIntegration/syncScheduler.ts`

#### Data Mapping Configuration
- [ ] **Task 4.4** Create data mapping UI
  - Features:
    - [ ] Visual data field mapping
    - [ ] Field transformation rules
    - [ ] Validation rules
    - [ ] Test mapping
  - Effort: 5 hours
  - Component: `src/components/his-integration/DataMappingConfig.tsx`

#### Testing Framework
- [ ] **Task 4.5** Setup HIS integration testing
  - Tests:
    - [ ] Mock HIS API responses
    - [ ] Data mapping tests
    - [ ] Sync operation tests
    - [ ] Error handling tests
    - [ ] E2E integration tests
  - Effort: 4 hours
  - File: `src/services/hisIntegration/__tests__/`

---

### 🎨 Dashboard Customization

#### Dashboard Customization Panel
- [ ] **Task 4.6** Create dashboard customization UI
  - Features:
    - [ ] Drag-and-drop widget reordering
    - [ ] Show/hide widgets
    - [ ] Custom widget sizes
    - [ ] Save layout per user
  - Effort: 4 hours
  - Component: `src/components/dashboard/DashboardCustomizer.tsx`

#### Widget Library Expansion
- [ ] **Task 4.7** Add new dashboard widgets
  - Widgets to add:
    - [ ] Custom metric cards
    - [ ] Trend comparison
    - [ ] KPI gauges
    - [ ] Calendar view
    - [ ] Quick action cards
  - Effort: 3 hours

#### User-Specific Dashboards
- [ ] **Task 4.8** Implement role-based dashboards
  - Dashboards:
    - [ ] Admin dashboard (full control)
    - [ ] Manager dashboard (team view)
    - [ ] User dashboard (personal focus)
    - [ ] Auditor dashboard (compliance focus)
  - Effort: 3 hours

---

### 🔄 Workflow Automation

#### Workflow Builder
- [ ] **Task 4.9** Create workflow automation UI
  - Features:
    - [ ] Visual workflow designer
    - [ ] Trigger conditions
    - [ ] Action definitions
    - [ ] Conditional logic
  - Effort: 6 hours
  - Component: `src/components/workflows/WorkflowBuilder.tsx`

#### Workflow Execution Engine
- [ ] **Task 4.10** Implement workflow execution
  - Features:
    - [ ] Trigger evaluation
    - [ ] Action execution
    - [ ] Error handling
    - [ ] Logging
    - [ ] Audit trail
  - Effort: 4 hours
  - File: `src/services/workflowEngine.ts`

#### Pre-built Workflow Templates
- [ ] **Task 4.11** Create workflow templates
  - Templates:
    - [ ] New project approval
    - [ ] Compliance check scheduling
    - [ ] Training completion reminder
    - [ ] Risk escalation
  - Effort: 3 hours

---

### 📱 Mobile App Consideration

#### React Native Setup
- [ ] **Task 4.12** Evaluate React Native approach
  - Actions:
    - [ ] Assess shared code potential
    - [ ] Design mobile-first features
    - [ ] Prototype key screens
  - Effort: 5 hours
  - Decision point: Proceed or use web app PWA approach

#### PWA Enhancement (Alternative)
- [ ] **Task 4.13** Enhance as Progressive Web App
  - Features:
    - [ ] Offline support
    - [ ] Install to home screen
    - [ ] Native-like experience
    - [ ] Offline data sync
  - Effort: 4 hours
  - Files:
    - [ ] Update `public/manifest.json`
    - [ ] Service worker enhancements

---

## 📊 Cross-Cutting Concerns

### 🏗️ Refactoring Opportunities

- [ ] **Task 5.1** Extract common patterns into reusable hooks
  - Current duplicated logic:
    - [ ] Form validation patterns
    - [ ] List filtering/sorting
    - [ ] Modal management
  - Effort: 2 hours

- [ ] **Task 5.2** Create custom component library
  - Export commonly used components
  - Document component API
  - Create Storybook for component showcase
  - Effort: 3 hours

- [ ] **Task 5.3** Consolidate utility functions
  - Review `src/utils/`
  - Remove duplicates
  - Organize by domain
  - Add unit tests
  - Effort: 2 hours

---

### 📋 Configuration & Infrastructure

- [ ] **Task 5.4** Setup CI/CD pipeline
  - Platform: GitHub Actions (or similar)
  - Pipeline stages:
    - [ ] Lint & format check
    - [ ] TypeScript compilation
    - [ ] Unit test execution
    - [ ] E2E test execution
    - [ ] Build creation
    - [ ] Deployment
  - Effort: 4 hours

- [ ] **Task 5.5** Configure Firebase security rules
  - Actions:
    - [ ] Review and harden rules
    - [ ] Test rule effectiveness
    - [ ] Document rule logic
    - [ ] Setup rule deployment
  - Effort: 2 hours

- [ ] **Task 5.6** Setup environment configuration
  - Actions:
    - [ ] Create .env templates
    - [ ] Document all env variables
    - [ ] Setup per-environment configs
    - [ ] Secure sensitive values
  - Effort: 1 hour

---

## 🎯 Success Metrics Tracking

### Phase 1 Success Criteria ✅
- [ ] Build succeeds with 0 errors
- [ ] No TypeScript errors
- [ ] All navigation routes work
- [ ] Deleted files don't break imports
- [ ] Test suite passes

### Phase 2 Success Criteria ✅
- [ ] Test coverage reaches 80%+
- [ ] All critical paths covered
- [ ] Error boundaries deployed
- [ ] Documentation complete
- [ ] No new issues from changes

### Phase 3 Success Criteria ✅
- [ ] Web Vitals metrics available
- [ ] Error tracking functional
- [ ] Performance metrics tracked
- [ ] Security measures implemented
- [ ] Bundle size maintained <800KB

### Phase 4 Success Criteria ✅
- [ ] HIS integration complete
- [ ] Dashboard customization working
- [ ] Workflow automation functional
- [ ] Mobile-ready (PWA or RN decision)
- [ ] All features tested and documented

---

## 📅 Timeline & Resource Allocation

```
WEEK 1-2:  Phase 1 (Code Cleanup)          → 5 hours
WEEK 3-5:  Phase 2 (Quality)              → 12-15 hours
WEEK 6-8:  Phase 3 (Performance)          → 12-15 hours
WEEK 9-13: Phase 4 (Advanced)             → 30+ hours

TOTAL ESTIMATED: 50-60 hours (6-8 weeks for one developer)
```

---

## 🔄 Iteration & Review

- [ ] **Weekly:** Review completed tasks and adjust priorities
- [ ] **Bi-weekly:** Merge completed phases and verify stability
- [ ] **Monthly:** Assess progress against timeline
- [ ] **Quarterly:** Plan next iteration of improvements

---

## 📝 Notes & Dependencies

### Task Dependencies
```
Phase 1 → Phase 2 (must complete before starting)
Phase 2 → Phase 3 (can run in parallel after Phase 1)
Phase 3 → Phase 4 (can run in parallel after Phase 1)
```

### External Dependencies
- Sentry account (for error tracking)
- Google Analytics account (for analytics)
- HIS system access (for Phase 4)
- Hosting platform (Vercel, Firebase, etc.)

### Known Risks
- Database migration if schema changes (Phase 4)
- Performance regression if not careful with optimization
- Breaking changes if refactoring stores/services
- Mitigation: Test thoroughly, use feature flags

---

## ✅ Completion Tracking

**Total Tasks:** 62  
**Completed:** 0  
**In Progress:** 0  
**Not Started:** 62  
**Completion Rate:** 0%

---

**Last Updated:** December 4, 2025  
**Next Review:** December 11, 2025  
**Status:** Ready to begin Phase 1 ✅
