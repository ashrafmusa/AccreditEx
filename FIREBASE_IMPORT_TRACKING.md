# Firebase Import Tracking Checklist

## 📊 Current Firebase Status

```
✅ appSettings    1 documents   COMPLETE
✅ users          12 documents  COMPLETE
❌ programs       0 documents   READY TO UPLOAD (1 total)
❌ standards      0 documents   READY TO UPLOAD (21 total)
⚠️ departments    7 documents   READY TO UPLOAD (need 3 more: dep-8,9,10)
❌ competencies   0 documents   READY TO UPLOAD (4 total)
❌ projects       0 documents   READY TO UPLOAD (10 total)
❌ documents      0 documents   READY TO UPLOAD (3 total)
❌ trainingPrograms 0 documents READY TO UPLOAD (2 total)
❌ risks          0 documents   READY TO UPLOAD (3 total)
```

**Total Progress:** 13/77 documents (appSettings + users)  
**Remaining:** 54 documents to upload

---

## 🎯 Upload Checklist

### Phase 1: Foundation (Do First)

#### ✅ Step 1: Upload Programs Collection
- [ ] Open `firebase-import-ready/programs_import.json`
- [ ] Copy document with ID: `prog-ohap`
- [ ] In Firebase Setup → Collections → programs → Add Document
- [ ] Set Doc ID: `prog-ohap`
- [ ] Paste content
- [ ] Click Save
- [ ] **Verify:** Collections Manager shows programs = 1 document

**Documents to Add:** 1  
**Expected Total After:** programs = 1

---

#### ✅ Step 2: Upload Standards Collection (21 documents)

**Option A: Use StandardsPage Import (RECOMMENDED - Fastest)**
```
1. Go to Standards Page (main app navigation)
2. Click "Import Standards" button
3. Select src/data/standards.json file
4. Click "Import"
5. Wait for "Import Complete" message
6. All 21 standards added at once ✅
```

**Option B: Manual Import via Firebase Setup**
```
1. Open firebase-import-ready/standards_import.json
2. For each of 21 standards (OHAS.GAL.1, OHAS.HRM.1, etc.):
   - Copy document object
   - In Firebase Setup → Collections → standards → Add Document
   - Set Doc ID: (e.g., "OHAS.CSS.1")
   - Paste content
   - Click Save
3. After 21 uploads, verify count = 21
```

- [ ] **Method A (StandardsPage):** Import all 21 standards at once
  - [ ] Click Import Standards button
  - [ ] Select standards.json
  - [ ] See "Import Complete" message
  - [ ] Verify in Collections Manager: standards = 21

- OR -

- [ ] **Method B (Firebase Setup):** Manually add 21 documents
  - [ ] Add OHAS.GAL.1, OHAS.GAL.2 (2 documents)
  - [ ] Add OHAS.HRM.1, OHAS.HRM.2 (2 documents)
  - [ ] Add OHAS.CSS.1 through OHAS.CSS.5 (5 documents)
  - [ ] Add OHAS.SMCS.1, OHAS.SMCS.2 (2 documents)
  - [ ] Add OHAS.QRM.1, OHAS.QRM.2 (2 documents)
  - [ ] Add OHAS.IPC.1 (1 document)
  - [ ] Add OHAS.MMU.1 (1 document)
  - [ ] Add OHAS.PRE.1, OHAS.PRE.2 (2 documents)
  - [ ] Add OHAS.IMS.1, OHAS.IMS.2 (2 documents)
  - [ ] Add OHAS.FMS.1, OHAS.FMS.2 (2 documents)
  - [ ] **Verify:** Collections Manager shows standards = 21 documents

**Documents to Add:** 21  
**Expected Total After:** standards = 21

---

#### ✅ Step 3: Upload Departments (Add Missing 3)

Only need to add 3 missing departments (dep-8, dep-9, dep-10):

- [ ] Open `firebase-import-ready/departments_import.json`
- [ ] Copy document with ID: `dep-8` (Facilities Management)
  - [ ] In Firebase Setup → Collections → departments → Add Document
  - [ ] Set Doc ID: `dep-8`
  - [ ] Paste content
  - [ ] Click Save

- [ ] Copy document with ID: `dep-9` (Human Resources)
  - [ ] In Firebase Setup → Collections → departments → Add Document
  - [ ] Set Doc ID: `dep-9`
  - [ ] Paste content
  - [ ] Click Save

- [ ] Copy document with ID: `dep-10` (Information Technology)
  - [ ] In Firebase Setup → Collections → departments → Add Document
  - [ ] Set Doc ID: `dep-10`
  - [ ] Paste content
  - [ ] Click Save

- [ ] **Verify:** Collections Manager shows departments = 10 documents (7 existing + 3 new)

**Documents to Add:** 3  
**Expected Total After:** departments = 10

---

### Phase 2: Supporting Collections

#### ✅ Step 4: Upload Competencies (4 documents)

- [ ] Open `firebase-import-ready/competencies_import.json`
- [ ] For each competency (comp-1 through comp-4):
  - [ ] Copy document
  - [ ] In Firebase Setup → Collections → competencies → Add Document
  - [ ] Set Doc ID: (e.g., "comp-1")
  - [ ] Paste content
  - [ ] Click Save
- [ ] Documents:
  - [ ] comp-1 (BLS - Basic Life Support)
  - [ ] comp-2 (ACLS - Advanced Cardiovascular)
  - [ ] comp-3 (CPHQ - Quality Management)
  - [ ] comp-4 (CIC - Infection Control)
- [ ] **Verify:** Collections Manager shows competencies = 4 documents

**Documents to Add:** 4  
**Expected Total After:** competencies = 4

---

### Phase 3: Main Collections

#### ✅ Step 5: Upload Projects (10 chapter-based projects)

- [ ] Open `firebase-import-ready/projects_import.json`
- [ ] For each project (proj-ch1-gal through proj-ch10-fms):
  - [ ] Copy document
  - [ ] In Firebase Setup → Collections → projects → Add Document
  - [ ] Set Doc ID: (e.g., "proj-ch1-gal")
  - [ ] Paste content
  - [ ] Click Save
- [ ] Chapter Projects:
  - [ ] proj-ch1-gal (Chapter 1: Governance & Leadership)
  - [ ] proj-ch2-hrm (Chapter 2: Human Resources Management)
  - [ ] proj-ch3-css (Chapter 3: Compulsory Safety Standards)
  - [ ] proj-ch4-smcs (Chapter 4: Specialized Medical Care Services)
  - [ ] proj-ch5-qrm (Chapter 5: Quality & Risk Management)
  - [ ] proj-ch6-ipc (Chapter 6: Infection Prevention & Control)
  - [ ] proj-ch7-mmu (Chapter 7: Medication Management)
  - [ ] proj-ch8-pre (Chapter 8: Patient Rights & Education)
  - [ ] proj-ch9-ims (Chapter 9: Information Management)
  - [ ] proj-ch10-fms (Chapter 10: Facility Management)
- [ ] **Verify:** Collections Manager shows projects = 10 documents

**Documents to Add:** 10  
**Expected Total After:** projects = 10

---

#### ✅ Step 6: Upload Documents (3 document templates)

- [ ] Open `firebase-import-ready/documents_import.json`
- [ ] For each document (doc-1 through doc-3):
  - [ ] Copy document
  - [ ] In Firebase Setup → Collections → documents → Add Document
  - [ ] Set Doc ID: (e.g., "doc-1")
  - [ ] Paste content
  - [ ] Click Save
- [ ] Documents:
  - [ ] doc-1 (Patient Identification Policy)
  - [ ] doc-2 (QMS Review Minutes)
  - [ ] doc-3 (Audit Records)
- [ ] **Verify:** Collections Manager shows documents = 3 documents

**Documents to Add:** 3  
**Expected Total After:** documents = 3

---

#### ✅ Step 7: Upload Training Programs (2 trainings)

- [ ] Open `firebase-import-ready/trainingPrograms_import.json`
- [ ] For each training (training-1, training-2):
  - [ ] Copy document
  - [ ] In Firebase Setup → Collections → trainingPrograms → Add Document
  - [ ] Set Doc ID: (e.g., "training-1")
  - [ ] Paste content
  - [ ] Click Save
- [ ] Trainings:
  - [ ] training-1 (Hand Hygiene & Infection Control - OHAS.CSS.4)
  - [ ] training-2 (Patient Identification - OHAS.CSS.1)
- [ ] **Verify:** Collections Manager shows trainingPrograms = 2 documents

**Documents to Add:** 2  
**Expected Total After:** trainingPrograms = 2

---

### Phase 4: Risk Management

#### ✅ Step 8: Upload Risks (3 risk entries)

- [ ] Open `firebase-import-ready/risks_import.json`
- [ ] For each risk (risk-1 through risk-3):
  - [ ] Copy document
  - [ ] In Firebase Setup → Collections → risks → Add Document
  - [ ] Set Doc ID: (e.g., "risk-1")
  - [ ] Paste content
  - [ ] Click Save
- [ ] Risks:
  - [ ] risk-1 (Lab Analyzer Failure)
  - [ ] risk-2 (Data Privacy Regulation Changes)
  - [ ] risk-3 (ICU Nurse Shortage)
- [ ] **Verify:** Collections Manager shows risks = 3 documents

**Documents to Add:** 3  
**Expected Total After:** risks = 3

---

## 📈 Progress Tracking

### Before Upload
```
appSettings:      1 ✅
users:           12 ✅
programs:         0 ❌
standards:        0 ❌
departments:      7 ⚠️ (need 3 more)
competencies:     0 ❌
projects:         0 ❌
documents:        0 ❌
trainingPrograms: 0 ❌
risks:            0 ❌
─────────────────────
TOTAL:           20 documents
```

### After Completing All Steps
```
appSettings:      1 ✅
users:           12 ✅
programs:         1 ✅
standards:       21 ✅
departments:     10 ✅
competencies:     4 ✅
projects:        10 ✅
documents:        3 ✅
trainingPrograms: 2 ✅
risks:            3 ✅
─────────────────────
TOTAL:           77 documents ✅
```

---

## 🎯 Final Verification Steps

After uploading all documents:

- [ ] **Step 1: Verify Collections Manager**
  - Open Firebase Setup → Collections tab
  - Check all collections and verify counts:
    - appSettings: 1 ✅
    - users: 12 ✅
    - programs: 1 ✅
    - standards: 21 ✅
    - departments: 10 ✅
    - competencies: 4 ✅
    - projects: 10 ✅
    - documents: 3 ✅
    - trainingPrograms: 2 ✅
    - risks: 3 ✅

- [ ] **Step 2: Run System Health Check**
  - Open Firebase Setup → Status & Health tab
  - Click "Test" button for connection
  - Verify appSettings validation shows all green
  - Check database statistics show 77 total documents

- [ ] **Step 3: Test App Initialization**
  - Refresh app (F5)
  - Verify app loads successfully
  - Check that:
    - Dashboard loads
    - Standards page shows 21 OHAS standards
    - Projects page shows 10 chapter-based projects
    - Users page shows 12 team members
    - Departments page shows 10 departments

- [ ] **Step 4: Verify Role-Based Access**
  - Login as Admin (user-1: Ashraf Musa)
    - Can access Firebase Setup ✅
  - Login as Project Lead (user-2: Marcus Thorne)
    - Cannot access Firebase Setup ✅
  - Login as Team Member (user-3: Lena Petrova)
    - Cannot access Firebase Setup ✅

- [ ] **Step 5: Document Process**
  - Record any issues encountered
  - Note import methods used
  - Save this checklist as proof of completion

---

## 🎉 Success Criteria

All of the following must be true:

- ✅ All 77 documents uploaded to Firebase
- ✅ All 10 collections populated with correct document counts
- ✅ System health check shows all green
- ✅ App loads successfully with Firebase data
- ✅ Users can view their assigned data
- ✅ Admin can access Firebase Setup page
- ✅ Role-based access control working
- ✅ No errors in browser console

---

**Status:** Ready for Manual Upload via Firebase Setup UI  
**Total Documents to Upload:** 54 (programs, standards, departments, competencies, projects, documents, trainings, risks)  
**Estimated Time:** 30-45 minutes for manual upload  
**Alternative:** Use StandardsPage Import for 21 standards (saves 10+ minutes)
