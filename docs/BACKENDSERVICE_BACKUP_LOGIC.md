# BackendService Legacy Logic - Documentation & Backup
**Date:** December 2, 2025  
**Status:** Deprecated - Replaced with Firebase Services

## Overview

The `BackendService` was originally implemented as a localStorage-based mock backend to simulate database operations during development. It has now been replaced with Firebase services for production-ready data persistence.

## Key Methods & Their Replacements

### Users Management
```typescript
// OLD (BackendService - localStorage)
async getUsers(): Promise<User[]>
async createUser(userData: any): Promise<User>
async updateUser(user: User): Promise<User>
async deleteUser(userId: string): Promise<void>

// NEW (userService - Firebase)
import { getAllUsers, createUser, updateUser, deleteUser } from '@/services/userService'
```

### Projects Management
```typescript
// OLD (BackendService)
async getProjects(): Promise<Project[]>
async createProject(projectData: any): Promise<Project>
async updateProject(project: Project): Promise<Project>
async deleteProject(projectId: string): Promise<void>

// NEW (projectService - Firebase)
import { getAllProjects, createProject, updateProject, deleteProject } from '@/services/projectService'
```

### Documents Management
```typescript
// OLD (BackendService)
async getDocuments(): Promise<AppDocument[]>
async createDocument(doc: any): Promise<AppDocument>
async updateDocument(doc: AppDocument): Promise<AppDocument>
async deleteDocument(docId: string): Promise<void>

// NEW (documentService - Firebase)
import { getAllDocuments, createDocument, updateDocument, deleteDocument } from '@/services/documentService'
```

### Application Settings
```typescript
// OLD (BackendService)
async getAppSettings(): Promise<AppSettings>
async updateAppSettings(settings: AppSettings): Promise<AppSettings>

// NEW (appSettingsService - Firebase)
import { getAppSettings, updateAppSettings } from '@/services/appSettingsService'
```

### Notifications
```typescript
// OLD (BackendService)
async getNotifications(userId: string): Promise<Notification[]>
async markNotificationAsRead(userId: string, notificationId: string): Promise<void>
async markAllNotificationsAsRead(userId: string): Promise<void>

// NEW (appSettingsService or custom - Firebase Realtime)
// Implement real-time notification listeners via Firestore
```

## Data Flow Change

### Before (localStorage mock):
```
Component 
  ↓ 
Store (useUserStore, useAppStore)
  ↓
BackendService (localStorage)
  ↓
JavaScript memory
```

### After (Firebase):
```
Component 
  ↓ 
Store (useUserStore, useAppStore)
  ↓
Service Layer (userService, projectService, etc.)
  ↓
Firebase SDK
  ↓
Firestore Database (Cloud)
```

## Deprecated Methods

The following methods from BackendService.ts should NOT be used anymore:

1. `backendService.getUsers()` → Use Firebase userService
2. `backendService.getProjects()` → Use Firebase projectService
3. `backendService.getDocuments()` → Use Firebase documentService
4. `backendService.getAllData()` → Fetch specific data from respective services
5. `backendService.getAppSettings()` → Use Firebase appSettingsService

## Migration Checklist

- [x] Document BackendService logic (this file)
- [ ] Migrate useUserStore
- [ ] Migrate useAppStore
- [ ] Migrate userStore (if still in use)
- [ ] Update App.tsx to remove BackendService.initialize()
- [ ] Remove BackendService.ts file
- [ ] Remove BackendService.tsx file
- [ ] Remove initialData.ts imports
- [ ] Test all data operations work correctly with Firebase

## File References

**Files using BackendService (to be updated):**
- `stores/useUserStore.ts` - Import: line 7
- `stores/useAppStore.ts` - Import: line 7
- `stores/userStore.ts` - Import: line 3
- `App.tsx` - Import: line 5, Usage: line 60

**Files to be deleted:**
- `services/BackendService.ts` (412 lines)
- `services/BackendService.tsx` (unclear usage)

**Firebase Services (to use instead):**
- `services/userService.ts`
- `services/projectService.ts`
- `services/documentService.ts`
- `services/appSettingsService.ts`
- `services/trainingProgramService.ts`
- `services/competencyService.ts`
- `services/standardService.ts`
- And 15+ other domain-specific services

## Notes

- All localStorage data should have been migrated to Firestore
- Firestore Rules (firestore.rules) provide access control
- Real-time listeners should be used for reactive updates
- No initialization needed anymore (Firestore handles it)

## Questions?

Refer to the individual service files for their specific API contracts and Firebase integration details.

---
**Deprecated:** December 2, 2025  
**Replacement:** Firebase Services Pattern  
**Status:** In Progress - Stores migration ongoing
