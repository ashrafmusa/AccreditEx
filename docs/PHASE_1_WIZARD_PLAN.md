# Phase 1: Forms & Wizards — Implementation Plan

**Start Date:** March 3, 2026  
**Estimated Duration:** 4 weeks  
**Status:** 🚀 In Progress

---

## 🎯 Goals

Transform the monolithic CreateProjectPage (985 lines) into a modern multi-step wizard with:
1. ✅ **Multi-step wizard** — 4 clear steps instead of one overwhelming form
2. ✅ **Real-time validation** — No more submit-fail loops
3. ✅ **Conditional fields** — Smart hiding of irrelevant fields
4. ✅ **Template prefill** — One-click project setup from templates

---

## 📐 Wizard Structure Design

### Current State (Problems)
- **985-line single form** — overwhelming cognitive load
- **12+ fields on one screen** — decision fatigue
- **Template selector separate modal** — disconnected UX
- **Validation only on submit** — frustrating error discovery
- **All fields always visible** — cluttered interface

### New 4-Step Wizard

#### **Step 1: Template & Basic Info (2-3 minutes)**
**Purpose:** Quick start with smart defaults

Fields:
- 🎯 **Template Selection** (enhanced, visual cards)
  - Preset templates OR "Start from Scratch"
  - Show: Name, Description, Category, Duration, Checklist count
  - **Auto-prefill:** Name, Description, Program, Duration, Checklist
- ✏️ **Project Name** (conditionally editable if template selected)
- 📝 **Short Description** (AI-enhanced button visible)

**Conditional Logic:**
- If template selected → Name pre-filled (editable)
- If "Start from Scratch" → Empty fields
- AI Generate button appears if name exists

**Validation (Real-time):**
- Name: 3-200 characters, required
- Description: 0-1000 characters, optional

---

#### **Step 2: Program & Standards (2 minutes)**
**Purpose:** Select accreditation framework

Fields:
- 🏥 **Accreditation Program** (dropdown)
  - Required field
  - Shows: CBAHI, JCI, OSHA, ISO 45001, etc.
- 📋 **Applicable Standards** (auto-shown based on program)
  - Multi-select checkboxes
  - **Conditional:** Only shows standards from selected program
  - **Smart default:** If template has standards, pre-select them

**Conditional Logic:**
- Program not selected → Standards hidden
- Program selected → Load & show relevant standards
- Template with programId → Auto-select program

**Validation (Real-time):**
- Program: Required
- Standards: At least 1 required

---

#### **Step 3: Team & Timeline (2-3 minutes)**
**Purpose:** Assign people and dates

Fields:
- 👤 **Project Lead** (searchable dropdown)
  - Required, single selection
  - Shows: Name, Role, Department
- 👥 **Team Members** (multi-select)
  - Optional
  - Searchable, shows badges
- 🏢 **Department(s)** (multi-select)
  - Optional
  - Supports multi-department projects
- 📅 **Start Date** (date picker, default: today)
- 📅 **End Date** (date picker, optional)
  - **Conditional:** Shows warning if < start date
  - **AI suggestion button:** "Suggest Timeline" based on scope

**Conditional Logic:**
- If template has duration → Auto-calculate end date from start date
- If end date < start date → Show error immediately
- Department dropdown hidden until lead selected (optional enhancement)

**Validation (Real-time):**
- Lead: Required
- Start Date: Required, cannot be in past
- End Date: Must be > start date if provided

---

#### **Step 4: Review & Confirm (1 minute)**
**Purpose:** Final check before creation

Display:
- ✅ **Summary Card** with all entered info
- 📋 **Checklist Preview** (if from template or AI-enhanced)
  - Show count: "24 checklist items ready"
  - Expandable accordion to review items
- 🤖 **AI Enhancement Options:**
  - "Enhance checklist with AI suggestions"
  - "Generate risk assessment"
- ✏️ **Edit buttons** for each section → Jump back to that step

**Actions:**
- ⬅️ Back (returns to step 3)
- ✅ **Create Project** (primary action)
- 🚫 Cancel

---

## 🔧 Technical Implementation

### 1. Component Structure

```
src/pages/
  CreateProjectWizard.tsx           ← New multi-step wizard controller
  
src/components/projects/wizard/     ← New folder
  Step1TemplateBasics.tsx           ← Step 1 component
  Step2ProgramStandards.tsx         ← Step 2 component
  Step3TeamTimeline.tsx             ← Step 3 component
  Step4ReviewConfirm.tsx            ← Step 4 component
  useProjectWizard.ts               ← Custom hook for state management
  projectValidation.ts              ← Real-time validation rules
```

### 2. State Management Hook

**useProjectWizard.ts** (Custom hook pattern)
```typescript
interface WizardData {
  // Step 1
  templateId: string | null;
  projectName: string;
  description: string;
  
  // Step 2
  programId: string;
  standardIds: string[];
  
  // Step 3
  leadId: string;
  teamMemberIds: string[];
  departmentIds: string[];
  startDate: Date;
  endDate: Date | undefined;
  
  // Step 4
  checklistItems: ChecklistItem[];
  aiEnhanced: boolean;
}

function useProjectWizard() {
  const [data, setData] = useState<WizardData>(initialState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [currentStep, setCurrentStep] = useState(0);
  
  // Real-time validation on every field change
  const validateField = (field: string, value: any) => { ... };
  const canProceed = (step: number) => { ... };
  
  return { data, setData, errors, currentStep, setCurrentStep, validateField, canProceed };
}
```

### 3. Real-Time Validation

**projectValidation.ts**
```typescript
export const validateProjectName = (name: string): string | null => {
  if (!name.trim()) return 'Project name is required';
  if (name.length < 3) return 'Must be at least 3 characters';
  if (name.length > 200) return 'Must not exceed 200 characters';
  return null;
};

export const validateProgramSelection = (programId: string): string | null => {
  if (!programId) return 'Please select an accreditation program';
  return null;
};

export const validateDateRange = (start: Date, end?: Date): string | null => {
  if (end && end < start) return 'End date must be after start date';
  if (start < new Date()) return 'Start date cannot be in the past';
  return null;
};

// ... more validators
```

### 4. Conditional Field Logic

**Conditional Rendering Patterns:**
```tsx
{/* Only show standards if program selected */}
{wizardData.programId && (
  <StandardsSelector
    programId={wizardData.programId}
    selectedIds={wizardData.standardIds}
    onChange={(ids) => updateData({ standardIds: ids })}
  />
)}

{/* Show AI enhance if checklist exists */}
{wizardData.checklistItems.length > 0 && (
  <Button onClick={handleAIEnhance}>
    🤖 Enhance with AI
  </Button>
)}

{/* Auto-calculate end date from template */}
{selectedTemplate?.estimatedDuration && (
  <div className="text-sm text-green-600">
    ✓ Suggested end date based on {selectedTemplate.estimatedDuration} day duration
  </div>
)}
```

### 5. Template Prefill Enhancement

**Enhanced Template Selection:**
```tsx
const handleTemplateSelect = (template: ProjectTemplate) => {
  setWizardData({
    ...wizardData,
    templateId: template.id,
    projectName: template.name,  // Pre-filled but editable
    description: template.description || '',
    programId: template.programId || '',
    checklistItems: template.checklist,
    // Auto-calculate end date
    endDate: calculateEndDate(startDate, template.estimatedDuration),
  });
  
  // Jump to step 2 (skip re-entering basics)
  setCurrentStep(1);
};
```

---

## 📊 Success Metrics

### Before (Current State)
- **Time to Create Project:** ~8-12 minutes
- **Form Abandonment Rate:** ~25% (estimated)
- **Validation Errors Per Submit:** 2-3 avg
- **User Cognitive Load:** High (12+ fields visible)
- **Template Usage:** Low (~30%)

### After (Target)
**Phase 1 Complete:**
- **Time to Create Project:** 3-5 minutes (-60%)
- **Form Abandonment Rate:** <10% (-60%)
- **Validation Errors Per Submit:** 0-1 avg (-70%)
- **User Cognitive Load:** Low (3-5 fields per step)
- **Template Usage:** 70%+ (+130%)

**Wizard UX Metrics:**
- Step 1 completion: 95%
- Step 2 completion: 90%
- Step 3 completion: 85%
- Step 4 completion: 80%
- Overall wizard completion: 80%

---

## 🗓️ Implementation Timeline

### Week 1: Foundation (40 hours)
**Day 1-2: Architecture & State** (16h)
- Create wizard folder structure
- Build useProjectWizard hook
- Implement projectValidation.ts
- Create WizardData TypeScript types

**Day 3-4: Step 1 & 2** (16h)
- Build Step1TemplateBasics component
- Enhance template selector UI
- Build Step2ProgramStandards component
- Implement conditional standards loading

**Day 5: Integration** (8h)
- Wire up MultiStepWizard wrapper
- Connect steps to wizard state
- Test navigation flow
- Fix TypeScript errors

### Week 2: Step 3-4 & Polish (40 hours)
**Day 1-2: Step 3** (16h)
- Build Step3TeamTimeline component
- Implement searchable/multi-select dropdowns
- Add AI timeline suggestion integration
- Real-time date validation

**Day 3: Step 4** (8h)
- Build Step4ReviewConfirm component
- Create summary cards
- Add edit buttons (jump back)
- Checklist preview accordion

**Day 4-5: Polish & Testing** (16h)
- Smooth transitions between steps
- Error state handling
- Loading states for AI features
- Cross-step validation
- End-to-end testing

### Week 3: Conditional Logic & Templates (40 hours)
**Day 1-2: Conditional Fields** (16h)
- Implement all conditional rendering logic
- Smart field hiding based on selections
- Progressive disclosure patterns
- Field dependency mapping

**Day 3-4: Template System** (16h)
- Enhanced template prefill logic
- Auto-calculation features (dates, checklists)
- Template preview improvements
- Quick-start workflows

**Day 5: Integration Testing** (8h)
- Test all conditional paths
- Template → Wizard flow testing
- Edge case handling
- Bug fixes

### Week 4: Real-Time Validation & Documentation (40 hours)
**Day 1-2: Real-Time Validation** (16h)
- Implement debounced validation
- Inline error messages
- Field-level feedback
- Submit-fail elimination

**Day 3: Performance** (8h)
- Optimize re-renders
- Lazy load heavy components
- Form state persistence (localStorage)
- Smooth animations

**Day 4: i18n & Accessibility** (8h)
- Add all wizard translation keys (EN/AR)
- ARIA labels for steps
- Keyboard navigation
- Screen reader testing

**Day 5: Documentation & Handoff** (8h)
- Update docs/UX_ACTION_PLAN.md
- Create PHASE_1_COMPLETE.md
- Code comments
- Demo video/screenshots

---

## 🔥 Quick Wins (Can Implement Separately)

**Priority 1 (High Impact, Low Effort):**
1. **Real-time validation** — Can add to current form immediately (8h)
2. **Template auto-prefill** — Enhance existing template selector (4h)

**Priority 2 (Medium Impact):**
3. **Conditional standards field** — Hide until program selected (2h)
4. **Date validation** — Prevent end < start immediately (2h)

**Priority 3 (Nice to Have):**
5. **Form autosave** — Draft recovery from localStorage (6h)
6. **Progress persistence** — Resume wizard from where user left off (4h)

---

## 🚀 Launch Plan

**Soft Launch:**
- Deploy wizard behind feature flag
- Test with 10-20 internal users
- Collect feedback on wizard flow

**A/B Testing:**
- 50% users see new wizard
- 50% users see old form
- Compare: time-to-complete, error rate, abandonment

**Full Rollout:**
- Week 4 end: Full launch
- Monitor metrics: completion rate, validation errors
- Iterate based on user feedback

---

## 📝 Notes

### Existing Features to Preserve
- ✅ AI description generation
- ✅ AI timeline suggestion
- ✅ AI checklist enhancement
- ✅ Template selector
- ✅ Date picker component
- ✅ Multi-select team members
- ✅ Context help (?) icon

### New Features Added
- ✅ Step-by-step wizard UI
- ✅ Real-time validation
- ✅ Conditional field hiding
- ✅ Enhanced template prefill
- ✅ Progress indicator
- ✅ Jump back to edit functionality
- ✅ Summary review step

---

**Last Updated:** March 3, 2026  
**Next Update:** End of Week 1 (March 10, 2026)
