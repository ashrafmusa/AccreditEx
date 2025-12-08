# Firestore Composite Indexes Guide

**Date:** January 15, 2025  
**Phase:** 5/10 - Composite Indexes Creation  
**Status:** Planning & Recommendations  
**Impact:** Enable efficient multi-field queries without performance degradation

## Overview

Composite indexes in Firestore allow efficient queries that filter or sort by multiple fields. Without proper indexes, queries with multiple `where()` clauses or `where()` + `orderBy()` combinations can:
- Return stale results
- Require more read operations
- Block on query execution

This guide identifies all composite indexes needed for the AccreditEx application.

## Index Classification

### Single-Field Indexes (Auto-Created by Firestore)
✅ Automatically created - no action needed
- `projects` collection: `status`, `createdAt`, `programId`
- `users` collection: `departmentId`, `role`, `status`
- `documents` collection: `type`, `status`
- `departments` collection: `name`
- `tasks` collection: `projectId`, `assignedTo`

### Composite Indexes (Manual Creation Required)
⚠️ Need to be created manually in Firebase Console

---

## Required Composite Indexes

### 1. Projects Collection

#### Index 1.1: Filter by Status + Sort by Created Date
```
Collection: projects
Fields:
  - status (Ascending)
  - createdAt (Descending)
```

**Why:** ProjectListPage filters by status and sorts by creation date
```typescript
// src/pages/ProjectListPage.tsx
const filteredProjects = projects.filter(p => {
  const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
  // Then sorted by createdAt
});
```

**Database Query:**
```typescript
const q = query(
  projectsCollection,
  where('status', '==', statusValue),
  orderBy('createdAt', 'desc')
);
```

**Estimated Impact:** 500+ queries/week

---

#### Index 1.2: Filter by Department + Status
```
Collection: projects
Fields:
  - departmentId (Ascending)
  - status (Ascending)
```

**Why:** Department dashboards need to show projects by status
```typescript
// src/components/departments/DepartmentTaskTable.tsx
const relevantTasks = projects.flatMap(p => p.checklist)
  .filter(item => /* assigned to dept users + status filter */);
```

**Database Query:**
```typescript
const q = query(
  projectsCollection,
  where('departmentId', '==', deptId),
  where('status', '==', statusValue)
);
```

**Estimated Impact:** 100+ queries/week

---

#### Index 1.3: Filter by Program + Status + Create Date
```
Collection: projects
Fields:
  - programId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
```

**Why:** Accreditation programs need active projects sorted by date
```typescript
// src/hooks/useAppStore.ts
export const getProjectsByProgram = async (programId: string): Promise<Project[]> => {
  const q = query(projectsCollection, where('programId', '==', programId));
  // Then filtered and sorted in component
};
```

**Database Query:**
```typescript
const q = query(
  projectsCollection,
  where('programId', '==', programId),
  where('status', '==', 'Active'),
  orderBy('createdAt', 'desc')
);
```

**Estimated Impact:** 50+ queries/week

---

### 2. Users Collection

#### Index 2.1: Filter by Department + Role
```
Collection: users
Fields:
  - departmentId (Ascending)
  - role (Ascending)
```

**Why:** Department dashboards show staff by role
```typescript
// src/pages/DepartmentDetailPage.tsx
const departmentData = useMemo(() => {
  const usersInDept = users.filter(u => u.departmentId === department.id);
  // Component then filters by role if needed
});
```

**Database Query:**
```typescript
const q = query(
  usersCollection,
  where('departmentId', '==', departmentId),
  where('role', '==', roleValue)
);
```

**Estimated Impact:** 200+ queries/week

---

#### Index 2.2: Filter by Department + Status
```
Collection: users
Fields:
  - departmentId (Ascending)
  - status (Ascending)
```

**Why:** Get active users in a department
```typescript
// Current: Client-side filtering
const activeUsersInDept = users.filter(u => 
  u.departmentId === deptId && u.status === 'Active'
);

// Future: Database-level filtering
const q = query(
  usersCollection,
  where('departmentId', '==', deptId),
  where('status', '==', 'Active')
);
```

**Database Query:**
```typescript
const q = query(
  usersCollection,
  where('departmentId', '==', departmentId),
  where('status', '==', 'Active')
);
```

**Estimated Impact:** 150+ queries/week

---

### 3. Documents Collection

#### Index 3.1: Filter by Project + Status
```
Collection: documents
Fields:
  - projectId (Ascending)
  - status (Ascending)
```

**Why:** Show project documents filtered by status
```typescript
// Future implementation in documentService.ts
const q = query(
  documentsCollection,
  where('projectId', '==', projectId),
  where('status', '==', statusValue)
);
```

**Estimated Impact:** 300+ queries/week

---

#### Index 3.2: Filter by Type + Status + Created Date
```
Collection: documents
Fields:
  - type (Ascending)
  - status (Ascending)
  - createdAt (Descending)
```

**Why:** Document control hubs filter by type/status with date sorting
```typescript
// src/pages/DocumentControlHubPage.tsx
const controlledDocuments = useMemo(() => {
  const filtered = documents.filter(doc => {
    if (activeFilters.status) {
      filtered = filtered.filter(doc => doc.status === activeFilters.status);
    }
    // Sorted by creation date
  });
  return filtered;
}, [documents, activeFilters]);
```

**Database Query:**
```typescript
const q = query(
  documentsCollection,
  where('type', '==', typeValue),
  where('status', '==', statusValue),
  orderBy('createdAt', 'desc')
);
```

**Estimated Impact:** 200+ queries/week

---

### 4. Tasks Collection (Checklist Items)

#### Index 4.1: Filter by Project + Status
```
Collection: tasks (nested in projects, but could be separate)
Fields:
  - projectId (Ascending)
  - status (Ascending)
```

**Why:** Show project tasks/checklist filtered by completion status
```typescript
// src/components/projects/ChecklistEvidence.tsx
const filteredTasks = tasks.filter(t => t.status === selectedStatus);
```

**Database Query (if extracted to separate collection):**
```typescript
const q = query(
  tasksCollection,
  where('projectId', '==', projectId),
  where('status', '==', statusValue)
);
```

**Current State:** Tasks stored in project document (no separate collection)  
**Estimated Impact:** 150+ queries/week (if separated)

---

#### Index 4.2: Filter by Assigned User + Status
```
Collection: tasks
Fields:
  - assignedTo (Ascending)
  - status (Ascending)
```

**Why:** Show user's pending tasks
```typescript
// src/pages/MyTasksPage.tsx
// Show tasks assigned to current user with status filter
const userTasks = tasks.filter(t => 
  t.assignedTo === currentUserId && t.status === 'Pending'
);
```

**Database Query (if extracted to separate collection):**
```typescript
const q = query(
  tasksCollection,
  where('assignedTo', '==', userId),
  where('status', '==', 'Pending')
);
```

**Current State:** Tasks stored in project document (no separate collection)  
**Estimated Impact:** 100+ queries/week (if separated)

---

### 5. Competencies Collection

#### Index 5.1: Filter by Department Required + Status
```
Collection: users (for competency tracking)
Fields:
  - departmentId (Ascending)
  - competencyExpiryDate (Ascending)
```

**Why:** Gap analysis - find users with expiring competencies
```typescript
// src/components/quality-insights/CompetencyGapReport.tsx
const usersWithCompetency = usersInDept.filter(u => 
  u.competencies?.some(c => 
    c.competencyId === reqCompId && 
    (!c.expiryDate || new Date(c.expiryDate) > new Date())
  )
).length;
```

**Database Query:**
```typescript
const q = query(
  usersCollection,
  where('departmentId', '==', departmentId),
  where('competencies.*.expiryDate', '>', now)
);
```

**Note:** Firestore doesn't support array filtering with where. Keep as client-side.

**Current State:** Client-side filtering (acceptable, small data set)

---

### 6. Audit Logs Collection

#### Index 6.1: Filter by Entity + Timestamp
```
Collection: auditLogs
Fields:
  - entityId (Ascending)
  - timestamp (Descending)
```

**Why:** Show audit trail for specific project/document
```typescript
// Audit log viewer
const q = query(
  auditLogsCollection,
  where('entityId', '==', projectId),
  orderBy('timestamp', 'desc'),
  limit(50)
);
```

**Estimated Impact:** 50+ queries/week

---

#### Index 6.2: Filter by User + Timestamp
```
Collection: auditLogs
Fields:
  - userId (Ascending)
  - timestamp (Descending)
```

**Why:** Show user activity log
```typescript
// User profile - show their actions
const q = query(
  auditLogsCollection,
  where('userId', '==', userId),
  orderBy('timestamp', 'desc'),
  limit(50)
);
```

**Estimated Impact:** 30+ queries/week

---

## Implementation Steps

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select AccreditEx project
3. Navigate to **Firestore Database** → **Indexes**

### Step 2: Create Composite Indexes

#### Method 1: Automatic Creation (Recommended)
1. Run queries with `where()` + `where()` or `where()` + `orderBy()` in development
2. Firebase automatically suggests indexes in console
3. Click **Create Index** for each suggestion
4. Wait for index to build (usually 5-10 minutes)

#### Method 2: Manual Creation
1. In Firestore Console, click **Composite Indexes** tab
2. Click **Create Index**
3. Fill in:
   - **Collection ID:** (e.g., "projects")
   - **Fields:** (add each field with direction)
   - **Query scope:** Collection
4. Click **Create**

### Step 3: Verification

After indexes are created, you'll see:
- ✅ Index Status: "Enabled"
- Green checkmark next to each index
- Query now uses the index

---

## Index Creation Timeline

### HIGH PRIORITY (Create First)
**Estimated Time: 30-60 minutes**

```yaml
1. projects + status + createdAt
   - Frequency: 500+/week
   - Impact: Core project listing
   
2. projects + departmentId + status
   - Frequency: 100+/week
   - Impact: Department views
   
3. users + departmentId + role
   - Frequency: 200+/week
   - Impact: Department staff lists
   
4. documents + type + status + createdAt
   - Frequency: 200+/week
   - Impact: Document control hubs
```

### MEDIUM PRIORITY (Create Next)
**Estimated Time: 30-45 minutes**

```yaml
5. projects + programId + status + createdAt
   - Frequency: 50+/week
   
6. users + departmentId + status
   - Frequency: 150+/week
   
7. documents + projectId + status
   - Frequency: 300+/week
   
8. auditLogs + entityId + timestamp
   - Frequency: 50+/week
```

### LOW PRIORITY (Create Later)
**Estimated Time: 15-30 minutes**

```yaml
9. auditLogs + userId + timestamp
   - Frequency: 30+/week
```

---

## Expected Query Performance

### Before Indexes
- Multi-field queries: ⚠️ Slow (10-100ms)
- May return stale results
- High CPU usage on Firestore backend

### After Indexes
- Multi-field queries: ✅ Fast (<5ms)
- Always returns fresh results
- Minimal backend CPU usage

---

## Monitoring Index Performance

After creating indexes, monitor:

1. **Firestore Console → Metrics**
   - Check read count spike (may increase temporarily)
   - Confirm read count decreases after optimization

2. **Browser Console**
   - Check `freeTierMonitor.getStats()`
   - Verify read operations decrease after optimizations

3. **Query Response Times**
   - Should see improvement immediately after index creation

---

## Cost Impact

### Storage Cost (Indexes)
- Each index: ~1-5 KB storage
- 9 composite indexes: ~30-50 KB
- **Cost:** Negligible (~$0.001/month)

### Read Cost (Query Efficiency)
- **Without indexes:** 1 query = 1+ reads (inefficient)
- **With indexes:** 1 query = 1 read (optimal)
- **Savings:** 20-40% reduction in total reads

**Expected Monthly Savings:** $5-10/month (if optimizations reduce reads by 30%)

---

## Migration Strategy

### Phase 1: Create Indexes (This Phase)
- Create all 9 indexes in Firebase Console
- No code changes needed
- Monitor performance improvement

### Phase 2: Update Queries (Next Phase)
- Update services to use indexed queries
- Replace client-side filtering with database-level filtering
- Expected read reduction: 30-50%

### Phase 3: Optimize Collections
- Consider extracting nested tasks to separate collection
- Add more specific filtering queries
- Expected additional reduction: 10-20%

---

## Validation Checklist

### Before Production
- [ ] All 9 indexes created in Firebase Console
- [ ] Each index shows "Enabled" status
- [ ] Test queries run without warnings
- [ ] No duplicate index warnings in console
- [ ] Read operation count after optimization < 100K/day

### Ongoing Monitoring
- [ ] Daily usage stats from freeTierMonitor
- [ ] Weekly review of new index suggestions
- [ ] Monthly cost analysis from Firebase billing

---

## Common Issues & Solutions

### Issue: "Index not available yet"
**Solution:** Firebase is still building the index. Wait 5-10 minutes.

### Issue: "Query requires additional index"
**Solution:** Create the suggested index immediately.

### Issue: Indexes aren't being used
**Solution:** 
1. Clear browser cache
2. Restart app
3. Verify index name matches query fields exactly

### Issue: Multiple similar indexes suggested
**Solution:** Review and consolidate. One index can serve multiple query patterns.

---

## Future Index Considerations

### Potential Indexes (Post-Phase 10)
```
- risks + status + severity
- trainings + departmentId + status
- competencies + category + status
- compliance + standardId + score
```

These can be added based on actual usage patterns detected in Phase 8 (Dashboard).

---

## Documentation References

- [Firestore Indexes Official Docs](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [Composite Index Best Practices](https://firebase.google.com/docs/firestore/query-data/index-best-practices)
- [Firebase Pricing](https://firebase.google.com/pricing) - Index storage costs

---

## Next Steps

1. **This Phase (5/10):** 
   - Review this guide
   - Create HIGH PRIORITY indexes (1-4) in Firebase Console
   - Monitor for "Enabled" status

2. **Phase 6:** 
   - Create MEDIUM PRIORITY indexes (5-8)
   - Update service queries to use indexes

3. **Phase 7+:**
   - Create LOW PRIORITY indexes (9)
   - Optimize queries further
   - Consider collection restructuring

---

**Status:** Phase 5/10 - Ready for Firebase Console Implementation  
**Estimated Effort:** 1-2 hours total for all index creation  
**Estimated Benefit:** 20-40% reduction in read operations
