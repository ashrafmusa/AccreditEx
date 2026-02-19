# AccreditEx — RBAC & Authorization Security Audit Report

**Date:** February 18, 2026  
**Last Updated:** February 19, 2026  
**Audit Agents Used:** Security Auditor, Penetration Tester, Backend Specialist, Database Architect  
**Methodology:** OWASP Top 10:2025 (A01 Broken Access Control, A02 Security Misconfiguration, A04 Cryptographic Failures, A06 Insecure Design, A07 Authentication Failures)  
**Scope:** Complete Role-Based Access Control system, Firestore/Storage security rules, client-side authorization, user management

---

## Executive Summary

The AccreditEx RBAC system contains **3 CRITICAL**, **4 HIGH**, and **3 MEDIUM** severity vulnerabilities. The most severe issue is a **fundamental architectural flaw** where Firestore security rules reference Firebase Auth UIDs (`request.auth.uid`) to look up user roles, but user documents are stored with custom IDs (`user-{timestamp}`), causing **all role-based server-side security rules to silently fail**. This renders the entire Firestore RBAC enforcement decorative.

| Severity | Count | Status |
|----------|-------|--------|
| **CRITICAL** | 3 | ⚠️ Requires immediate remediation — no fixes applied yet |
| **HIGH** | 4 | ⚠️ Requires urgent remediation — no fixes applied yet |
| **MEDIUM** | 3 | Should be addressed in next sprint |

> **⚠️ Update (Feb 19, 2026):** All P0 feature gaps have been closed (Quality Rounding, Near-Miss, Trending, Performance Eval, Audit Log). Navigation consolidated from 17→12 sidebar items. Additionally, all P1 (10/10) and P2 (6/7) roadmap features are now implemented and deployed, including Lab Operations (5-tab hub), Knowledge Base, CAP Assessment, LIMS Integration, QC Data Import, Tracer Worksheets, and more. NavigationView now has **25 values** (not 23 as noted below). SettingsSection now has **19 values** (including `limsIntegration`, `departments`). **For RBAC security remediation status, see `RBAC_SECURITY_CHANGELOG.md`** which documents 9 fixes applied (C-1, C-2, H-1 through H-4, M-1, M-2). C-3 (secret rotation) still requires manual action. All changes deployed to https://accreditex.web.app on Feb 19, 2026.

---

## Architecture Overview

### Tech Stack
- **Frontend:** React + TypeScript (Vite)
- **Auth:** Firebase Authentication (email/password)
- **Database:** Cloud Firestore
- **Storage:** Firebase Cloud Storage
- **State:** Zustand stores (no Redux/Context for auth)

### Defined Roles
| Role | Intended Access Level |
|------|----------------------|
| `Admin` | Full system access |
| `ProjectLead` | Project management + training programs |
| `TeamMember` | Assigned tasks + limited document creation |
| `Auditor` | Read access + audit-specific functions |
| `Viewer` | Read-only (defined but **never implemented**) |

### Authorization Layers
| Layer | Implementation | Effectiveness |
|-------|---------------|--------------|
| **Firestore Rules** (server-side) | `getUserRole()` via Auth UID lookup | **BROKEN** — UID mismatch |
| **Storage Rules** (server-side) | Same `getUserRole()` pattern | **BROKEN** — same issue |
| **Client-side route guards** | `MainRouter.tsx` useEffect | Bypassable via DevTools |
| **Client-side component guards** | `useAdminGuard` + inline checks | Bypassable via DevTools |
| **Client-side store checks** | `updateUser` in useUserStore | Bypassable via DevTools |

> **Codebase Update (Feb 19):** `NavigationView` type now has **25 values** (was 32 at initial audit, cleaned to 23, then expanded to 25 with new P2 features). New views added: `knowledgeBase`, `labOperations`. Dead views removed (`risk`, `accreditation`, `projectOverview`, `users`, `analytics`, `qualityInsights`, `reports`, `myTasks`, `competencies`, `aiDocumentGenerator`). Consolidated views added (`analyticsHub`). Full URL routing implemented via React Router DOM 7.13.0 with 34 routes (28 primary + 6 legacy redirects). 7 Zustand stores (up from 3). Admin-only views in `MainRouter.tsx` still enforced client-side only.

---

## CRITICAL Findings

### C-1: Firebase Auth UID / Firestore Document ID Mismatch (OWASP A01)

**Severity: CRITICAL** | **CVSS: 9.8** | **Impact: Total RBAC Bypass**

The entire server-side security model is fundamentally broken.

**Root Cause:**
- `firestore.rules` line 11: `getUserRole()` calls `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role`
- `useUserStore.ts` line 80: `addUser()` creates documents with ID `user-${Date.now()}`
- `firebaseHooks.ts` line 20: User lookup is by **email query**, not by Auth UID

**Evidence from `users.json`:**
```
"id": "0is3JQoMjSbnSKUrIdEY5HeYGyu1"  ← Only 1 user has Auth UID format
"id": "user-2"                          ← 11 users have custom IDs
"id": "user-3" ... "user-12"
```

**Impact:**
- `isAdmin()` → **always returns false** for users with custom IDs
- `isProjectLead()` → **always returns false** for users with custom IDs
- All `allow write: if isAdmin()` rules → **deny even real admins**
- All `allow read/write: if isAuthenticated()` rules → **still work for everyone**
- Net effect: Any authenticated user has equal access to all `isAuthenticated()`-gated operations; nobody has admin-level write access via Firestore rules

**Affected Files:**
- `firestore.rules` — line 11 (`getUserRole`)
- `storage.rules` — line 11 (identical `getUserRole`)
- `src/stores/useUserStore.ts` — line 80 (`addUser`)
- `src/firebase/firebaseHooks.ts` — line 20 (email-based lookup)

**Remediation:**
```typescript
// BEFORE (broken):
const userId = `user-${Date.now()}`;
await setDoc(doc(usersRef, userId), { ...userData, id: userId });

// AFTER (fixed): Use Firebase Auth UID as document ID
import { getAuthInstance } from '@/firebase/firebaseConfig';
const auth = getAuthInstance();
const userRecord = await createUserWithEmailAndPassword(auth, email, password);
const userId = userRecord.user.uid;
await setDoc(doc(db, 'users', userId), { ...userData, id: userId });
```

Additionally, migrate all existing user documents to use Auth UIDs as document IDs.

---

### C-2: `addUser` Creates Orphan Firestore Documents Without Auth Accounts (OWASP A07)

**Severity: CRITICAL** | **Impact: Broken User Lifecycle**

**Location:** `src/stores/useUserStore.ts` lines 78-87

```typescript
addUser: async (userData) => {
    const usersRef = collection(db, 'users');
    const userId = `user-${Date.now()}`;
    await setDoc(doc(usersRef, userId), { ...userData, id: userId });
    // ❌ No Firebase Auth account created
    // ❌ No password set
    // ❌ No email verification
}
```

**Impact:**
- Users created via `addUser` cannot log in (no Auth credentials)
- Their Firestore documents are orphans that break `getUserRole()` lookups
- Any role assigned is meaningless since Firestore rules can't resolve their UID
- No authorization check — calling code can create Admin-role users

**Remediation:** Use Firebase Admin SDK via Cloud Functions to atomically create both Auth accounts and Firestore documents.

---

### C-3: Service Account Key & Secrets Exposed in Git History (OWASP A04)

**Severity: CRITICAL** | **CVSS: 9.1** | **Impact: Full Backend Compromise**

**Files:**
- `serviceAccountKey.json` — Contains full RSA private key for `firebase-adminsdk-fbsvc@accreditex-79c08.iam.gserviceaccount.com`
- `.env`, `.env.development`, `.env.production` — Firebase API keys and project config

While these are currently in `.gitignore`, git history confirms they were previously committed:
```
059ec74 Initial commit: Fresh AccreditEx application (Secured)
784fa8b security: Remove .env from git tracking
```

**Impact:** Anyone with repository read access can extract the service account key from git history, granting **full administrative access** to all Firebase services (Firestore, Auth, Storage, Cloud Functions).

**Remediation:**
1. **Immediately rotate** the service account key in Firebase Console
2. Purge git history using `git filter-repo` or BFG Repo-Cleaner
3. Invalidate all existing Firebase API keys and generate new ones
4. Enable Firebase App Check for additional client validation

---

## HIGH Findings

### H-1: `addUser` Called Without Admin Verification (OWASP A01)

**Severity: HIGH** | **Impact: Unauthorized User Creation**

**Location:** `src/pages/UsersPage.tsx` line 73 and `src/components/settings/SettingsLayout.tsx` line 239

```tsx
// SettingsLayout.tsx - line 238-239
case "users":
  return <UsersPage setNavigation={setNavigation} />;  // ❌ No isAdmin guard!

// Compare with other sections that DO check:
case "security":
  return isAdmin ? <SecuritySettingsPage /> : <ProfileSettingsPage />;
```

The "Users" nav item is hidden from non-admins, but the **render case** doesn't enforce admin access. If a non-admin manipulates the navigation state to reach `section: "users"`, they get full access to user management without any admin guard.

**Remediation:**
```tsx
case "users":
  return isAdmin ? <UsersPage setNavigation={setNavigation} /> : <ProfileSettingsPage />;
```

---

### H-2: `deleteUser` Has No Client-Side Authorization Check (OWASP A01)

**Severity: HIGH** | **Impact: Unauthorized User Deletion**

**Location:** `src/stores/useUserStore.ts` lines 113-120

```typescript
deleteUser: async (userId) => {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);  // ❌ No role check at all
}
```

No admin check before attempting deletion. The Firestore rule (`allow delete: if isAdmin()`) would normally block this, but due to C-1 (UID mismatch), `isAdmin()` **always returns false**, so it accidentally blocks everyone — but for the wrong reason.

**Remediation:** Add explicit admin check:
```typescript
deleteUser: async (userId) => {
    const currentUser = get().currentUser;
    if (!currentUser || currentUser.role !== 'Admin') {
        throw new AppError('Only admins can delete users', 'UNAUTHORIZED');
    }
    // ... proceed with deletion
}
```

---

### H-3: `custom_roles` Collection Has No Firestore Security Rules (OWASP A02)

**Severity: HIGH** | **Impact: Unprotected Collection**

**Location:** `firestore.rules` (missing), `src/services/customRolesService.ts` line 5

The `customRolesService.ts` writes to collection `custom_roles`, but there is **no matching `match` block** in `firestore.rules`. Under Firestore's default behavior, unmatched collections deny all access.

Currently the custom roles system is dead code (no component imports it), but if wired up:
- All CRUD operations will silently fail at Firestore level
- This represents an incomplete feature that was never security-reviewed

**Remediation:** Add to `firestore.rules`:
```
match /custom_roles/{roleId} {
  allow read: if isAuthenticated();
  allow create, update, delete: if isAdmin();
}
```

---

### H-4: Storage Rules Catch-All Overrides Restrictive Rules (OWASP A01)

**Severity: HIGH** | **Impact: Storage Access Control Bypass**

**Location:** `storage.rules` lines 56-60

```
// This catch-all matches everything under /documents/:
match /documents/{allPaths=**} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated();   // ❌ Overrides ALL restrictions above
  allow delete: if isAdmin();
}
```

In Firebase Storage, if **any** matching rule allows access, access is granted. This catch-all allows any authenticated user to write to:
- `/documents/programs/**` — supposed to be **admin-only write**
- `/documents/standards/**` — supposed to be **admin-only write**  
- `/documents/users/{userId}/**` — supposed to be **owner-or-admin only**
- `/documents/projects/**` — supposed to be **admin/lead only**

**Remediation:** Remove the catch-all or restructure the storage paths:
```
// Remove this:
match /documents/{allPaths=**} { ... }

// Add explicit rules for remaining paths only
```

---

## MEDIUM Findings

### M-1: Any Authenticated User Can Inject Fake Audit Log Entries (OWASP A09)

**Severity: MEDIUM** | **Impact: Audit Trail Integrity**

**Location:** `firestore.rules` lines 124-128

```
match /settings_audit_logs/{docId} {
  allow read: if isAdmin();
  allow create: if isAuthenticated();   // ❌ Any user can write
  allow update: if false;
  allow delete: if false;
}
```

Any authenticated user can write arbitrary audit log entries, enabling:
- Audit trail flooding/noise injection
- Fake entries to frame other users
- Misleading compliance evidence

**Remediation:** Restrict creation to admin or use Cloud Functions for audit logging:
```
allow create: if isAdmin();
```

---

### M-2: Any Authenticated User Can Update Any Project (OWASP A01)

**Severity: MEDIUM** | **Impact: Unauthorized Data Modification**

**Location:** `firestore.rules` line 61

```
match /projects/{projectId} {
  allow update: if isAuthenticated();   // ❌ No ownership/membership check
}
```

Any logged-in user can modify any project's name, dates, status, team assignments — regardless of whether they're assigned to the project.

**Remediation:** Add ownership/membership validation:
```
allow update: if isAuthenticated() && (
  isProjectLead() || 
  resource.data.teamMembers.hasAny([request.auth.uid])
);
```

---

### M-3: `Viewer` Role Defined But Never Implemented (OWASP A06)

**Severity: MEDIUM** | **Impact: Incomplete RBAC Design**

**Location:** `src/types/index.ts` line 70

The `Viewer` role is defined in `UserRole` but:
- No component checks for it
- No Firestore rule references it
- No route or UI adjustment handles it
- `getDefaultPermissionsForRole()` in `customRolesService.ts` has no case for `Viewer`
- A user assigned `Viewer` role gets the same access as `TeamMember` (falls through to the "authenticated" rules)

**Remediation:** Either implement `Viewer` restrictions (read-only enforcement) or remove the role from the enum to avoid confusion.

---

## Authorization Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CURRENT AUTHORIZATION FLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Login (Firebase Auth)                                         │
│       │                                                             │
│       ▼                                                             │
│  onAuthStateChanged fires                                           │
│       │                                                             │
│       ▼                                                             │
│  Fetch user doc BY EMAIL QUERY  ←── ⚠️ Not by Auth UID             │
│       │                                                             │
│       ▼                                                             │
│  Set currentUser in Zustand store (with custom ID like "user-5")    │
│       │                                                             │
│       ├──→ CLIENT-SIDE: MainRouter checks currentUser.role          │
│       │    ├── Admin? → Allow all views                             │
│       │    └── Other? → Block admin views (bypassable!)             │
│       │                                                             │
│       ├──→ CLIENT-SIDE: useAdminGuard / inline isAdmin checks       │
│       │    └── Comparison against currentUser.role (bypassable!)    │
│       │                                                             │
│       └──→ SERVER-SIDE (Firestore Rules):                           │
│            getUserRole() → get(users/AUTH_UID)                      │
│                              │                                      │
│                              ▼                                      │
│            Document ID = "user-5" ≠ Auth UID                        │
│            → getUserRole() returns NULL                             │
│            → isAdmin() = false ← ❌ ALWAYS FALSE                   │
│            → isProjectLead() = false ← ❌ ALWAYS FALSE             │
│            → Only isAuthenticated() works correctly                 │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════     │
│  RESULT: Server-side RBAC is DECORATIVE. All role-gated writes      │
│  are denied for everyone. All authenticated-gated operations are    │
│  open to everyone. Client-side checks are the ONLY working layer.   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Remediation Priority Matrix

| Priority | Finding | Effort | Impact | Status |
|----------|---------|--------|--------|--------|
| **P0 — Immediate** | C-3: Rotate exposed secrets | Low | Prevents full backend compromise | ❌ Open |
| **P0 — Immediate** | C-1: Fix UID mismatch | High | Restores entire server-side RBAC | ❌ Open |
| **P1 — This Sprint** | C-2: Fix user creation flow | Medium | Proper user lifecycle | ❌ Open |
| **P1 — This Sprint** | H-4: Fix storage catch-all | Low | Correct file access controls | ❌ Open |
| **P1 — This Sprint** | H-1: Add admin guard to UsersPage | Low | Close navigation bypass | ❌ Open |
| **P2 — Next Sprint** | H-2: Add deleteUser admin check | Low | Defense in depth | ❌ Open |
| **P2 — Next Sprint** | H-3: Add custom_roles rules | Low | Protect future feature | ❌ Open |
| **P2 — Next Sprint** | M-1: Restrict audit log writes | Low | Audit trail integrity | ❌ Open |
| **P3 — Backlog** | M-2: Project update ownership | Medium | Granular access control | ❌ Open |
| **P3 — Backlog** | M-3: Implement Viewer role | Medium | Complete RBAC model | ❌ Open |

> **Note (Feb 19):** `SettingsLayout.tsx` was modified to add `departments` section. The H-1 vulnerability (users section without admin guard) remains — `departments` was correctly added with `adminOnly: true` nav item but the render case follows the same pattern. Both `users` and `departments` render cases should enforce `isAdmin` at the render level.

---

## Recommended Architecture Changes

### 1. Fix User Document ID Strategy
```typescript
// In a Cloud Function (server-side):
exports.createUser = functions.https.onCall(async (data, context) => {
  // Verify caller is admin
  const callerDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();
  if (callerDoc.data()?.role !== 'Admin') throw new Error('Unauthorized');
  
  // Create Auth user
  const userRecord = await admin.auth().createUser({
    email: data.email,
    password: data.temporaryPassword,
  });
  
  // Create Firestore doc with Auth UID as document ID
  await admin.firestore().doc(`users/${userRecord.uid}`).set({
    ...data,
    id: userRecord.uid,
  });
});
```

### 2. Implement Centralized Permission Service
```typescript
// Replace scattered isAdmin checks with centralized service:
export class PermissionService {
  static can(user: User, action: string, resource: string): boolean {
    const rolePermissions = getDefaultPermissionsForRole(user.role);
    return rolePermissions.some(
      p => p.resource === resource && p.action === action && p.granted
    );
  }
}

// Usage:
if (PermissionService.can(currentUser, 'delete', 'users')) { ... }
```

### 3. Add Firebase Custom Claims for Server-Side Role Checks
```typescript
// In Cloud Function:
await admin.auth().setCustomUserClaims(uid, { role: 'Admin' });

// In Firestore rules (more reliable than document lookups):
function getUserRole() {
  return request.auth.token.role;
}
```

---

## Compliance Impact

| Standard | Status | Gap |
|----------|--------|-----|
| **OWASP A01** (Broken Access Control) | ❌ FAIL | UID mismatch breaks all server-side controls |
| **OWASP A02** (Security Misconfiguration) | ❌ FAIL | Missing rules for custom_roles, catch-all storage override |
| **OWASP A04** (Cryptographic Failures) | ❌ FAIL | Service account key in git history |
| **OWASP A06** (Insecure Design) | ⚠️ PARTIAL | Viewer role unimplemented, no centralized permission service |
| **OWASP A07** (Authentication Failures) | ⚠️ PARTIAL | addUser doesn't create Auth accounts |
| **OWASP A09** (Logging & Monitoring) | ⚠️ PARTIAL | Audit log injection possible |
| **SOC 2 Type II** | ❌ FAIL | Access controls not enforced at infrastructure level |
| **HIPAA (if applicable)** | ❌ FAIL | PHI access not properly restricted |

---

## Summary

The AccreditEx application has a well-designed RBAC **concept** with 5 roles, custom permissions, admin guards, and Firestore security rules. However, the **implementation** has a critical architectural flaw: user documents are stored with custom IDs while Firestore rules look up roles using Firebase Auth UIDs. This single defect cascades into a complete server-side RBAC failure, making the entire security rules layer ineffective.

Client-side checks (MainRouter, useAdminGuard, inline role comparisons) provide a thin layer of protection but are trivially bypassable via browser DevTools. The exposed service account key in git history compounds the risk, potentially allowing anyone with repo access to bypass all security measures entirely.

**Immediate action required:** Rotate secrets, fix UID alignment, and implement server-side role enforcement via Firebase Custom Claims.

---

*Report generated by AccreditEx Security Audit Pipeline*  
*Agents: Security Auditor + Penetration Tester + Backend Specialist + Database Architect*
