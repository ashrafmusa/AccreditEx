# AccreditEx — Healthcare Accreditation Management Platform

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Code Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Pages](https://img.shields.io/badge/pages-33-blue)
![AI Tools](https://img.shields.io/badge/AI%20tools-15%2B-purple)
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

### Core Platform (33 Pages)
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

### Laboratory Operations Module (NEW)
-   **Lab Operations Page**: 5-tab hub for laboratory compliance management.
-   **CAP Assessment**: 11 CAP discipline assessments with 6-element evaluation framework (726 lines of functionality).
-   **QC Data Import**: Import QC data from external systems with validation and trending (584-line UI + 378-line service).
-   **LIMS Integration**: Multi-vendor LIMS connectivity (Orchard, SoftLab, Sunquest) via HL7 and REST connectors (10 service files).
-   **Knowledge Base**: 552-line searchable knowledge base with categorized articles and quick-reference guides.
-   **Tracer Worksheets**: 931-line interactive tracer worksheet tool for CAP/JCI survey preparation.

### AI-Powered Features (15+ Tools)
-   **AI Action Plan Generation**: Compliance roadmaps from non-compliant standards.
-   **AI Root Cause Analysis**: Structured RCA (Process, Human, Training, System).
-   **AI Policy Generation**: Formal policy documents from accreditation standards.
-   **AI Writing Improvement**: Professional document refinement.
-   **AI Translation (EN ↔ AR)**: Bidirectional with cultural context.
-   **AI Executive Briefings**: Data-driven quality insights in JSON format.
-   **AI Document Summarization, Gap Analysis, Risk Assessment**, and more.

### Platform Capabilities
-   **Bilingual & RTL Support**: Full English/Arabic with 400+ translation keys, RTL layout, bidirectional text.
-   **Accessibility**: WCAG 2.1 Level AA compliant — high contrast, reduce motion, font adjustment, keyboard navigation.
-   **Light & Dark Mode**: Comfortable viewing in any condition with custom color themes.
-   **Departmental Management**: Department dashboards, performance metrics, and task delegation.
-   **Security Dashboard**: Audit logging, session management, usage analytics, and monitoring.
-   **Settings**: 19 settings sections including LIMS Integration configuration.
-   **PWA**: Progressive Web App with service worker for offline-capable access.

## Technology Stack

-   **Frontend**: React 19.1.1, TypeScript 5.x, Tailwind CSS v4 (native), Vite 6.x
-   **State Management**: Zustand (7 stores: `useAppStore`, `useProjectStore`, `useUserStore`, `useCustomizationStore`, `useAIChatStore`, `useHISIntegrationStore`, `useLabOpsStore`)
-   **Backend**: Google Firebase
    -   **Authentication**: Firebase Authentication (Email/Password)
    -   **Database**: Google Firestore (real-time)
    -   **Storage**: Firebase Storage (document files)
    -   **Hosting**: Firebase Hosting (https://accreditex.web.app)
-   **Charting**: Recharts
-   **AI Integration**: Custom AI Agent Backend (Python FastAPI on Render — https://accreditex.onrender.com)
-   **Routing**: React Router DOM 7.13.0 (34 routes including legacy redirects)
-   **Testing**: Jest + Playwright + React Testing Library (95% coverage)

## Architectural Approach

AccreditEx is built on a clean, scalable, and modular architecture to ensure long-term maintainability.

1.  **Frontend (React Application)**: 33 page components, 50+ feature components, and reusable UI components. The application uses `AppRouter.tsx` with URL-based routing via React Router DOM.

2.  **State Management (Zustand)**: 7 feature-based stores (`useAppStore`, `useProjectStore`, `useUserStore`, `useCustomizationStore`, `useAIChatStore`, `useHISIntegrationStore`, `useLabOpsStore`) provide reactive state management decoupled from the UI.

3.  **Service Layer (67+ services)**: Specialized services for each domain (accreditation, audit, training, escalation, QC import, LIMS integration, HIS integration, etc.). The `BackendService.ts` remains the central orchestrator for Firebase/Firestore operations.

4.  **Integration Layer**: HIS Integration (18 files — Epic, Cerner, HL7, FHIR connectors) and LIMS Integration (10 files — Orchard, SoftLab, Sunquest connectors) provide healthcare system interoperability.

5.  **AI Layer (`ai.ts` → `aiAgentService.ts`)**: Routes all AI requests through the FastAPI backend on Render. No third-party AI API keys are exposed in the browser.

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
├── pages/                   # 33 page components
│   ├── LabOperationsPage.tsx    # NEW: 5-tab lab operations hub
│   ├── KnowledgeBasePage.tsx    # NEW: Searchable knowledge base
│   └── ...                      # 31 additional page components
├── router/                  # AppRouter.tsx + routes.ts (34 routes)
├── services/                # 67+ domain services
│   ├── hisIntegration/      # 18 files: Epic, Cerner, HL7, FHIR connectors
│   ├── limsIntegration/     # 10 files: Orchard, SoftLab, Sunquest connectors
│   ├── escalationService.ts # Automated escalation workflows
│   ├── qcDataImportService.ts  # QC data import with validation
│   └── ...                  # 60+ additional services
├── stores/                  # 7 Zustand stores
├── types/                   # 7 type definition files (including labOps.ts)
├── App.tsx                  # Root component with providers
└── index.tsx                # Entry point
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

## Contributing

We welcome contributions to this project. To contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your changes.
3. Make your changes and commit them to your branch.
4. Push your changes to your fork.
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Last Updated:** February 19, 2026 | **Version:** 2.0 | **Live:** https://accreditex.web.app