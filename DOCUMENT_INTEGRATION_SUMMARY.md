# Document Upload Feature - Integration Summary

## How It Works with Existing Hubs

### 1. **Accreditation Hub (Program Documents)**
**Where:** Settings → Accreditation Programs → Select a Program

**Integration Flow:**
```
AccreditationHubPage
  └─ ProgramCard (shows program info)
      └─ ProgramModal (opens when editing)
          └─ ProgramDocumentManager (NEW - document upload section)
              ├─ Upload PDFs
              ├─ Manage documents
              └─ All programs automatically track documents
```

**What Users See:**
- Click program → Opens details
- Scroll down → See "Program Documents" section
- Upload/Download/Delete documents (admins only)
- All users can download documents from programs

---

### 2. **Standards Management (Standard Documents)**
**Where:** Settings → Accreditation Programs → Select Program → Standards Tab

**Integration Flow:**
```
StandardsPage
  └─ StandardAccordion (shows standard details)
      └─ StandardDocumentManager (NEW - expandable section)
          ├─ Upload PDFs
          ├─ Manage documents
          └─ Standards can have multiple documents
```

**What Users See:**
- Click standard → Shows details + documents
- Upload guidance documents for standards
- All users can download from standards
- Documents help users understand standards

---

### 3. **Document Control Hub (Separate System)**
**Where:** Settings → Documents Control Hub

**How It Differs:**
- **Controlled Documents Hub:** Manages corporate/process documents (approval workflows, signatures)
- **Program Documents:** Educational/reference PDFs linked to programs
- **Standard Documents:** Guidance documents linked to standards

**Relationship:**
```
✅ Program Documents → Supporting materials for accreditation
✅ Standard Documents → Guidance for implementing standards
✅ Controlled Documents → Formal process documents with approvals

These are 3 SEPARATE document systems that coexist:
- Different upload locations
- Different purposes
- Different access patterns
- Fully independent
```

---

### 4. **Projects Hub (Project Integration)**
**Where:** Settings → Projects → Select Project

**How Documents Connect:**
```
Program Documents
  └─ Used by → Projects that implement this program
  └─ Example: Healthcare accreditation docs used by hospital projects

Standard Documents  
  └─ Used by → Projects implementing specific standards
  └─ Example: Quality standards docs guide project quality team

When admin uploads program document:
- ALL projects using that program can access it
- No extra setup needed
- Automatic inheritance
```

---

## Quick Comparison Table

| Feature | Program Docs | Standard Docs | Controlled Docs | Project Docs |
|---------|-------------|---------------|-----------------|-------------|
| **Upload Location** | Program modal | Standard modal | Documents Hub | N/A |
| **Purpose** | Program reference | Standard guidance | Process control | Access inherited |
| **Who Uploads** | Admin | Admin | Admin/Users | N/A |
| **Access** | All users | All users | Role-based | Via programs |
| **Edit After Upload** | Description only | Description only | Full editing | N/A |
| **Approval Workflow** | None | None | Yes | No |
| **Signature Support** | No | No | Yes | No |
| **Linked To** | Programs | Standards | Nothing | Programs→Projects |

---

## Data Flow Example

### Scenario: Hospital Implements Healthcare Accreditation

```
1. Admin creates Program: "Healthcare Accreditation 2025"
   
2. Admin uploads Program Document:
   - File: "Healthcare-Standards-2025.pdf"
   - Access: All hospital users can download
   
3. Admin creates Standards under program:
   - Standard: "Patient Safety"
   - Standard: "Quality Management"
   
4. Admin uploads Standard Documents:
   - Patient Safety doc: "patient-safety-procedures.pdf"
   - Quality doc: "quality-guidelines.pdf"
   
5. Hospital creates Project: "Hospital X Accreditation Initiative"
   - Linked to: Healthcare Program
   - Team members get automatic access to:
     ✓ Program documents (healthcare standards)
     ✓ Standard documents (procedures & guidelines)
     ✓ Can work on accreditation tasks
     
6. Project team uses documents:
   - Downloads guidance
   - Reviews procedures
   - Implements requirements
   - Completes accreditation
```

---

## Technical Integration

### Database Schema
```
Programs
  ├─ documents[] (ProgramDocument[])
  │   ├─ id
  │   ├─ fileUrl
  │   ├─ fileName
  │   ├─ uploadedAt
  │   └─ uploadedBy
  
Standards
  ├─ documents[] (StandardDocument[])
  │   ├─ id
  │   ├─ fileUrl
  │   ├─ fileName
  │   ├─ uploadedAt
  │   └─ uploadedBy

Projects
  ├─ programId (references program)
  │   └─ Auto-access to program documents
```

### Service Architecture
```
Services:
  ├─ programDocumentService
  │   ├─ uploadProgramDocument()
  │   ├─ getProgramDocuments()
  │   └─ deleteProgramDocument()
  
  ├─ standardDocumentService
  │   ├─ uploadStandardDocument()
  │   ├─ getStandardDocuments()
  │   └─ deleteStandardDocument()
  
  └─ storageService (Firebase wrapper)
      ├─ uploadDocument()
      ├─ deleteDocument()
      └─ getDownloadURL()
```

---

## User Permissions Matrix

| User Role | Upload | Download | Delete | Edit |
|-----------|--------|----------|--------|------|
| **Admin** | ✅ All | ✅ All | ✅ All | Description only |
| **ProjectLead** | ❌ No | ✅ All | ❌ No | No |
| **User** | ❌ No | ✅ All | ❌ No | No |

---

## Feature Checklist

### Program Documents
- [x] Upload PDFs to programs
- [x] Download by all users
- [x] Admin can delete
- [x] Tracks upload date/user
- [x] Optional description
- [x] Real-time progress

### Standard Documents
- [x] Upload PDFs to standards
- [x] Download by all users
- [x] Admin can delete
- [x] Tracks upload date/user
- [x] Optional description
- [x] Real-time progress

### Integration Points
- [x] Program Modal → Document Manager
- [x] Standard Modal → Document Manager
- [x] Projects inherit program documents
- [x] Firebase Storage configured
- [x] Security rules deployed
- [x] Type definitions complete

---

## Answer to Your Question

**How does this new feature incorporate with Documents Hub and Projects Hub?**

**SHORT ANSWER:**
- **Program/Standard Documents** = NEW system for educational/reference materials
- **Documents Control Hub** = Existing system for process documents (unchanged)
- **Projects Hub** = Automatically inherits documents from linked programs (no new code needed)
- **All 3 coexist independently** with their own purposes and workflows

The new feature adds document management AT the source (programs/standards) rather than in a central hub, making documents automatically available to whoever needs them without extra setup.

