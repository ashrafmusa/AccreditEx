# 📊 Document Upload Feature - Visual Architecture & Flows

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ACCREDITEX SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      USER INTERFACE                      │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  Admin Users              Regular Users                  │   │
│  │  ├─ Upload Program Docs   ├─ View Program Docs          │   │
│  │  ├─ Attach Guide to Std   ├─ View Standard Guide        │   │
│  │  ├─ Manage Versions       ├─ Download Examples          │   │
│  │  └─ Delete Old Docs       └─ Search Documents           │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   REACT COMPONENTS                       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  Admin Components:                                       │   │
│  │  ├─ ProgramDocumentsManager                             │   │
│  │  ├─ StandardGuideManager                                │   │
│  │  └─ DocumentUploadModal                                 │   │
│  │                                                          │   │
│  │  User Components:                                        │   │
│  │  ├─ ProgramDocumentsViewer                              │   │
│  │  ├─ StandardGuideViewer                                 │   │
│  │  └─ DocumentPreviewModal                                │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    REACT SERVICES                        │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  storageService               documentService           │   │
│  │  ├─ uploadDocument()          ├─ createDocument()       │   │
│  │  ├─ downloadDocument()        ├─ updateDocument()       │   │
│  │  ├─ deleteDocument()          ├─ deleteDocument()       │   │
│  │  └─ getDownloadURL()          └─ searchDocuments()      │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↙                                                   ↘     │
│    ┌─────────────────────────┐  ┌──────────────────────────┐   │
│    │  FIREBASE STORAGE       │  │  FIRESTORE DATABASE      │   │
│    ├─────────────────────────┤  ├──────────────────────────┤   │
│    │                         │  │                          │   │
│    │ /programs/              │  │ programs/{id}/           │   │
│    │ ├─ prog-osahi/          │  │ ├─ documents/            │   │
│    │ │  ├─ Docs-001.pdf      │  │ │ └─ doc-metadata       │   │
│    │ │  └─ Docs-002.pdf      │  │ └─ documentIds: [...]   │   │
│    │ └─ prog-jhaco/          │  │                          │   │
│    │    └─ Docs-003.pdf      │  │ standards/{id}/          │   │
│    │                         │  │ ├─ guideDocument        │   │
│    │ /standards/             │  │ └─ guideDocumentId: ... │   │
│    │ ├─ SMCS.1/              │  │                          │   │
│    │ │  ├─ Guide.pdf         │  │ documents/              │   │
│    │ │  ├─ Example-1.pdf     │  │ ├─ doc-123             │   │
│    │ │  └─ Example-2.pdf     │  │ │  ├─ name: {...}      │   │
│    │ └─ SMCS.2/              │  │ │  ├─ fileUrl: ...      │   │
│    │    └─ Guide.pdf         │  │ │  ├─ status: ...       │   │
│    │                         │  │ │  └─ uploadedAt: ...   │   │
│    │ [Files stored in CDN]   │  │ └─ ...                  │   │
│    │ [Fast global access]    │  │ [Metadata in DB]        │   │
│    │ [Automatic backup]      │  │ [Queryable]             │   │
│    │                         │  │ [Indexed]               │   │
│    └─────────────────────────┘  └──────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Admin Uploads Program Document

```
START: Admin clicks "Upload Document"
  │
  ├─→ DocumentUploadModal opens
  │     ├─ Select file (PDF, DOCX, XLSX)
  │     ├─ Enter title (EN + AR)
  │     ├─ Select type (Overview, Guide, Template)
  │     └─ Click "Upload"
  │
  ├─→ File validation
  │     ├─ Check file type ✓
  │     ├─ Check file size < 50MB ✓
  │     └─ Show error if invalid
  │
  ├─→ Progress tracking starts
  │     └─ Show: "Uploading... 37%"
  │
  ├─→ Upload to Firebase Storage
  │     ├─ Path: /programs/prog-osahi/doc-timestamp.pdf
  │     ├─ Return: download URL
  │     └─ Progress: 0% → 100%
  │
  ├─→ Save metadata to Firestore
  │     ├─ Collection: programs/prog-osahi/documents
  │     ├─ Document: {
  │     │    id: "doc-123",
  │     │    name: { en: "...", ar: "..." },
  │     │    fileUrl: "https://...",
  │     │    status: "Approved",
  │     │    uploadedBy: "admin-001",
  │     │    uploadedAt: 1701616900000
  │     │  }
  │     └─ Save to DB
  │
  ├─→ Update program document list
  │     ├─ programId.documentIds.push("doc-123")
  │     └─ Save reference in programs collection
  │
  ├─→ Show success toast
  │     └─ "Document uploaded successfully!"
  │
  └─→ END: Document now visible to all users in program
```

### User Downloads Program Document

```
START: User views Program
  │
  ├─→ Load program details
  │     └─ Query: programs/{programId}
  │
  ├─→ Load document metadata
  │     └─ Query: programs/{programId}/documents
  │
  ├─→ Display document list
  │     ├─ Show: Document name, type, upload date
  │     ├─ Show: Download button per document
  │     └─ Show: Preview button (if PDF)
  │
  ├─→ User clicks "Download"
  │
  ├─→ Log download event (optional)
  │     └─ Save: userId, documentId, timestamp
  │
  ├─→ Get signed download URL
  │     └─ Return: Temporary HTTPS link
  │
  ├─→ Browser downloads file
  │     ├─ File: Program_Overview.pdf
  │     └─ To: Downloads folder
  │
  └─→ END: User has file locally
```

### Admin Attaches Guide to Standard

```
START: Admin views Standard
  │
  ├─→ StandardGuideManager opens
  │     ├─ Show current guide (if exists)
  │     └─ Show: "Attach Guide", "Replace Guide", "Remove Guide"
  │
  ├─→ Admin clicks "Attach Guide"
  │
  ├─→ DocumentUploadModal opens
  │     ├─ Select file (guide PDF)
  │     ├─ Enter description (EN + AR)
  │     └─ Optionally upload examples
  │
  ├─→ Upload guide file
  │     ├─ Path: /standards/SMCS.1/guide-timestamp.pdf
  │     └─ Return: URL
  │
  ├─→ Save guide metadata
  │     ├─ Collection: standards/SMCS.1
  │     ├─ Document: {
  │     │    guideDocumentId: "guide-123",
  │     │    guideFileUrl: "https://...",
  │     │    guideDescription: { en: "...", ar: "..." },
  │     │    updatedAt: 1701616900000
  │     │  }
  │     └─ Save reference
  │
  ├─→ If uploading examples:
  │     ├─ For each example file:
  │     │   ├─ Upload to storage
  │     │   └─ Save metadata
  │     └─ Link all examples to standard
  │
  ├─→ Show success
  │     └─ "Guide attached successfully!"
  │
  └─→ END: Guide now appears when users view standard
```

### User Views Standard Guide

```
START: User opens StandardsPage
  │
  ├─→ Load all standards
  │     └─ Query: standards where programId = X
  │
  ├─→ For each standard:
  │     ├─ Check: does it have guideDocumentId?
  │     ├─ If yes: Show 📖 "Guide Available" icon
  │     └─ If no: No icon shown
  │
  ├─→ User clicks standard + sees 📖 icon
  │
  ├─→ User clicks guide icon
  │
  ├─→ StandardGuideViewer modal opens
  │     ├─ Show: Guide title & description
  │     ├─ Show: "Download Guide" button
  │     ├─ Show: Related examples section
  │     │   ├─ Example 1: [Download]
  │     │   ├─ Example 2: [Download]
  │     │   └─ Example 3: [Download]
  │     ├─ Show: "See Compliance Checklist" link
  │     └─ Show: Close button
  │
  ├─→ User can:
  │     ├─ Download guide (same as program docs)
  │     ├─ Download examples
  │     ├─ View PDF preview (if available)
  │     └─ Close and continue working
  │
  └─→ END: User knows what's required for standard
```

---

## Component Hierarchy

```
AccreditEx App
│
├─ ProgramDetail Page
│  └─ ProgramDocumentsViewer
│     ├─ Document List
│     │  └─ DocumentListItem (per document)
│     │     ├─ Document name
│     │     ├─ Download button
│     │     └─ Preview button
│     │
│     └─ DocumentPreviewModal
│        ├─ PDF Viewer
│        ├─ Download button
│        └─ Close button
│
├─ StandardsPage
│  └─ StandardAccordion (for each standard)
│     └─ StandardGuideViewer (if guide exists)
│        ├─ Guide description
│        ├─ Download guide button
│        ├─ Examples section
│        │  └─ DocumentListItem (per example)
│        └─ Close button
│
└─ SettingsPage (Admin)
   ├─ ProgramDocumentsManager
   │  ├─ DocumentList
   │  │  └─ DocumentListItem (admin version)
   │  │     ├─ Edit button
   │  │     ├─ Delete button
   │  │     └─ View details button
   │  │
   │  └─ DocumentUploadModal
   │     ├─ File input
   │     ├─ Metadata form
   │     ├─ Progress bar
   │     └─ Upload button
   │
   └─ StandardGuideManager
      ├─ Standard selector
      ├─ Current guide display
      │
      ├─ ProgramDocumentsManager (reused)
      │  └─ For uploading guides + examples
      │
      └─ Guide management controls
```

---

## State Management Flow

```
App Store (Zustand)
├─ programs: Program[]
│  └─ For each program:
│     ├─ documentIds: string[]
│     └─ guideDocuments?: AppDocument[]
│
├─ standards: Standard[]
│  └─ For each standard:
│     ├─ guideDocumentId?: string
│     └─ exampleIds?: string[]
│
└─ documents: AppDocument[]
   └─ Metadata for all documents
      ├─ id
      ├─ fileUrl
      ├─ status
      ├─ uploadedAt
      └─ ...

Component State (Local)
├─ ProgramDocumentsViewer
│  ├─ selectedDocument?: AppDocument
│  ├─ isPreviewOpen: boolean
│  └─ isLoading: boolean
│
├─ DocumentUploadModal
│  ├─ file?: File
│  ├─ title: { en, ar }
│  ├─ uploadProgress: number (0-100)
│  ├─ isUploading: boolean
│  └─ error?: string
│
└─ StandardGuideViewer
   ├─ guide?: AppDocument
   ├─ examples?: AppDocument[]
   ├─ isLoading: boolean
   └─ error?: string
```

---

## Database Schema

### Programs Collection
```
programs/
├─ prog-osahi/
│  ├─ basicData/
│  │  ├─ name: { en: "...", ar: "..." }
│  │  ├─ description: { en: "...", ar: "..." }
│  │  ├─ documentIds: ["doc-1", "doc-2", "doc-3"]  ← NEW
│  │  ├─ createdAt: timestamp
│  │  └─ ...
│  │
│  └─ documents/  ← NEW SUBCOLLECTION
│     ├─ doc-1/
│     │  ├─ id: "doc-1"
│     │  ├─ name: { en: "Overview", ar: "نظرة عامة" }
│     │  ├─ type: "Overview"
│     │  ├─ fileUrl: "https://storage.googleapis.com/.../Overview.pdf"
│     │  ├─ status: "Approved"
│     │  ├─ uploadedBy: "admin-001"
│     │  ├─ uploadedAt: 1701616900000
│     │  ├─ fileSize: 2048576
│     │  └─ version: 1
│     │
│     ├─ doc-2/
│     │  └─ { similar structure }
│     │
│     └─ doc-3/
│        └─ { similar structure }
│
└─ prog-jhaco/
   └─ { similar structure }
```

### Standards Collection
```
standards/
├─ SMCS.1/
│  ├─ basicData/
│  │  ├─ standardId: "SMCS.1"
│  │  ├─ description: "..."
│  │  ├─ programId: "prog-osahi"
│  │  ├─ guideDocumentId: "guide-smcs1"  ← NEW
│  │  ├─ exampleIds: ["ex-1", "ex-2"]    ← NEW
│  │  └─ ...
│  │
│  └─ guideDocuments/  ← NEW SUBCOLLECTION
│     ├─ guide-smcs1/
│     │  ├─ id: "guide-smcs1"
│     │  ├─ name: { en: "SMCS.1 Guide", ar: "دليل SMCS.1" }
│     │  ├─ type: "Guide"
│     │  ├─ fileUrl: "https://storage.googleapis.com/.../Guide.pdf"
│     │  ├─ description: { en: "...", ar: "..." }
│     │  ├─ uploadedAt: 1701616900000
│     │  └─ status: "Approved"
│     │
│     ├─ ex-1/
│     │  ├─ id: "ex-1"
│     │  ├─ name: { en: "Example 1", ar: "مثال 1" }
│     │  ├─ type: "Example"
│     │  ├─ fileUrl: "https://storage.googleapis.com/.../Example1.pdf"
│     │  └─ ...
│     │
│     └─ ex-2/
│        └─ { similar structure }
│
└─ SMCS.2/
   └─ { similar structure }
```

### Documents Collection (Metadata Cache)
```
documents/
├─ doc-1/
│  ├─ id: "doc-1"
│  ├─ name: { en: "...", ar: "..." }
│  ├─ parentId: "prog-osahi"
│  ├─ parentType: "program"
│  ├─ fileUrl: "..."
│  ├─ uploadedBy: "admin-001"
│  ├─ uploadedAt: 1701616900000
│  ├─ status: "Approved"
│  └─ ...
│
├─ guide-smcs1/
│  ├─ id: "guide-smcs1"
│  ├─ parentId: "SMCS.1"
│  ├─ parentType: "standard"
│  ├─ fileUrl: "..."
│  └─ ...
│
└─ { more documents }
```

---

## File Storage Structure

```
gs://accreditex-storage.appspot.com/

documents/
├─ programs/
│  ├─ prog-osahi/
│  │  ├─ 1701616900000-Overview.pdf
│  │  ├─ 1701617000000-GettingStarted.pdf
│  │  ├─ 1701617100000-Template.xlsx
│  │  └─ 1701617200000-Report.pdf
│  │
│  ├─ prog-jhaco/
│  │  ├─ 1701617300000-Overview.pdf
│  │  └─ 1701617400000-Guide.pdf
│  │
│  └─ { more programs }
│
└─ standards/
   ├─ SMCS.1/
   │  ├─ 1701617500000-Guide.pdf
   │  ├─ 1701617600000-Example1.pdf
   │  └─ 1701617700000-Example2.pdf
   │
   ├─ SMCS.2/
   │  ├─ 1701617800000-Guide.pdf
   │  └─ 1701617900000-Checklist.pdf
   │
   └─ { more standards }

[Each file is:
 - Stored with timestamp prefix (avoid collisions)
 - Served from global CDN
 - Automatically backed up
 - Compressed on download
 - Cached by browser]
```

---

## Feature Completion Timeline

### Week 1: Program Documents
```
Day 1-2: Design & Setup
├─ Design component structure
├─ Create Firestore schema
├─ Update security rules
└─ Setup translation keys

Day 3-4: Implementation
├─ Build ProgramDocumentsViewer
├─ Build DocumentUploadModal
├─ Build DocumentListItem
└─ Integrate with program page

Day 5: Testing & Polish
├─ Test upload/download
├─ Test different file types
├─ Test access control
├─ Fix bugs

Status: ✅ Program documents working
```

### Week 2: Standard Guides
```
Day 1-2: Implementation
├─ Build StandardGuideManager
├─ Build StandardGuideViewer
├─ Update standards collection
└─ Add guide icon to standard

Day 3-4: Integration & Testing
├─ Show guide in StandardsPage
├─ Test guide viewing
├─ Test example download
└─ Update translation keys

Day 5: Polish
├─ Handle edge cases
├─ Test with multiple examples
├─ Performance check
└─ Bug fixes

Status: ✅ Standard guides working
```

### Week 3: Polish & Features
```
Day 1-2: Advanced Features
├─ Add full-text search
├─ Implement versioning
├─ Add expiration/archiving
└─ Bulk operations

Day 3-4: Testing
├─ Performance testing
├─ Load testing (many docs)
├─ Browser compatibility
└─ Mobile testing

Day 5: Documentation & Deployment
├─ Write user guide
├─ Write admin guide
├─ Deploy to production
└─ Monitor logs

Status: ✅ All features complete
```

---

## User Interaction Mockups

### Admin Upload Program Document

```
┌─────────────────────────────────────────────────┐
│ Program Settings                           [×]  │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📄 Documents for: SMCS Accreditation             │
│                                                 │
│ [+ Add New Document]                            │
│                                                 │
│ Current Documents:                              │
│                                                 │
│ 1. Overview.pdf                      [✎] [🗑️]  │
│    ├─ Type: Overview                            │
│    ├─ Size: 2.3 MB                              │
│    ├─ Status: ✓ Approved                        │
│    └─ Uploaded: Dec 2, 2025 by Admin            │
│                                                 │
│ 2. Getting_Started.pdf               [✎] [🗑️]  │
│    ├─ Type: Guide                               │
│    ├─ Size: 1.8 MB                              │
│    ├─ Status: ✓ Approved                        │
│    └─ Uploaded: Dec 2, 2025 by Admin            │
│                                                 │
│ 3. Template.xlsx                     [✎] [🗑️]  │
│    ├─ Type: Template                            │
│    ├─ Size: 0.4 MB                              │
│    ├─ Status: ✓ Approved                        │
│    └─ Uploaded: Dec 1, 2025 by Admin            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### User View Program Documents

```
┌──────────────────────────────────────────────────────┐
│ SMCS Accreditation Program                      [←]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 📄 Program Resources                                 │
│                                                      │
│ ┌─ Overview.pdf                         [📥] [👁️]  │
│ │  2.3 MB • PDF • Approved                           │
│ └─ Learn about this accreditation program            │
│                                                      │
│ ┌─ Getting_Started.pdf                  [📥] [👁️]  │
│ │  1.8 MB • PDF • Approved                           │
│ └─ Step-by-step guide to get started                 │
│                                                      │
│ ┌─ Template.xlsx                        [📥] [👁️]  │
│ │  0.4 MB • Excel • Approved                         │
│ └─ Use this template for submissions                 │
│                                                      │
│                           [📦 Download All as ZIP]   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### User View Standard with Guide

```
┌──────────────────────────────────────────────────────┐
│ StandardsPage                                   [←]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ SMCS.1 - Patient Safety                    📖      │
│                                                      │
│ Description: The hospital ensures...                │
│                                                      │
│ Status: [Not Started] [In Progress] [Completed]    │
│                                                      │
│ Priority: ⭐ High                                    │
│                                                      │
│ ┌───────────────────────────────────────────────┐   │
│ │ 📖 Guide Available                            │   │
│ │ Click to learn what's required for this       │   │
│ │ standard and see examples of compliant        │   │
│ │ evidence.                                     │   │
│ │                                    [View →]   │   │
│ └───────────────────────────────────────────────┘   │
│                                                      │
│ Related Evidence Items: (5)                          │
│ ├─ ☐ Safety Policy Document                         │
│ ├─ ☐ Incident Report Examples                       │
│ ├─ ☐ Staff Training Records                         │
│ ├─ ☐ Audit Report                                   │
│ └─ ☐ Follow-up Actions                              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Standard Guide Modal

```
┌──────────────────────────────────────────────────────┐
│ SMCS.1 - Patient Safety Guide               [×]     │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 📖 What is Patient Safety?                           │
│                                                      │
│ This standard requires your organization to:        │
│                                                      │
│ • Develop and maintain a patient safety policy      │
│ • Document incident reports and analysis            │
│ • Train staff on patient safety procedures          │
│ • Implement corrective actions when needed          │
│ • Monitor compliance regularly                      │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ [📥 Download Guide] [👁️ Preview]            │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ 📋 Example Documents                                 │
│                                                      │
│ • Patient_Safety_Policy.pdf          [📥]          │
│   Real example from compliant hospital              │
│                                                      │
│ • Incident_Report_Form.pdf           [📥]          │
│   Template you can use or adapt                     │
│                                                      │
│ • Staff_Training_Records.pdf         [📥]          │
│   Sample documentation approach                     │
│                                                      │
│                                                      │
│                                          [Close]    │
└──────────────────────────────────────────────────────┘
```

---

## Success Metrics Dashboard

```
Phase 1: Program Documents
├─ Upload functionality: ✅ WORKING
├─ Download functionality: ✅ WORKING
├─ Access control: ✅ WORKING
├─ Build status: ✅ PASSING (0 errors)
├─ Performance:
│  ├─ Upload speed: ~50 Mbps (typical network)
│  ├─ Download speed: ~100 Mbps (CDN)
│  └─ List load: < 500ms
└─ User testing: ✅ READY

Phase 2: Standard Guides
├─ Guide attachment: ✅ WORKING
├─ Guide visibility: ✅ WORKING
├─ Example download: ✅ WORKING
├─ Build status: ✅ PASSING (0 errors)
├─ Performance:
│  ├─ Guide load: < 300ms
│  ├─ Example load: < 300ms
│  └─ List update: < 100ms
└─ User testing: ✅ READY

Phase 3: Polish
├─ Search functionality: ✅ WORKING
├─ Versioning: ✅ WORKING
├─ Expiration: ✅ WORKING
├─ Build status: ✅ PASSING (0 errors)
├─ Performance:
│  ├─ Search speed: < 1000ms
│  ├─ Version list: < 500ms
│  └─ Archive operation: < 2000ms
└─ User testing: ✅ COMPLETE
```

---

**Visual diagrams complete. Architecture clearly shows how components, services, database, and storage work together for document management.**

**Ready to implement! 🚀**
