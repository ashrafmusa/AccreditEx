# Firebase Import - Copy-Paste Examples

## Example 1: Single Document Collection (Programs)

### What to Copy from `programs_import.json`

The import file contains:
```json
{
  "collection": "programs",
  "documentIdField": "id",
  "documents": [
    {
      "id": "prog-ohap",
      "name": "Oman Health Accreditation Program",
      "description": {
        "en": "The Oman Health Accreditation System program focused on accrediting healthcare facilities according to international standards adapted for Oman.",
        "ar": "برنامج نظام الاعتماد الصحي في عمان والموجه نحو اعتماد المنشآت الصحية وفقاً للمعايير الدولية المكيفة للسياق العماني."
      }
    }
  ],
  "documentCount": 1,
  "importedAt": "2025-12-05T10:30:00.000Z"
}
```

### How to Copy-Paste

1. **Extract the Document Object** (what to copy):
```json
{
  "id": "prog-ohap",
  "name": "Oman Health Accreditation Program",
  "description": {
    "en": "The Oman Health Accreditation System program focused on accrediting healthcare facilities according to international standards adapted for Oman.",
    "ar": "برنامج نظام الاعتماد الصحي في عمان والموجه نحو اعتماد المنشآت الصحية وفقاً للمعايير الدولية المكيفة للسياق العماني."
  }
}
```

2. **In Firebase Setup UI:**
   - Click **Collections** tab
   - Click on "programs" (or create if missing)
   - Click **"+ Add Document"**
   - **Document ID:** `prog-ohap` (from the "id" field)
   - **Paste the above JSON** into the fields
   - Click **Save**

---

## Example 2: Multiple Document Collection (Competencies)

### What to Copy from `competencies_import.json`

The file contains 4 documents. Copy each one separately:

#### Document 1:
```json
{
  "id": "comp-1",
  "name": {
    "en": "Basic Life Support (BLS)",
    "ar": "الإنعاش الأساسي"
  },
  "description": {
    "en": "Essential life-saving skills for healthcare professionals including CPR and emergency response.",
    "ar": "مهارات الإنقاذ الأساسية للعاملين في الرعاية الصحية تشمل الإنعاش والاستجابة للطوارئ."
  },
  "certificationRequired": true,
  "renewalPeriodMonths": 24
}
```

#### Document 2:
```json
{
  "id": "comp-2",
  "name": {
    "en": "Advanced Cardiovascular Life Support (ACLS)",
    "ar": "دعم الحياة القلبية الوعائية المتقدم"
  },
  "description": {
    "en": "Advanced cardiac life support techniques for emergency situations.",
    "ar": "تقنيات دعم الحياة القلبية المتقدمة في حالات الطوارئ."
  },
  "certificationRequired": true,
  "renewalPeriodMonths": 24
}
```

### How to Copy-Paste Each Document

**For Document 1 (comp-1):**
1. Click **Collections** → **competencies** → **"+ Add Document"**
2. **Document ID:** `comp-1`
3. **Paste:** The entire comp-1 JSON object (from { to })
4. Click **Save**

**For Document 2 (comp-2):**
1. Click **"+ Add Document"**
2. **Document ID:** `comp-2`
3. **Paste:** The entire comp-2 JSON object
4. Click **Save**

**Repeat for comp-3 and comp-4**

---

## Example 3: Large Document Collection (Projects)

### What to Copy from `projects_import.json`

Each project has nested objects and arrays. Here's the structure for proj-ch1-gal:

```json
{
  "id": "proj-ch1-gal",
  "name": "Chapter 1: Governance & Leadership Implementation",
  "programId": "prog-ohap",
  "chapter": "Chapter 1",
  "chapterCode": "GAL",
  "status": "In Progress",
  "startDate": "2024-01-15",
  "endDate": null,
  "projectLead": {
    "id": "user-1",
    "name": "Dr. Sarah Al-Rashidi",
    "email": "admin@accreditex-demo.com",
    "role": "Admin"
  },
  "activityLog": [
    {
      "id": "log-ch1-1",
      "timestamp": "2024-01-15T09:00:00Z",
      "user": "Dr. Sarah Al-Rashidi",
      "action": {
        "en": "Project Created",
        "ar": "تم إنشاء المشروع"
      }
    }
  ],
  "mockSurveys": [],
  "capaReports": [],
  "designControls": [],
  "checklist": [
    {
      "id": "cl-ch1-1",
      "standardId": "OHAS.GAL.1",
      "item": "A governing body is established with clear authority and responsibility for the organization.",
      "status": "Compliant",
      "assignedTo": "user-1",
      "notes": "Board charter updated and roles defined.",
      "evidenceFiles": [],
      "actionPlan": null,
      "comments": []
    },
    {
      "id": "cl-ch1-2",
      "standardId": "OHAS.GAL.2",
      "item": "The organization establishes policies and procedures for quality management.",
      "status": "Compliant",
      "assignedTo": "user-2",
      "notes": "Quality policy documented and communicated to all staff.",
      "evidenceFiles": [],
      "actionPlan": null,
      "comments": []
    }
  ]
}
```

### How to Copy-Paste Complex Documents

1. **Copy the entire object** from the first `{` to the last `}`
2. **Important:** Make sure all nested brackets `{}` and brackets `[]` are included
3. **In Firebase Setup:**
   - Click **Collections** → **projects** → **"+ Add Document"**
   - **Document ID:** `proj-ch1-gal`
   - **Paste:** All of the above JSON
   - Click **Save**

---

## Example 4: Standards Collection (Special Case)

### Recommended: Use StandardsPage Import

For standards, the FASTEST way is:
1. Go to **Standards Page** (main app menu)
2. Click **Import Standards** button
3. Select `src/data/standards.json` file
4. Click **Import**
5. Wait for "Success" message
6. All 21 standards uploaded automatically ✅

### Alternative: Manual Copy-Paste (if needed)

If you want to copy-paste individually, here's an example for OHAS.CSS.1:

```json
{
  "standardId": "OHAS.CSS.1",
  "chapter": "Chapter 3",
  "chapterCode": "CSS",
  "chapterName": {
    "en": "Compulsory Safety Standards",
    "ar": "معايير السلامة الإلزامية"
  },
  "name": {
    "en": "Patient Identification and Safety",
    "ar": "تحديد هوية المريض والسلامة"
  },
  "description": {
    "en": "Patient identification and safety is ensured throughout care delivery...",
    "ar": "يتم ضمان تحديد هوية المريض والسلامة طوال عملية تقديم الرعاية..."
  },
  "criticality": "High",
  "status": "Active",
  "subStandards": [
    {
      "id": "CSS.1.1",
      "title": {
        "en": "Patient identification system",
        "ar": "نظام تحديد هوية المريض"
      },
      "description": "Use at least two identifiers..."
    }
  ]
}
```

**To Copy-Paste:**
1. Click **Collections** → **standards** → **"+ Add Document"**
2. **Document ID:** `OHAS.CSS.1`
3. **Paste:** The entire standard JSON
4. Click **Save**

**Repeat for all 21 standards** (or use StandardsPage Import instead)

---

## Example 5: Department with Missing Documents

### What to Copy from `departments_import.json`

You only need to add 3 missing departments (dep-8, dep-9, dep-10):

#### dep-8 (Facilities Management):
```json
{
  "id": "dep-8",
  "name": {
    "en": "Facilities Management",
    "ar": "إدارة المرافق"
  },
  "description": {
    "en": "Responsible for facility maintenance, safety, and infrastructure management.",
    "ar": "مسؤولة عن صيانة المنشآت والسلامة وإدارة البنية التحتية."
  },
  "ohasChapter": "Chapter 10",
  "ohasChapterCode": "FMS",
  "head": {
    "id": "user-12",
    "name": "Robert Brown"
  }
}
```

#### dep-9 (Human Resources):
```json
{
  "id": "dep-9",
  "name": {
    "en": "Human Resources",
    "ar": "الموارد البشرية"
  },
  "description": {
    "en": "Manages staff recruitment, development, and compliance with labor regulations.",
    "ar": "تدير تجنيد الموظفين والتطوير والامتثال لأنظمة العمل."
  },
  "ohasChapter": "Chapter 2",
  "ohasChapterCode": "HRM",
  "head": null
}
```

#### dep-10 (Information Technology):
```json
{
  "id": "dep-10",
  "name": {
    "en": "Information Technology",
    "ar": "تكنولوجيا المعلومات"
  },
  "description": {
    "en": "Provides IT infrastructure, security, and digital systems support.",
    "ar": "توفر البنية التحتية لتكنولوجيا المعلومات والأمان ودعم الأنظمة الرقمية."
  },
  "ohasChapter": "Chapter 9",
  "ohasChapterCode": "IMS",
  "head": null
}
```

### How to Add These 3 Departments

**For each department:**
1. Click **Collections** → **departments** → **"+ Add Document"**
2. **Document ID:** `dep-8` (or dep-9, dep-10)
3. **Paste:** The complete department JSON
4. Click **Save**

---

## ✅ Copy-Paste Checklist

When copying documents:
- [ ] Start from the opening `{`
- [ ] End at the closing `}`
- [ ] Include ALL nested objects `{}`
- [ ] Include ALL arrays `[]`
- [ ] Include bilingual content (en/ar)
- [ ] Don't include the outer wrapper (collection, documentIdField, etc.)
- [ ] Document ID matches the "id" field in the document
- [ ] No trailing commas after last property
- [ ] Special characters (quotes, arrows) are intact

---

## 🔍 Validation Tips

After pasting in Firebase:
1. **Check field count** - should match original JSON
2. **Verify nested objects** - expand them to check
3. **Check arrays** - should show item count
4. **Bilingual fields** - both EN and AR should be there
5. **Click Save** - should show success message

---

## 💾 Quick Copy-Paste Template

Use this template for any document:

```
1. Open import file in VS Code
2. Find the document in "documents" array
3. Select from first { to last }
4. Copy (Ctrl+C)
5. In Firebase Setup:
   - Click collection name
   - Click + Add Document
   - Set Document ID: (from "id" field)
   - Paste (Ctrl+V)
   - Click Save
6. Verify in Collections Manager
7. Repeat for next document
```

---

**Remember:** All 54 documents are already prepared and formatted correctly. Just copy-paste them into Firebase!
