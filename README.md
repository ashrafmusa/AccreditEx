# AccreditEx — Healthcare Accreditation Management Platform

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-37%2B-blue)
![License](https://img.shields.io/badge/license-MIT-blue)
![Pages](https://img.shields.io/badge/pages-46-blue)
![AI Workflows](https://img.shields.io/badge/AI%20Workflows-8-blue)
![Deploy](https://img.shields.io/badge/live-accreditex.web.app-green)

AccreditEx is a modern, AI-powered healthcare accreditation management platform designed to support hospitals and clinical laboratories throughout their accreditation journey. Built with a **live Firebase + Firestore backend** and deployed at **https://accreditex.web.app**, it streamlines the management of accreditation programs (JCI, CBAHI, DNV, CAP, ISO 15189, NABH, ISO 9001), ensures traceability of all actions, and maintains compliance across the entire organization — in **English and Arabic** with full RTL support.

## Table of Contents

- [Getting Started](#getting-started)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architectural Approach](#architectural-approach)
- [Project Structure](#project-structure)
- [Backend & Data Persistence](#backend--data-persistence)
- [AI Integration](#ai-integration)
- [Lab Operations Module](#lab-operations-module)
- [Contributing](#contributing)

## Key Features

### Core Platform (46 Pages)
-   **Role-Based Dashboards**: Admin, Project Lead, Team Member, and Auditor views with real-time compliance KPIs.
-   **Project Management**: Full accreditation project lifecycle with pre-built templates for 7+ accreditation programs (JCI, CBAHI, DNV, CAP, ISO 15189, NABH, ISO 9001).
-   **Document Control Hub**: Version-controlled document management with AI-powered document generation, automatic document numbering, and approval workflows.
-   **Risk Management Hub**: ISO 31000-compliant risk register with risk matrices, CAPA integration, and root cause analysis (Fishbone + Five-Why).
-   **Audit Management Hub**: Internal/external audit planning, tracer worksheets, findings management, and corrective action tracking.
-   **Training & Competency**: Full LMS with quiz-based training, certificate generation, CE credit tracking, skill matrices, learning paths, and competency gap analysis.
-   **Analytics Hub**: Multi-format reporting (PDF, Excel, CSV, JSON), AI-powered quality insights, PDCA cycle tracking, and executive briefings.

### Hospital-Specific Features
-   **Accreditation Hub**: Cross-standard evidence mapping, pre-loaded 240+ standards / 1,043 sub-standards.
-   **Personnel Files Management**: Centralized employee file tracking with credential verification and expiry alerts.
-   **Licensure Tracking**: Professional license monitoring with renewal reminders and status dashboards.
-   **Escalation Service**: Automated escalation workflows with configurable rules and notification chains.
-   **QAPI Templates**: Pre-built Quality Assessment & Performance Improvement project templates.
-   **Incident Reporting**: 5 lab-specific incident types with structured reporting workflows.

### Laboratory Operations Module
-   **Lab Operations Page**: 5-tab hub for laboratory compliance management.
-   **CAP Assessment**: 11 CAP discipline assessments with 6-element evaluation framework (726 lines of functionality).
-   **QC Data Import**: Import QC data from external systems with validation and trending (584-line UI + 378-line service).
-   **LIMS Integration**: Multi-vendor LIMS connectivity (Orchard, SoftLab, Sunquest) via HL7 and REST connectors (10 service files).
-   **Knowledge Base**: 552-line searchable knowledge base with categorized articles and quick-reference guides.
-   **Tracer Worksheets**: 931-line interactive tracer worksheet tool for CAP/JCI survey preparation.

### AI-Assisted Workflows (8 Capabilities)

AccreditEx integrates **AI-powered workflows** powered by **3 specialist domains** (Compliance, Risk Assessment, Training) and **Groq/Llama-3.3-70b** inference:

**Specialist Routing**:
-   **Compliance Specialist**: Analyzes documents against accreditation standards (CBAHI, JCI, ISO 9001). Detects gaps, assigns risk levels, recommends corrective actions.
-   **Risk Assessment Specialist**: Evaluates compliance risks using 5×5 risk matrices, identifies high-impact threats, proposes mitigation strategies.
-   **Training Coordinator**: Plans competency-based training, designs learning paths, generates training needs analyses aligned with accreditation requirements.

**Dedicated Workflows**:
-   **Action Plan Generation**: Creates compliance roadmaps from non-compliant standards with specific, measurable corrective actions.
-   **Root Cause Analysis**: Applies 5 Whys methodology and Fishbone analysis for structured problem-solving (Process, Human, Training, System factors).
-   **PDCA Improvement Suggestions**: Guides Plan-Do-Check-Act cycles with measurable success metrics and implementation timelines.
-   **Survey Readiness Assessment**: Evaluates organizational readiness for upcoming accreditation surveys, identifies high-risk areas, suggests preparation priorities.
-   **Design Control Compliance**: Assesses design traceability, verifies compliance with design control requirements, validates verification and validation plans.

**General Chat**: Context-aware conversational AI for questions about accreditation standards, best practices, compliance strategies, and platform guidance. Fallback for all workflow endpoints if specialists are unavailable.

**Provider**: Groq API (Llama-3.3-70b-versatile, free tier) with Firebase authentication. Response caching reduces token usage by 60-80%.

### Workflow Automation
-   **Trigger-Condition-Action Engine**: 10 entity types × 10 event types, 8 condition operators, 11 action types.
-   **Visual Workflow Builder**: 4-step modal for creating workflows with real-time config.
-   **Execution Logging**: Per-action status tracking with expandable log detail.
-   **Template Gallery**: Pre-built workflow templates for common accreditation scenarios.
-   **AI Integration**: AI-powered workflow suggestions, log analysis, and AI Generate action type.

### Custom Report Builder
-   **Section-Based Designer**: Visual builder with 6 block types (header, text, metric, chart, table, divider).
-   **13 Data Sources**: Projects, documents, risks, audits, trainings, incidents, and more.
-   **Live Preview**: Real-time chart/metric rendering with data from Zustand stores.
-   **Export**: PDF (jsPDF) and CSV export with configurable page orientation and headers.
-   **Template Gallery**: 5 pre-built report templates (compliance overview, risk assessment, etc.).
-   **AI Integration**: AI report analysis, AI text generation, AI template recommendations.

### Platform Capabilities
-   **Bilingual & RTL Support**: Full English/Arabic with 400+ translation keys, RTL layout, bidirectional text.
-   **Accessibility**: WCAG 2.1 Level AA compliant — high contrast, reduce motion, font adjustment, keyboard navigation.
-   **Light & Dark Mode**: Comfortable viewing in any condition with custom color themes.
-   **Departmental Management**: Department dashboards, performance metrics, and task delegation.
-   **Security Dashboard**: Audit logging, session management, usage analytics, and monitoring.
-   **Settings**: 19 settings sections including LIMS Integration configuration.
-   **PWA & Offline-First**: Progressive Web App with IndexedDB persistence (`idb`), `useOfflineSync` hook for background sync, Service Worker v4 with stale-while-revalidate caching, and enhanced offline indicator with pending-sync count.
-   **Interactive Guided Tour**: Lightweight tooltip-based onboarding tour with 2 tour tracks (New User, Quality Manager), keyboard navigation, dark mode, and RTL support.
-   **SEO Optimized**: Open Graph, Twitter Cards, JSON-LD structured data, dynamic meta descriptions for 17+ views, preconnect/DNS-prefetch hints.

### Native Mobile (Capacitor 8.x)
-   **Cross-Platform Native Wrapper**: Single codebase deploys to Android (APK/AAB), iOS (IPA), and Web (PWA).
-   **Native Camera Evidence Capture**: Take photos or pick from gallery directly within checklists via `@capacitor/camera`.
-   **Push Notifications (FCM)**: 4 notification channels (task deadlines, audit reminders, document approvals, system alerts) with topic-based subscriptions.
-   **Biometric Authentication**: Fingerprint and Face ID login via device keychain/keystore (capacitor-native-biometric).
-   **Native Lifecycle Integration**: Status bar theming, splash screen, hardware back button handling, keyboard adjustments.
-   **Platform Detection**: `capacitorPlatform.ts` utility with graceful web fallbacks for all native features.

## Technology Stack

-   **Frontend**: React 19.1.1, TypeScript 5.x, Tailwind CSS v4 (native), Vite 6.x
-   **Native Mobile**: Capacitor 8.x (10 plugins: camera, push-notifications, haptics, status-bar, splash-screen, app, keyboard, preferences, filesystem + capacitor-native-biometric)
-   **State Management**: Zustand (15 stores: `useAIChatStore`, `useAppStore`, `useChangeControlStore`, `useConfirmStore`, `useCustomizationStore`, `useHISIntegrationStore`, `useLabOpsStore`, `useModuleStore`, `useProjectStore`, `useReportBuilderStore`, `useSupplierStore`, `useTenantStore`, `useTourStore`, `useUserStore`, `useWorkflowStore`)
-   **Offline Storage**: IndexedDB via `idb` (3 stores: `cachedData`, `pendingSync`, `meta`) + in-memory Firestore cache with 5-min TTL
-   **Backend**: Google Firebase
    -   **Authentication**: Firebase Authentication (Email/Password)
    -   **Database**: Google Firestore (real-time)
    -   **Storage**: Firebase Storage (document files)
    -   **Hosting**: Firebase Hosting (https://accreditex.web.app)
-   **Charting**: Recharts
-   **AI Integration**: Custom AI Agent Backend (Python FastAPI on Render — https://accreditex.onrender.com)
-   **Routing**: React Router DOM 7.13.0 (43 route definitions including legacy redirects)
-   **Testing**: Jest + Playwright + React Testing Library (37 unit test files + 6 E2E specs)

## Architectural Approach

AccreditEx is built on a clean, scalable, and modular architecture to ensure long-term maintainability.

1.  **Frontend (React Application)**: 46 page components, 333 feature components, and reusable UI components across 34 domains. The application uses `AppRouter.tsx` with URL-based routing via React Router DOM.

2.  **State Management (Zustand)**: 15 feature-based stores (`useAIChatStore`, `useAppStore`, `useChangeControlStore`, `useConfirmStore`, `useCustomizationStore`, `useHISIntegrationStore`, `useLabOpsStore`, `useModuleStore`, `useProjectStore`, `useReportBuilderStore`, `useSupplierStore`, `useTenantStore`, `useTourStore`, `useUserStore`, `useWorkflowStore`) provide reactive state management decoupled from the UI.

3.  **Service Layer (123 services)**: Domain-specific services across accreditation, audit, training, escalation, QC import, LIMS integration, HIS integration, native camera, native push, native biometric, and supporting platform modules. The `BackendService.ts` remains the central orchestrator for Firebase/Firestore operations.

4.  **Integration Layer**: HIS Integration (18 files — Epic, Cerner, HL7, FHIR connectors) and LIMS Integration (10 files — Orchard, SoftLab, Sunquest connectors) provide healthcare system interoperability.

5.  **AI Layer (`ai.ts` → `aiAgentService.ts`)**: Routes all AI requests through the FastAPI backend on Render. No third-party AI API keys are exposed in the browser.

6.  **Native Mobile Layer (Capacitor 8.x)**: Platform-agnostic native bridge providing camera, push notifications, biometric auth, and device lifecycle integration. All native features include web fallbacks for PWA compatibility.

## Project Structure

```
src/
├── components/              # Feature components organized by domain
│   ├── audits/              # TracerWorksheetTab, audit components
│   ├── data-hub/            # QCDataImportTab, data components
│   ├── risk/                # RCAToolTab, risk components
│   ├── training/            # CAPAssessmentTab, CECreditsTab, SkillMatrixTab,
│   │                        # PersonnelFilesTab, LicensureTrackingTab,
│   │                        # LearningPathsTab, training components
│   ├── dashboard/           # Dashboard widgets and feature discovery
│   ├── settings/            # 19 settings section components
│   └── ...                  # Additional component directories
├── data/                    # Static data and localization
│   ├── locales/             # Modularized i18n translation files (EN/AR)
│   └── *.json               # Firestore seed data
├── firebase/                # Firebase configuration and hooks
├── hooks/                   # Custom React hooks
│   └── usePushNotifications.ts  # NEW: Push notification lifecycle hook
├── pages/                   # 46 page components
│   ├── LabOperationsPage.tsx    # 5-tab lab operations hub
│   ├── KnowledgeBasePage.tsx    # Searchable knowledge base
│   └── ...                      # 44 additional page components
├── router/                  # AppRouter.tsx + routes.ts (43 route definitions)
├── services/                # 123 domain services
│   ├── hisIntegration/      # 18 files: Epic, Cerner, HL7, FHIR connectors
│   ├── limsIntegration/     # 10 files: Orchard, SoftLab, Sunquest connectors
│   ├── nativeCameraService.ts   # NEW: Camera capture with web fallback
│   ├── nativePushService.ts     # NEW: FCM push notifications
│   ├── nativeBiometricService.ts # NEW: Biometric auth (fingerprint/face)
│   ├── escalationService.ts     # Automated escalation workflows
│   ├── qcDataImportService.ts   # QC data import with validation
│   └── ...                      # 70+ additional root services
├── stores/                  # 15 Zustand stores
├── types/                   # 14 type definition files
├── utils/                   # 39 utility modules
│   ├── capacitorPlatform.ts     # NEW: Platform detection & native fallbacks
│   ├── capacitorInit.ts         # NEW: Native lifecycle initialization
│   └── ...                      # Additional utilities
├── App.tsx                  # Root component with providers
└── index.tsx                # Entry point
capacitor.config.ts              # Capacitor native mobile configuration
```

## Backend & Data Persistence

The application uses Google Firebase for authentication and Google Firestore for its database, ensuring all data is persisted in the cloud and updated in real-time.

### Initialization and Seeding

-   The `services/BackendService.ts` service manages all data operations.
-   On the application's first launch, the service checks for a metadata flag in Firestore.
-   If the flag is not present, it populates the Firestore database by writing the initial data from the JSON files located in the `/data` directory (e.g., `projects.json`, `users.json`).
-   On subsequent launches, the service loads all data directly from Firestore.

### Resetting the Database

To reset the application to its initial seed state, you must manually clear the data in your Firebase project's Firestore console.
1.  Navigate to your project in the Firebase Console.
2.  Go to the "Firestore Database" section.
3.  Delete all collections (e.g., `projects`, `users`, `_metadata`, etc.).
4.  Refresh the AccreditEx application in your browser. It will detect the empty database and re-seed it with the initial data.

## AI Integration

AI-powered features (15+ tools) are provided by a custom Python FastAPI backend deployed on Render at `https://accreditex.onrender.com`.

-   The frontend AI facade (`services/ai.ts`) routes all requests through `services/aiAgentService.ts`.
-   `aiAgentService.ts` communicates with the backend at the URL configured in `VITE_AI_AGENT_URL`.
-   No third-party AI API keys are exposed in the browser — the backend manages all AI provider credentials server-side.
-   **Configuration**: Set `VITE_AI_AGENT_URL` and `VITE_AI_AGENT_API_KEY` in your `.env` file.

## Lab Operations Module

The Lab Operations module (P2 roadmap item, fully implemented) provides:
-   **LabOperationsPage**: 5-tab hub for laboratory compliance
-   **CAP Assessment Tab**: 11 CAP disciplines × 6-element competency evaluation (726 lines)
-   **QC Data Import Tab**: CSV/JSON import with validation and trending (584 lines + 378-line service)
-   **LIMS Integration**: Multi-vendor connectivity via `src/services/limsIntegration/` (10 files)
-   **Tracer Worksheets**: Interactive CAP/JCI survey preparation tool (931 lines)
-   **Knowledge Base**: Searchable articles with categorized content (552 lines)

## Quick Commands
```bash
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Production build
npm run test             # Run all unit tests (Jest)
npm run test:coverage    # Tests with coverage report
npm run test:e2e         # Run Playwright E2E tests
npx cap sync             # Sync web build → native projects (Android/iOS)

# Deployment scripts (in scripts/ folder)
npx powershell -NoProfile -ExecutionPolicy Bypass -File scripts/deploy-render.ps1    # Deploy to Render
npx powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-render-service.ps1  # Setup Render service
npx powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-ai-agent.ps1    # Test AI agent
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Last Updated:** May 10, 2026 | **Version:** 2.4 | **Live:** https://accreditex.web.app