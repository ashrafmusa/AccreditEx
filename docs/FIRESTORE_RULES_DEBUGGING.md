# Firestore Security Rules — Import Permission Denied (Resolved)

**Date:** February 16, 2026  
**Affected:** All Firestore write operations using `isValidSize()` rule function  
**Symptom:** `PERMISSION_DENIED` on `addDoc` for collections like `accreditationPrograms`, `standards`, `departments`, etc.  
**Impact:** Program import (and all batch imports) silently hung instead of completing or rejecting.

---

## Root Cause

The `isValidSize()` helper function in `firestore.rules` used an **invalid property** — `request.resource.size`:

```javascript
// ❌ BROKEN — request.resource.size does NOT exist in Firestore rules
function isValidSize(data) {
  return request.resource.size < 15000000;
}
```

### Why it failed

1. **`request.resource.size` is not a valid Firestore rules property.** Firestore documents don't expose a `.size` property on the resource object. Only Cloud Storage rules have `request.resource.size`. In Firestore, `size()` is a method on strings, lists, and maps — not a property on the resource itself.

2. **The function parameter `data` was declared but never used** (the body referenced `request.resource.size` instead). The Firestore rules compiler warned `"Unused variable: data"` but still compiled. At evaluation time, the invalid property access caused the function to return a non-boolean/error, which Firestore treats as `false` → **PERMISSION_DENIED**.

3. **Every collection that included `&& isValidSize()` in its rules was blocked:** `accreditationPrograms`, `standards`, `departments`, `competencies`, `trainingPrograms`, `risks`, `auditFindings`, and `projects` (on create).

4. **Collections without `isValidSize()` worked fine:** `appSettings` (`isAdmin()` only), `documents` (`isAuthenticated()` only), `users`.

---

## Why It Was Hard to Debug

Firebase client SDK with **IndexedDB persistence** (`enableIndexedDbPersistence`) causes `addDoc()` to **hang indefinitely** instead of rejecting when a write is denied by security rules. The promise never settles — no error, no rejection, no timeout. This made it appear as if the write was "in progress forever" rather than explicitly denied.

**Workaround used during debugging:**
```typescript
const writePromise = addDoc(colRef, data);
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("Firebase write timed out — likely permission error")), 15000)
);
await Promise.race([writePromise, timeoutPromise]);
```

---

## Debugging Steps (for future reference)

### 1. Add timeout wrapper to detect hanging writes
Wrap `addDoc` with `Promise.race` + timeout to detect if the promise never settles.

### 2. Use CLI with client SDK to isolate rule functions
Create a Node.js script that:
- Uses `firebase-admin` to generate a custom token for a known user
- Uses `firebase` client SDK to `signInWithCustomToken` and attempt writes
- Tests collections with **different rule combinations** to isolate which function fails

### 3. Isolation test pattern
```
Collection A (isAuthenticated only)         → WORKS  ✅
Collection B (isAdmin only)                 → WORKS  ✅
Collection C (isAdmin + isValidSize)        → FAILS  ❌
```
This proves `isValidSize()` is the broken function, not `isAdmin()`.

### 4. Check the Firestore rules compiler warnings
```
firebase deploy --only firestore:rules
```
Warnings like `"Unused variable: data"` are strong hints that a function parameter isn't being used as intended.

---

## The Fix

**Removed `isValidSize()` entirely.** Firestore already enforces a **1 MB maximum document size** at the platform level — a custom size check in rules is unnecessary (and was using an invalid API anyway).

### Before
```javascript
function isValidSize(data) {
  return request.resource.size < 15000000; // INVALID
}

match /accreditationPrograms/{docId} {
  allow create, update: if isAdmin() && isValidSize(request.resource.data);
}
```

### After
```javascript
// Note: Firestore enforces 1MB document size limit automatically

match /accreditationPrograms/{docId} {
  allow create, update: if isAdmin();
}
```

Applied to all 11 collection rules that referenced `isValidSize()`.

---

## Key Lessons

| Lesson | Detail |
|--------|--------|
| **`request.resource.size` doesn't exist in Firestore rules** | It's a Cloud Storage rules property. Firestore docs have no `.size` on the resource. |
| **Firestore rules fail closed** | Any error/invalid expression in a rule evaluates to `false` (deny). No runtime error is surfaced to the client. |
| **IndexedDB persistence hides permission errors** | With persistence enabled, `addDoc` hangs instead of rejecting on `PERMISSION_DENIED`. |
| **Compiler warnings matter** | `"Unused variable"` warned that the function parameter wasn't used — a direct clue to the bug. |
| **Isolate rule functions by testing collections** | Compare collections with different rule combinations to pinpoint which function fails. |
| **Firestore enforces 1MB limit automatically** | No need for custom size validation in rules — the platform rejects oversized documents. |

---

## Files Changed

| File | Change |
|------|--------|
| `firestore.rules` | Removed `isValidSize()` function and all 11 call sites |
| `src/pages/AccreditationHubPage.tsx` | Removed debug imports (`auth`, `db`, `collection`, `addDoc`), reverted `handleImportPrograms` to use store's `addProgram()` |
