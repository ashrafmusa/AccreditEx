# RBAC Security Changelog — AccreditEx

**Date:** February 18, 2026  
**Audit Reference:** `RBAC_SECURITY_AUDIT_2026.md`  
**Status:** Implementation complete — requires key rotation (manual) and deploy

---

## Overview

This document records all security fixes applied to the AccreditEx RBAC system following the security audit conducted on February 18, 2026. Every change was designed for **zero-downtime backward compatibility** — existing users are automatically migrated on their next login.

---

## Changes Summary

| # | Finding | Severity | Fix Applied | Files Changed |
|---|---------|----------|-------------|---------------|
| C-1 | Auth UID / Doc ID mismatch | **CRITICAL** | Auto-migration on login + new user creation uses Auth UID | `firebaseHooks.ts`, `secureUserService.ts` |
| C-2 | addUser creates orphan docs | **CRITICAL** | New secure user creation creates Auth account + Firestore doc atomically | `secureUserService.ts`, `useUserStore.ts` |
| C-3 | Secrets in git history | **CRITICAL** | ⚠️ **MANUAL ACTION REQUIRED** — see instructions below | — |
| H-1 | UsersPage missing admin guard | **HIGH** | Added `isAdmin` ternary guard to SettingsLayout | `SettingsLayout.tsx` |
| H-2 | deleteUser no auth check | **HIGH** | Added admin + self-deletion checks | `useUserStore.ts` |
| H-3 | custom_roles missing rules | **HIGH** | Added `custom_roles` collection rules | `firestore.rules` |
| H-4 | Storage catch-all override | **HIGH** | Removed dangerous catch-all rule | `storage.rules` |
| M-1 | Audit log injection | **MEDIUM** | Restricted `settings_audit_logs` create to admin | `firestore.rules` |
| M-2 | Any user can update projects | **MEDIUM** | Restricted project update to `isAtLeastTeamMember()` | `firestore.rules` |

---

## Detailed Change Log

### 1. `src/services/secureUserService.ts` (NEW FILE)

**Purpose:** Replaces the old insecure user creation pattern with a service that:
- Creates a Firebase Auth account using a **secondary Firebase app instance** (so the admin stays logged in)
- Stores the Firestore document with the **Auth UID as the document ID** (fixing C-1)
- Sends a password reset email to the new user automatically
- Provides `migrateUserDocToAuthUid()` for on-login migration of legacy users

**Key Functions:**
| Function | Description |
|----------|-------------|
| `createUserSecurely(userData, callerRole)` | Creates Auth account + Firestore doc atomically |
| `migrateUserDocToAuthUid(legacyDocId, authUid)` | Atomic batch migration of a single user doc |
| `userDocExistsByUid(uid)` | Check if a correct UID-keyed doc exists |

**Why secondary Firebase app?**  
`createUserWithEmailAndPassword()` automatically signs in as the new user on the auth instance used. By creating a temporary secondary app, the admin user's session is unaffected.

---

### 2. `src/firebase/firebaseHooks.ts` (MODIFIED)

**What changed:** The `useFirebaseAuth` hook now uses a 3-step login flow:

```
Step 1: Try direct lookup by Auth UID → users/{auth.uid}
  ├── Found? → Log in immediately (fast path for new/migrated users)
  └── Not found? → Step 2

Step 2: Fallback email query → where("email", "==", auth.email)
  ├── Found with matching UID? → Log in (legacy but matching)
  ├── Found with different ID? → Step 3
  └── Not found? → Logout (data inconsistency)

Step 3: Auto-migrate document
  ├── Batch: create users/{auth.uid} + delete users/{legacy-id}
  ├── Re-read migrated doc → Log in successfully
  └── Migration failed? → Log in with legacy doc (degraded security)
```

**Backward Compatibility:** Existing users with `user-N` or `user-{timestamp}` IDs are automatically migrated on their next login. No manual data migration needed.

---

### 3. `src/stores/useUserStore.ts` (MODIFIED)

**Changes:**

| Function | Before | After |
|----------|--------|-------|
| `addUser` | `setDoc(doc(users, 'user-' + Date.now()))` — no Auth account, no admin check | Uses `createUserSecurely()` — creates Auth account + UID-keyed doc, requires Admin role |
| `deleteUser` | Raw `deleteDoc()` with no authorization | Checks `currentUser.role === 'Admin'` + prevents self-deletion |

**Import added:** `import { createUserSecurely } from '@/services/secureUserService'`

---

### 4. `src/components/settings/SettingsLayout.tsx` (MODIFIED)

**Change:** Line 238-239

```tsx
// BEFORE (vulnerable — no admin guard):
case "users":
  return <UsersPage setNavigation={setNavigation} />;

// AFTER (secured):
case "users":
  return isAdmin ? <UsersPage setNavigation={setNavigation} /> : <ProfileSettingsPage />;
```

**Impact:** Non-admin users who somehow navigate to `section: "users"` (e.g. via URL manipulation or DevTools) now see `ProfileSettingsPage` instead of the full user management panel.

---

### 5. `firestore.rules` (MODIFIED)

**Changes:**

| Area | Before | After | Why |
|------|--------|-------|-----|
| `getUserRole()` | Only Firestore lookup: `get(/users/{auth.uid})` | Checks Custom Claims first (`request.auth.token.role`), falls back to Firestore | Future-proofs for Custom Claims; Firestore lookup works now that docs use Auth UIDs |
| `users` create | `isAdmin()` only | `isAdmin() \|\| isOwner(userId)` | Allows the migration batch to create a doc keyed by the user's own UID |
| `users` update | `isAuthenticated() && cannotEscalatePrivilege()` | `(isOwner(userId) \|\| isAdmin()) && cannotEscalatePrivilege()` | More explicit ownership check |
| `projects` update | `isAuthenticated()` (any user!) | `isAtLeastTeamMember()` | Viewers can no longer modify projects |
| `settings_audit_logs` create | `isAuthenticated()` (any user!) | `isAdmin()` | Prevents audit log injection |
| `custom_roles` | **Missing entirely** | Read: authenticated, write: admin | Collection was unprotected |
| `device_sessions` | **Missing** | Read/write: authenticated, delete: admin or owner | For session tracking |
| `user_activity_logs` | **Missing** | Read: admin, create: authenticated, update/delete: false | Append-only activity log |
| New helper | — | `isAtLeastTeamMember()` | Recognizes all active roles except Viewer |
| New helper | — | `isOwner(userId)` | Checks `request.auth.uid == userId` |

---

### 6. `storage.rules` (MODIFIED)

**Changes:**

| Area | Before | After | Why |
|------|--------|-------|-----|
| `getUserRole()` | Only Firestore lookup | Checks Custom Claims first, Firestore fallback | Matches firestore.rules pattern |
| Catch-all `/documents/{allPaths=**}` | `allow write: if isAuthenticated()` | **REMOVED** | Was overriding all restrictive rules above it |

**Impact:** Files that don't match any specific rule pattern (`/documents/programs/`, `/documents/standards/`, etc.) are now **denied by default**. If you have files stored in non-standard paths under `/documents/`, you may need to add specific rules for them.

---

## Manual Actions Required

### ⚠️ C-3: Rotate Secrets (CRITICAL — Do Immediately)

The service account key and `.env` files were previously committed to git. Even though they're now in `.gitignore`, they remain in git history.

**Step 1: Rotate the service account key**
1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Delete the old key from the console
4. Replace `serviceAccountKey.json` with the new key

**Step 2: Purge git history**
```bash
# Option A: Using BFG Repo-Cleaner (recommended)
bfg --delete-files serviceAccountKey.json
bfg --delete-files .env
bfg --delete-files .env.development
bfg --delete-files .env.production
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Option B: Using git filter-repo
git filter-repo --path serviceAccountKey.json --invert-paths
git filter-repo --path .env --invert-paths
```

**Step 3: Enable Firebase App Check** (recommended)
```bash
# In Firebase Console → App Check → Register your app
# This adds an additional layer of client validation
```

### Deploy Firestore & Storage Rules
```bash
# Deploy updated rules to Firebase
firebase deploy --only firestore:rules,storage
```

---

## Migration Behavior

### How Legacy Users Are Migrated

When a user with a legacy document ID (e.g., `user-5`) logs in after this fix:

1. `onAuthStateChanged` fires with their Firebase Auth UID
2. Direct lookup at `users/{authUID}` → **miss** (legacy doc has different ID)
3. Email query finds their legacy document at `users/user-5`
4. `migrateUserDocToAuthUid('user-5', authUID)` runs atomically:
   - Creates `users/{authUID}` with all data + `_migratedFrom: "user-5"`
   - Deletes `users/user-5`
5. User is logged in with the new UID-keyed document
6. All subsequent logins use the fast path (step 2 → hit)

### Data Preserved During Migration
- All user fields (name, email, role, department, etc.)
- Added metadata: `_migratedFrom`, `_migratedAt`, `updatedAt`

### What If Migration Fails?
- User is still logged in with the legacy document (degraded but functional)
- Client-side role checks still work
- Server-side Firestore rules may not enforce role checks correctly
- Migration retries automatically on next login

---

## Testing Checklist

| Test Case | Expected Result | Status |
|-----------|----------------|--------|
| Admin creates new user | Auth account created + Firestore doc keyed by UID + password reset email sent | ☐ |
| Non-admin tries to create user | Error: "Only administrators can create new users" | ☐ |
| Legacy user logs in for first time after fix | Document silently migrated from `user-N` to Auth UID | ☐ |
| Already-migrated user logs in | Fast path — direct UID lookup, no migration needed | ☐ |
| Non-admin navigates to Settings → Users | Sees ProfileSettingsPage, not UsersPage | ☐ |
| Non-admin tries to delete a user | Error: "Only administrators can delete users" | ☐ |
| Admin tries to delete themselves | Error: "You cannot delete your own account" | ☐ |
| Non-admin tries to write to `standards` | Blocked by Firestore rules (isAdmin check) | ☐ |
| Any user tries to write to `/documents/programs/` in Storage | Blocked (admin-only, catch-all removed) | ☐ |
| Viewer tries to update a project | Blocked by Firestore rules (isAtLeastTeamMember) | ☐ |
| Non-admin tries to create audit log entry | Blocked by Firestore rules (isAdmin) | ☐ |
| Custom Claims set on user | Rules use token.role instead of Firestore lookup | ☐ |

---

## Future Recommendations

1. **Set Firebase Custom Claims** — Use Cloud Functions or Admin SDK to set `{ role: 'Admin' }` as custom claims on user tokens. This is faster and more reliable than the Firestore document lookup.

2. **Implement Centralized Permission Service** — Replace scattered `isAdmin` checks with `PermissionService.can(user, action, resource)` using the custom roles system that already exists in `customRolesService.ts`.

3. **Audit Trail Enhancement** — Move audit log creation to Cloud Functions (triggered by Firestore writes) so it can't be manipulated by client-side code.

4. **Implement Viewer Role** — The `Viewer` role exists in the type system but has no enforcement. Consider adding read-only checks throughout the UI.

5. **Add Rate Limiting** — Firebase App Check + Cloud Functions can rate-limit user creation and other sensitive operations.

---

*Generated: February 18, 2026*
