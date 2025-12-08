# Firebase Batch Import Guide

## ✅ Status

**Script Execution:** COMPLETE  
**Import Files Ready:** YES (firebase-import-ready folder)  
**Total Documents Prepared:** 54 documents across 8 collections

---

## 📊 Collections Ready for Import

| Collection | Documents | Status | File |
|-----------|-----------|--------|------|
| programs | 1 | ✅ Ready | programs_import.json |
| standards | 21 | ✅ Ready | standards_import.json |
| departments | 10 | ✅ Ready | departments_import.json |
| competencies | 4 | ✅ Ready | competencies_import.json |
| projects | 10 | ✅ Ready | projects_import.json |
| documents | 3 | ✅ Ready | documents_import.json |
| trainingPrograms | 2 | ✅ Ready | trainingPrograms_import.json |
| risks | 3 | ✅ Ready | risks_import.json |
| **TOTAL** | **54** | ✅ Ready | **8 files** |

---

## 🚀 How to Import Documents via Firebase Setup Page

### Method 1: Copy-Paste Individual Documents (Recommended)

#### Step 1: Open Import File
1. Navigate to: `firebase-import-ready/` folder
2. Open first file: `programs_import.json` in VS Code or Notepad

#### Step 2: View Document Structure
The file looks like this:
```json
{
  "collection": "programs",
  "documentIdField": "id",
  "documents": [
    {
      "id": "prog-ohap",
      "name": "Oman Health Accreditation Program",
      ...
    }
  ],
  "documentCount": 1
}
```

#### Step 3: Extract Document Content
1. Find the first document in the `documents` array
2. Copy everything from `{` to `}` (including nested objects)
3. Example for programs:
   ```json
   {
     "id": "prog-ohap",
     "name": "Oman Health Accreditation Program",
     "description": { "en": "...", "ar": "..." },
     ...
   }
   ```

#### Step 4: Add Document in Firebase
1. Open app → Settings → **Firebase Setup**
2. Click **Collections** tab
3. Find/Click "programs" collection
4. Click **"+ Add Document"** or **"Add"** button
5. Set **Document ID:** `prog-ohap` (from the `id` field)
6. **Paste document content** in the fields below
7. Click **Save**

#### Step 5: Repeat for All Documents
- For **programs**: 1 document
- For **standards**: 21 documents (⚠️ Largest - consider using Standards Import from StandardsPage instead)
- For **departments**: 10 documents
- For **competencies**: 4 documents
- For **projects**: 10 documents
- For **documents**: 3 documents
- For **trainingPrograms**: 2 documents
- For **risks**: 3 documents

---

## 📝 Import Order (Recommended)

Do these **in order** to avoid dependency issues:

### Phase 1: Foundation Collections
1. ✅ **appSettings** (already done - 1 document)
2. ✅ **users** (already done - 12 documents)
3. **programs** (1 document) - Required by standards
4. **standards** (21 documents) - Use StandardsPage import feature

### Phase 2: Supporting Collections
5. **departments** (10 documents) - Referenced by users
6. **competencies** (4 documents) - Referenced by users/projects

### Phase 3: Main Collections
7. **projects** (10 documents)
8. **documents** (3 documents)
9. **trainingPrograms** (2 documents)

### Phase 4: Risk Management
10. **risks** (3 documents)

---

## 🎯 Quick Reference: Document IDs by Collection

### programs_import.json
- `prog-ohap`

### standards_import.json (Use StandardsPage Import Instead)
- `OHAS.GAL.1`, `OHAS.GAL.2`
- `OHAS.HRM.1`, `OHAS.HRM.2`
- `OHAS.CSS.1` through `OHAS.CSS.5` (5 standards)
- `OHAS.SMCS.1`, `OHAS.SMCS.2`
- `OHAS.QRM.1`, `OHAS.QRM.2`
- `OHAS.IPC.1`
- `OHAS.MMU.1`
- `OHAS.PRE.1`, `OHAS.PRE.2`
- `OHAS.IMS.1`, `OHAS.IMS.2`
- `OHAS.FMS.1`, `OHAS.FMS.2`
- **Total: 21 standards**

### departments_import.json
- `dep-1` (Nursing)
- `dep-2` (Pharmacy)
- `dep-3` (Laboratory)
- `dep-4` (Radiology)
- `dep-5` (Quality Management)
- `dep-6` (Infection Control)
- `dep-7` (Administration)
- `dep-8` (Facilities Management) - ⚠️ NEW
- `dep-9` (Human Resources) - ⚠️ NEW
- `dep-10` (Information Technology) - ⚠️ NEW

### competencies_import.json
- `comp-1` (BLS)
- `comp-2` (ACLS)
- `comp-3` (CPHQ)
- `comp-4` (CIC)

### projects_import.json
- `proj-ch1-gal` through `proj-ch10-fms` (10 projects)
- One project per OHAS chapter

### documents_import.json
- `doc-1` (Patient Identification Policy)
- `doc-2` (QMS Review Minutes)
- `doc-3` (Audit Records)

### trainingPrograms_import.json
- `training-1` (Hand Hygiene & Infection Control)
- `training-2` (Patient Identification)

### risks_import.json
- `risk-1` (Lab Analyzer Failure)
- `risk-2` (Data Privacy Regulation Changes)
- `risk-3` (ICU Nurse Shortage)

---

## ⚡ Speed Tips

### Option A: Use Standards Import Feature (FASTEST for standards)
1. Go to **Standards Page** (not Firebase Setup)
2. Click **Import Standards** button
3. Select `src/data/standards.json`
4. Click **Import**
5. All 21 standards import at once ✅

### Option B: Bulk Paste (If Collections Manager Supports It)
1. Some versions allow pasting JSON array
2. Check if there's a **"Bulk Import"** or **"Import JSON"** button
3. Paste entire `documents` array from import file
4. Firebase may create all documents at once

### Option C: Script-Based Import (Future Enhancement)
If manual import takes too long, we can create a Firestore batch write script.

---

## 🔍 Verification Checklist

After uploading each collection, verify:

- [ ] Programs: 1 document (prog-ohap)
- [ ] Standards: 21 documents (OHAS.*)
- [ ] Departments: 10 documents (dep-1 through dep-10)
- [ ] Competencies: 4 documents (comp-1 through comp-4)
- [ ] Projects: 10 documents (proj-ch1-gal through proj-ch10-fms)
- [ ] Documents: 3 documents (doc-1 through doc-3)
- [ ] TrainingPrograms: 2 documents (training-1, training-2)
- [ ] Risks: 3 documents (risk-1 through risk-3)

**Total Target:** 54 documents (plus existing appSettings + users)

---

## 🛠️ Troubleshooting

### Problem: "Document ID already exists"
**Solution:** You're trying to add a duplicate. Check Collections Manager to see existing documents.

### Problem: "Field validation error"
**Solution:** Some fields may be required. Check the import file for all required fields.

### Problem: "Paste not working"
**Solution:** 
1. Copy the document object (from `{` to `}`)
2. Make sure you're pasting into the correct field
3. Try pasting in a text editor first to verify format

### Problem: "Collections Manager showing wrong count"
**Solution:**
1. Refresh the page (F5)
2. Click on collection name again
3. Wait for collection stats to reload

---

## 📞 Need Help?

1. **Check Collections Manager** → Shows current state of each collection
2. **Run Status & Health Check** → Validates database connection
3. **Browser Console (F12)** → Shows any error messages during import
4. **Check Firebase Console** → https://console.firebase.google.com/project/accreditex-79c08/firestore

---

## 🎬 Next Steps

1. ✅ Script executed and prepared 54 documents
2. 📂 Open `firebase-import-ready/` folder
3. 🔀 Start with Phase 1 collections (programs, standards)
4. ✔️ Verify each collection after upload
5. ✅ Run system health check when complete
6. 🚀 Test app initialization with Firebase data

---

**Generated:** December 5, 2025  
**Script:** firebase-batch-import.js  
**Status:** Ready for Manual Import via Firebase Setup UI
