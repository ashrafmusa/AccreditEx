import { db, getAuthInstance } from '@/firebase/firebaseConfig';
import { migrateUserDocToAuthUid } from '@/services/secureUserService';
import { useTenantStore } from '@/stores/useTenantStore';
import { useUserStore } from '@/stores/useUserStore';
import { User, UserRole } from '@/types';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { useEffect } from 'react';

export function useFirebaseAuth() {
  const setCurrentUser = useUserStore(state => state.setCurrentUser);
  const logout = useUserStore(state => state.logout);

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        try {
          // ============================================================
          // STEP 1: Try direct lookup by Auth UID (fast path for new/migrated users)
          // ============================================================
          const uidDocRef = doc(db, 'users', firebaseUser.uid);
          const uidDocSnap = await getDoc(uidDocRef);

          if (uidDocSnap.exists()) {
            // User document is correctly keyed by Auth UID
            const userData = { ...uidDocSnap.data(), id: uidDocSnap.id } as User;
            setCurrentUser(userData);
            useTenantStore.getState().loadOrganizationForUser(userData.organizationId);
            return;
          }

          // ============================================================
          // STEP 2: Fallback — query by email (legacy users with custom IDs)
          // ============================================================
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where("email", "==", firebaseUser.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const legacyDocId = userDoc.id;
            const userData = { ...userDoc.data(), id: legacyDocId } as User;

            // ============================================================
            if (legacyDocId !== firebaseUser.uid) {
              console.info(
                `[Auth] Migrating user doc from ${legacyDocId} to ${firebaseUser.uid} for ${firebaseUser.email}`
              );

              try {
                const migrated = await migrateUserDocToAuthUid(legacyDocId, firebaseUser.uid);

                if (migrated) {
                  // Re-read the migrated document with the correct UID-based ID
                  const migratedDocRef = doc(db, 'users', firebaseUser.uid);
                  const migratedDocSnap = await getDoc(migratedDocRef);

                  if (migratedDocSnap.exists()) {
                    const migratedUser = { ...migratedDocSnap.data(), id: migratedDocSnap.id } as User;
                    setCurrentUser(migratedUser);
                    useTenantStore.getState().loadOrganizationForUser(migratedUser.organizationId);
                    console.info(`[Auth] Migration complete for ${firebaseUser.email}`);
                    return;
                  }
                }
              } catch (migrationError) {
                // Migration failed — still let the user in with legacy doc
                // (client-side role checks still work, server-side rules may not)
                console.warn(
                  `[Auth] Migration failed for ${firebaseUser.email}, using legacy doc.`,
                  migrationError
                );
              }
            }

            // Use the document as-is (either no migration needed or migration failed)
            setCurrentUser(userData);
            useTenantStore.getState().loadOrganizationForUser(userData.organizationId);
          } else {
            // Self-heal path: user exists in Firebase Auth but profile doc is missing.
            // Bootstrap from an organization created by this user (trial flow) if found.
            const orgQuery = query(
              collection(db, 'organizations'),
              where('createdBy', '==', firebaseUser.uid),
              limit(1)
            );
            const orgSnap = await getDocs(orgQuery);

            if (!orgSnap.empty) {
              const orgDoc = orgSnap.docs[0];
              const now = new Date().toISOString();
              const fallbackName =
                firebaseUser.displayName ||
                firebaseUser.email.split('@')[0] ||
                'Trial User';

              await setDoc(doc(db, 'users', firebaseUser.uid), {
                name: fallbackName,
                email: firebaseUser.email,
                role: UserRole.Admin,
                organizationId: orgDoc.id,
                isActive: true,
                createdAt: now,
                updatedAt: now,
              }, { merge: true });

              const bootstrappedUser = {
                id: firebaseUser.uid,
                name: fallbackName,
                email: firebaseUser.email,
                role: UserRole.Admin,
                organizationId: orgDoc.id,
                isActive: true,
                createdAt: now,
                updatedAt: now,
              } as User;

              setCurrentUser(bootstrappedUser);
              useTenantStore.getState().loadOrganizationForUser(orgDoc.id);
              console.info(`[Auth] Bootstrapped missing user profile for ${firebaseUser.email}`);
              return;
            }

            // No legacy profile and no owned organization to bootstrap from.
            // Check if this is a freshly created account — Firestore docs may still
            // be in-flight from registrationService (race condition: onAuthStateChanged
            // fires synchronously after createUserWithEmailAndPassword, before setDoc calls complete).
            const creationTime = firebaseUser.metadata.creationTime;
            const accountAgeMs = creationTime
              ? Date.now() - new Date(creationTime).getTime()
              : Infinity;

            if (accountAgeMs < 90_000) {
              // New account (< 90 s old) — provisioning may still be writing docs.
              // Do NOT logout. RegistrationPage will manually hydrate the store.
              console.info(
                '[Auth] New account detected — skipping logout, registration is still provisioning.',
                firebaseUser.email
              );
              return;
            }

            console.error(
              "[Auth] User document not found and no organization available for bootstrap:",
              firebaseUser.email,
              "Auth UID:",
              firebaseUser.uid
            );
            logout();
          }
        } catch (error: unknown) {
          const errCode = (error as { code?: string })?.code;
          // Only force-logout for genuine auth token failures.
          // Firestore permission errors, network errors, or missing docs must NOT
          // sign the user out — they are transient and/or expected during provisioning.
          if (errCode === 'auth/user-token-expired' || errCode === 'auth/user-disabled') {
            console.warn('[Auth] Auth token invalid, logging out:', errCode);
            logout();
          } else {
            console.error(
              '[Auth] Non-fatal error during auth hydration (not logging out):',
              error
            );
          }
        }
      } else {
        // User is signed out
        if (useUserStore.getState().currentUser) {
          logout();
        }
      }
    });

    return () => unsubscribe();
  }, [setCurrentUser, logout]);
}