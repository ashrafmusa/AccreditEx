# AccreditEx — Projects System & AI Integration Audit

**Date:** February 16, 2026  
**Purpose:** Understand how Projects work end-to-end, identify AI integration gaps across all project phases, and plan smooth AI-powered workflows.

---

## 1. Project System Architecture

### Data Model

| Type | Key Fields | Purpose |
|------|-----------|---------|
| `Project` | id, name, programId, status, progress, checklist[], mockSurveys[], capaReports[], designControls[], pdcaCycles[], teamMembers[], activityLog[] | Central entity |
| `ChecklistItem` | standardId, status, assignedTo, dueDate, actionPlan, notes, evidenceFiles[], comments[] | Compliance tracking per standard |
| `DesignControlItem` | standardId, policyProcess, implementationEvidence, auditFindings, outcomeKPI, linkedDocumentIds[] | Requirements traceability matrix |
| `MockSurvey` | results[], status, date | Pre-assessment simulation |
| `CAPAReport` | rootCause, correctiveAction, preventiveAction, pdcaStage, pdcaHistory[], effectivenessCheck | Corrective/preventive actions |
| `PDCACycle` | currentStage, stageHistory[], improvementMetrics, linkedCAPAIds[], category, priority | Continuous improvement cycles |

### Project Lifecycle

```
┌─────────────┐    ┌──────────────┐    ┌─────────┐    ┌───────────┐    ┌───────────┐
│ Not Started  │───▶│ In Progress  │───▶│ On Hold │───▶│ Completed │───▶│ Finalized │
│  (Creation)  │    │ (Active Work)│    │(Paused) │    │ (Done)    │    │ (Locked)  │
└─────────────┘    └──────────────┘    └─────────┘    └───────────┘    └───────────┘
```

### Project Detail Views (Tabs)

| Tab | Component | Purpose |
|-----|-----------|---------|
| **Overview** | `ProjectOverview` | Compliance stats, team members, recent activity |
| **Checklist** | `ProjectChecklist` → `ChecklistItemComponent` | Per-standard compliance items with evidence & comments |
| **Design Controls** | `DesignControlsComponent` | Requirements traceability matrix |
| **Mock Surveys** | `SurveyListComponent` → `SurveyComponent` | Pre-assessment survey execution |
| **PDCA Cycles** | `PDCACycleManager` → `PDCACycleCard` | Kanban-style CAPA & improvement cycle management |
| **Audit Log** | `AuditLogComponent` | Activity history |

---

## 2. Current AI Integration Status

### Where AI IS Integrated

| Phase | Component | AI Method | What It Does | UX |
|-------|-----------|-----------|-------------|-----|
| **Checklist** | `ChecklistItemComponent` | `generateActionPlan()` | AI-generates action plan for non-compliant items | "🤖 Ask AI" button → fills action plan field |
| **Checklist** | `ChecklistItemComponent` | `suggestReusableEvidence()` | Cross-standard evidence reuse suggestions | Badge with match scores (keyword-based, not AI) |
| **Design Controls** | `DesignControlsComponent` | `checkDesignCompliance()` | Bulk AI compliance check of all design controls | Button → AISuggestionModal |
| **PDCA/CAPA** | `PDCACycleCard` | `suggestPDCAImprovements()` | AI improvement suggestions for a PDCA cycle | Button → AISuggestionModal |
| **PDCA/CAPA** | `PDCACycleCard` | `analyzeRootCause()` | AI root cause analysis for CAPAs | Button → AISuggestionModal |
| **Reports** | `ProjectDetailPage` | `generateAIComplianceReport()` | Full AI-powered PDF compliance report | Button in header → generates & uploads PDF |
| **Survey Report** | `SurveyReportPage` | `assessSurveyRisk()` | AI risk assessment of failed survey items | Auto-runs on report page load |

### Where AI is NOT Integrated (Gaps)

| Phase | Component | Gap | Impact |
|-------|-----------|-----|--------|
| **Project Creation** | Create Project form | No AI assistance for project setup, scope definition, or program-specific checklist generation | Users manually configure everything from scratch |
| **Overview** | `ProjectOverview` | No AI project health briefing or readiness assessment | Users see raw stats but no intelligent insights |
| **Checklist** | `ChecklistItemComponent` | No AI for notes/findings pre-fill, status suggestions, or compliance gap detection | Manual assessment only |
| **Checklist** | Evidence recommendations | Uses keyword matching only — not AI semantic matching | Low-quality evidence suggestions |
| **Design Controls** | `DesignControlsComponent` | No per-row AI suggestions for requirement/policy/evidence/KPI fields | Only bulk check, no granular help |
| **Mock Surveys** | `SurveyComponent` | No AI guidance during survey execution | Surveyor gets no real-time feedback |
| **Mock Surveys** | `SurveyListComponent` | No AI pattern analysis across multiple surveys | No trend detection |
| **PDCA Transitions** | `PDCAStageTransitionForm` | Zero AI — no transition notes suggestions or readiness validation | Users advance stages blindly |
| **PDCA Creation** | `PDCACycleManager` new cycle form | No AI-assisted description, priority, or scope generation | Manual form fill |
| **CAPA Creation** | Checklist → CAPA flow | No AI pre-fill for root cause, corrective/preventive actions | Auto-creates skeleton only |
| **Project Finalization** | Finalization flow | No AI readiness check (open items, incomplete CAPAs, missing evidence) | Risk of premature finalization |

### Unused Backend API Endpoints

| Endpoint | Method in `aiAgentService` | Never Called From | Could Be Used In |
|----------|---------------------------|-------------------|------------------|
| `POST /check-compliance` | `checkCompliance()` | Any component | Checklist validation, document compliance |
| `POST /assess-risk` | `assessRisk()` | Any component | Project risk dashboards, risk heat maps |
| `POST /training-recommendations` | `getTrainingRecommendations()` | Any component | Team competency gaps, training plans |

---

## 3. AI Integration Plan — All Project Phases

### Phase 1: Project Creation & Setup
**Goal:** AI assists in setting up projects intelligently

| Feature | Description | AI Method | Priority |
|---------|-------------|-----------|----------|
| **Smart Checklist Generation** | When creating a project linked to a program, AI auto-generates checklist items from the program's standards | `chat()` with standards context | 🔴 High |
| **Project Scope AI** | AI suggests project description, timeline, and team size based on program requirements | `chat()` | 🟡 Medium |
| **Template AI Enhancement** | AI-enhanced project templates with pre-filled forms | `chat()` | 🟢 Low |

### Phase 2: Checklist & Compliance Work
**Goal:** AI helps assessors work faster and more accurately

| Feature | Description | AI Method | Priority |
|---------|-------------|-----------|----------|
| **AI Compliance Gap Detector** | Analyzes all checklist items and highlights risks, missing evidence, deadline issues | `chat()` bulk analysis | 🔴 High |
| **AI Notes/Findings Pre-fill** | When changing status to non-compliant, AI suggests findings based on standard requirements | `chat()` | 🔴 High |
| **Smart Evidence Matching** | Replace keyword matching with AI semantic similarity for evidence suggestions | `chat()` | 🟡 Medium |
| **AI Status Suggestions** | Based on evidence files and notes, AI suggests compliance status | `checkCompliance()` | 🟡 Medium |

### Phase 3: Design Controls
**Goal:** AI helps fill and validate the requirements traceability matrix

| Feature | Description | AI Method | Priority |
|---------|-------------|-----------|----------|
| **Per-Row AI Fill** | AI generates policy/process, evidence requirements, and KPIs for individual design control items | `chat()` per item | 🔴 High |
| **Document Linking Suggestions** | AI suggests which existing documents match each design control requirement | `chat()` + doc search | 🟡 Medium |

### Phase 4: Mock Surveys
**Goal:** AI-assisted survey execution and analysis

| Feature | Description | AI Method | Priority |
|---------|-------------|-----------|----------|
| **Survey AI Coach** | During survey execution, AI provides real-time guidance on what to look for per item | `chat()` | 🟡 Medium |
| **Post-Survey Analysis** | After completing a survey, AI analyzes patterns and suggests focus areas | `assessSurveyRisk()` (expand) | 🟡 Medium |
| **Survey Comparison** | AI compares multiple surveys and highlights improvement/decline trends | `chat()` | 🟢 Low |

### Phase 5: CAPA & PDCA Cycles
**Goal:** AI guides continuous improvement and corrective actions

| Feature | Description | AI Method | Priority |
|---------|-------------|-----------|----------|
| **AI CAPA Pre-fill** | When creating CAPA from non-compliant item, AI pre-fills root cause, corrective action, preventive action | `analyzeRootCause()` | 🔴 High |
| **PDCA Stage Transition AI** | AI suggests transition notes and validates readiness to advance | `suggestPDCAImprovements()` | 🔴 High |
| **New PDCA Cycle AI Setup** | AI suggests title, description, priority, and initial actions based on project context | `chat()` | 🟡 Medium |
| **Effectiveness Verification AI** | AI reviews CAPA effectiveness check data and suggests whether to close or reopen | `chat()` | 🟡 Medium |

### Phase 6: Project Finalization & Reporting
**Goal:** AI ensures completeness before finalization

| Feature | Description | AI Method | Priority |
|---------|-------------|-----------|----------|
| **Finalization Readiness Check** | AI reviews all project data and flags blockers: open CAPAs, missing evidence, incomplete surveys, low compliance areas | `chat()` with full context | 🔴 High |
| **AI Project Health Briefing** | Overview tab shows AI-generated summary of project status, risks, and next steps | `chat()` | 🟡 Medium |
| **Executive Summary AI** | Pre-generates executive summary for stakeholder review before report generation | `chat()` | 🟢 Low |

---

## 4. Technical Notes

### Code Quality Issues to Fix During Integration

1. **`reportService.ts` bypasses `aiAgentService`** — Makes direct `fetch` calls to the backend, missing auth headers. Should route through `aiAgentService.chat()`.

2. **`useAIAgent.ts` hook duplicates logic** — Also makes direct `fetch`, should use `aiAgentService`.

3. **No retry/fallback** — All AI calls fail with a toast. Should add retry (1×) and graceful degradation.

4. **`AISuggestionModal`** — Well-built reusable component. Can be used for all new AI features without new UI work.

5. **`AIAssistantDemo`** — Appears to be dead code; not in production routes.

### Reusable Patterns for AI Integration

```typescript
// Standard pattern used across all existing integrations:
const [isGeneratingAI, setIsGeneratingAI] = useState(false);

const handleAIAction = async () => {
  setIsGeneratingAI(true);
  try {
    const result = await aiAgentService.someMethod({ context });
    // Apply result to form/state
  } catch (error) {
    toast.error("AI generation failed. Please try again.");
    console.error("AI error:", error);
  } finally {
    setIsGeneratingAI(false);
  }
};

// Button:
<Button onClick={handleAIAction} disabled={isGeneratingAI || isFinalized}>
  {isGeneratingAI ? <Spinner /> : "🤖"} Ask AI
</Button>
```

### Files Inventory

| Category | Count | Files |
|----------|-------|-------|
| Types | 2 | `src/types/index.ts`, `src/types/pdca.ts` |
| Pages | 3 | `ProjectListPage`, `ProjectDetailPage`, `ProjectOverview` |
| Components | 20 | In `src/components/projects/` |
| Services | 4 | `projectService`, `aiAgentService`, `reportService`, `crossStandardMappingService` |
| Stores | 1 | `useProjectStore` |
| AI UI Components | 6 | `AIAssistant`, `AIChatButton`, `AIChatPanel`, `AIDocumentGenerator`, `AISuggestionModal`, `AIAssistantDemo` |
| Hooks | 3 | `useAIAgent`, `useAIAssistant`, `useAIDocumentGenerator` |

---

## 5. Implementation Priority Order

| Priority | Feature | Phase | Effort |
|----------|---------|-------|--------|
| 1 | AI CAPA Pre-fill (root cause + actions) | CAPA | Small — extend existing `addCapaReport` |
| 2 | PDCA Stage Transition AI | PDCA | Small — add to `PDCAStageTransitionForm` |
| 3 | AI Compliance Gap Detector | Checklist | Medium — new button + batch analysis |
| 4 | AI Findings Pre-fill on status change | Checklist | Small — hook into status dropdown |
| 5 | Per-Row Design Control AI Fill | Design Controls | Medium — per-item AI button |
| 6 | Finalization Readiness Check | Finalization | Medium — new pre-finalization step |
| 7 | AI Project Health Briefing | Overview | Medium — new widget |
| 8 | Smart Checklist Generation on create | Creation | Large — new wizard step |
| 9 | Survey AI Coach | Mock Surveys | Medium — real-time guidance panel |
| 10 | Smart Evidence Matching | Checklist | Medium — replace keyword engine |
