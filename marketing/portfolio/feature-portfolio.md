---
name: accreditex-portfolio-builder
role: Portfolio & Feature Showcase Builder
domain: marketing
outputs: [feature-portfolio, capability-matrix, module-showcase, demo-guide]
---

# AccrediTex Portfolio Builder

## Mission
Build detailed feature showcase content that demonstrates AccrediTex's full depth to prospects, investors, and partners. Every claim is verifiable against the live codebase.

## Full Module Portfolio (19 Production Modules)

### 1. Risk Hub
**Location:** `src/pages/RiskHubPage.tsx` + `src/components/risk/`
**Features:**
- Risk Register with 5×5 likelihood/impact matrix (heatmap visualization)
- Summary cards: Critical / High / Medium / Low counts with click-to-filter
- Search and status filter bar
- Incident Reporting with severity badges (Sentinel, Severe, Moderate, Minor)
- Root Cause Analysis (RCA) Tool — Fishbone (Ishikawa) + 5-Why analysis
- CAPA integration directly from risk items
- Effectiveness Checks — close the loop on every action
- Color-coded risk level badges on all records
**Accreditation Standards:** JCI QPS, CBAHI Risk Management, ISO 31000

---

### 2. Document Control
**Location:** `src/components/documents/`
**Features:**
- TipTap v3 rich text editor (full formatting, tables, images)
- Version control with full history + change tracking
- Document approval workflow with role-based sign-off
- Compliance template library (JCI, CBAHI, ISO templates)
- Batch audit — audit 100+ documents simultaneously
- DOCX import + PDF export
- Compliance checker against standards
- Document audit panel with gap analysis
**Accreditation Standards:** JCI MOI, CBAHI Documentation, ISO 9001

---

### 3. Audit Hub
**Location:** `src/components/audits/`
**Features:**
- Internal audit scheduler with calendar view
- Tracer worksheet builder (patient tracer, system tracer)
- Audit checklist builder by standard chapter
- Audit log with full trail
- Finding management and corrective action linking
- Audit change control panel
**Accreditation Standards:** JCI all chapters, CBAHI self-assessment

---

### 4. CAPA Management
**Location:** `src/components/capa/`
**Features:**
- Corrective and Preventive Action full lifecycle management
- Root cause linkage from incidents and audits
- Assignee tracking + deadline management
- Effectiveness verification workflow
- CAPA aging dashboard
- Integration with Risk Hub and Audit Hub
**Accreditation Standards:** ISO 13485, JCI QI, CBAHI CAPA requirements

---

### 5. AI Assistant
**Location:** `src/components/ai/`
**Features:**
- Built-in AI for document drafting (policies, procedures, forms)
- Compliance gap analysis against standards
- Incident summary and CAPA suggestion generation
- Risk assessment guidance
- 24/7 availability, bilingual (AR/EN)
- Chat interface with context-aware responses

---

### 6. Training Management
**Location:** `src/components/training/`
**Features:**
- Training program builder with modules and assessments
- Staff competency tracking
- Training completion reports
- Survey day competency documentation
- Department-level training dashboards
**Accreditation Standards:** JCI SQE, CBAHI HR standards

---

### 7. Lab Operations
**Location:** `src/components/lab-ops/`
**Features:**
- ISO 15189 / CAP compliance workflows
- Specimen management integration
- Proficiency testing tracking
- Equipment calibration schedule
- LIMS integration (10 pre-built connectors)
**Accreditation Standards:** ISO 15189, CAP, JCI AOP laboratory

---

### 8. HIS Integration
**Location:** `src/services/hisIntegration/` (18 files)
**Features:**
- 18 pre-built Healthcare Information System connectors
- Patient data sync for tracer activities
- Real-time data feeds for compliance monitoring
- Bidirectional data exchange
- Zero custom development for supported HIS platforms

---

### 9. Supplier Management
**Location:** `src/components/suppliers/`
**Features:**
- Approved supplier register
- Supplier qualification and evaluation
- Contract tracking
- Supplier audit scheduling
- Performance scoring
**Accreditation Standards:** JCI FMS, CBAHI Supply Chain

---

### 10. Change Control
**Location:** `src/components/changeControl/`
**Features:**
- Change Request (CCR) lifecycle management
- Impact assessment workflow
- Approval routing
- Implementation tracking
- Change audit trail
**Accreditation Standards:** ISO 9001 clause 6.3, JCI change management

---

### 11. Analytics & Reports
**Location:** `src/components/analytics/` + `src/components/reports/`
**Features:**
- Recharts v3 dashboards (bar, line, pie, area charts)
- KPI tracking across all modules
- Accreditation readiness score (real-time)
- PDF report generation with export
- Executive summary reports
- Trend analysis over time

---

### 12. Notifications & Alerts
**Location:** `src/components/notifications/`
**Features:**
- Real-time alerts for CAPA deadlines, document expiry, audit dates
- Role-based notification routing
- Dashboard alert banner with severity levels
- Email notification integration
- Mobile push notifications (Capacitor)

---

### 13. Projects
**Location:** `src/pages/ProjectsPage.tsx` + `src/services/projectService.ts`
**Features:**
- Accreditation project management
- Milestone tracking
- Department assignment
- Progress visualization
- Integration with all compliance modules

---

### 14. Calendar
**Location:** `src/components/calendar/`
**Features:**
- Unified calendar for audits, CAPA deadlines, training, surveys
- Department-level filtering
- Reminder scheduling
- Survey countdown timeline

---

### 15. Workflow Engine
**Location:** `src/services/workflowEngine.ts`
**Features:**
- Configurable approval workflows
- Multi-step routing with conditional logic
- Escalation rules
- Notification triggers
- Audit trail on every state transition

---

### 16. Settings (8 Categories)
**Location:** `src/components/settings/`
**Features:**
- Organization profile + branding
- User management + role assignment
- Accreditation standard configuration
- White-label theme customization (logo, colors, fonts)
- Integration settings (HIS, LIMS, notifications)
- Security settings (2FA, session management)
- Locale settings (EN/AR)
- Module activation (enable/disable per subscription tier)

---

### 17. Multi-Role Dashboards
**Location:** `src/components/dashboard/`
**Features:**
- Role-specific views: Admin, QA Manager, Department Head, Auditor, Staff
- Widgets: Alerts banner, Quick Actions, Recent Items, Overdue Tasks, Pending Approvals, Audit Readiness, Feature Discovery
- Recharts analytics inline
- Customizable widget layout

---

### 18. Mobile App (iOS + Android)
**Technology:** Capacitor v8
**Features:**
- Full platform access on mobile devices
- Offline mode with sync (in progress)
- Native camera for document capture
- Biometric authentication (planned)
- Push notifications
- Optimized mobile UI with touch targets

---

### 19. Multi-Tenant / White-Label
**Location:** `src/stores/useCustomizationStore.ts`
**Features:**
- Per-tenant branding (logo, primary color, fonts)
- Custom domain support (in roadmap)
- Consultant white-label licensing
- Data isolation per tenant (Firestore security rules)
- Theme persists across sessions and mobile

## Technical Capability Matrix

| Capability | Detail | Verified |
|---|---|---|
| Frontend Framework | React 19 + TypeScript 5.8 | ✅ |
| UI Styling | TailwindCSS v4 + brand tokens | ✅ |
| Animation | Framer Motion v11 | ✅ |
| Rich Text Editor | TipTap v3 | ✅ |
| Charts | Recharts v3 | ✅ |
| Database | Firebase Firestore | ✅ |
| Auth | Firebase Auth | ✅ |
| File Storage | Firebase Storage | ✅ |
| Hosting | Firebase Hosting | ✅ |
| Mobile | Capacitor v8 (iOS + Android) | ✅ |
| Build Tool | Vite v6 | ✅ |
| State Management | Zustand v5 | ✅ |
| Routing | react-router-dom v7 | ✅ |
| i18n | 22 EN + 22 AR module files | ✅ |
| Testing | Jest 30 + Playwright E2E | ✅ |
| Security Rules | Firestore + Storage rules | ✅ |
| HIS Connectors | 18 pre-built | ✅ |
| LIMS Connectors | 10 pre-built | ✅ |
