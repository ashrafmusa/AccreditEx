# Firebase Import - Quick Reference Card

## 📌 What's Ready to Upload

- **Total Documents:** 54 (all prepared)
- **Location:** `firebase-import-ready/` folder
- **Files Created:** 8 JSON import files
- **Upload Method:** Manual copy-paste via Firebase Setup UI

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Open Firebase Setup
1. App → Settings → **Firebase Setup**
2. Click **Collections** tab

### Step 2: Import Standards (Fastest)
1. Go to **Standards Page** (main menu)
2. Click **Import Standards** button
3. Select `src/data/standards.json`
4. Click **Import**
5. ✅ Done - All 21 standards uploaded!

### Step 3: Upload Remaining 33 Documents
Copy-paste from `firebase-import-ready/` folder:
- **programs** (1) → programs_import.json
- **departments** (3 missing) → departments_import.json  
- **competencies** (4) → competencies_import.json
- **projects** (10) → projects_import.json
- **documents** (3) → documents_import.json
- **trainingPrograms** (2) → trainingPrograms_import.json
- **risks** (3) → risks_import.json

---

## 📋 Copy-Paste Process (Repeat for Each Document)

1. **Open import file** in VS Code or Notepad
2. **Find the document** in the "documents" array
3. **Copy document object** (from { to })
4. **In Collections Manager:**
   - Click collection name
   - Click "+ Add Document"
   - Set **Document ID** (from "id" field)
   - **Paste** document content
   - Click **Save**

---

## ⚡ Pro Tips

✅ **Use StandardsPage Import for Standards** (fastest - all 21 at once)  
✅ **Copy-paste is fastest for small collections** (1-4 documents)  
✅ **Verify after each upload** - Check count in Collections Manager  
✅ **Refresh page if counts look wrong** - UI sometimes needs reload  

---

## 📊 Document Count Reference

| Collection | Count | Location |
|-----------|-------|----------|
| programs | 1 | programs_import.json |
| standards | 21 | Use StandardsPage Import |
| departments | 10 | departments_import.json |
| competencies | 4 | competencies_import.json |
| projects | 10 | projects_import.json |
| documents | 3 | documents_import.json |
| trainingPrograms | 2 | trainingPrograms_import.json |
| risks | 3 | risks_import.json |
| **TOTAL** | **54** | **8 files** |

---

## ✅ After Upload - Verify

1. **Collections Manager:** All 10 collections with correct counts
2. **Status & Health:** Click Test - should show Connected ✅
3. **App Load:** Refresh - should load with Firebase data ✅
4. **Standards Page:** Should show 21 OHAS standards ✅
5. **Projects Page:** Should show 10 chapter projects ✅

---

## 🛠️ If Something Goes Wrong

### "Document ID already exists"
→ Check if it's already uploaded in Collections Manager

### "Paste not working"
→ Copy the object from { to } exactly, including nested content

### "Collection doesn't exist"
→ Collections Manager will create it automatically when you add first document

### "Document didn't save"
→ Refresh page and check Collections Manager

---

## 📞 Quick Links

- **Import Files:** `firebase-import-ready/` folder
- **Detailed Guide:** `FIREBASE_BATCH_IMPORT_GUIDE.md`
- **Tracking Checklist:** `FIREBASE_IMPORT_TRACKING.md`
- **Firebase Console:** https://console.firebase.google.com/project/accreditex-79c08
- **Import Summary:** `firebase-import-ready/IMPORT_SUMMARY.txt`

---

## 🎯 Success = All Steps Done

- [ ] All 54 documents uploaded
- [ ] Collections Manager shows: 77 total documents
- [ ] Status & Health: All green (Connected)
- [ ] App loads with Firebase data
- [ ] Standards page shows 21 standards
- [ ] Projects page shows 10 projects

---

**Status:** ✅ Ready for Upload  
**Next Action:** Open firebase-import-ready folder and start copying!
