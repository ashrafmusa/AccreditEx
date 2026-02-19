import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuthInstance, db } from '@/firebase/firebaseConfig';
import { useUserStore } from '@/stores/useUserStore';
import { User } from '@/types';
import { migrateUserDocToAuthUid } from '@/services/secureUserService';

/**
 * Firebase Auth hook — manages auth state and automatic UID migration.
 * 
 * Security fix (2026-02-18): This hook now handles two scenarios:
 * 
 * 1. NEW USERS (post-fix): User document is keyed by Auth UID.
 *    → Direct lookup by UID succeeds immediately.
 * 
 * 2. LEGACY USERS (pre-fix): User document has a custom ID like "user-5".
 *    → Direct UID lookup fails → falls back to email query.
 *    → If found by email with a non-UID doc ID, automatically migrates
 *      the document to use the Auth UID (atomic batch: create new + delete old).
 *    → This ensures Firestore security rules' `getUserRole()` works correctly.
 * 
 * After migration, the user is seamlessly logged in with no disruption.
 * All legacy users are migrated gradually as they log in.
 */
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
            // STEP 3: Auto-migrate if document ID doesn't match Auth UID
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
          } else {
            // User exists in Firebase Auth but not in Firestore — critical inconsistency
            console.error(
              "[Auth] User document not found in Firestore for email:",
              firebaseUser.email,
              "Auth UID:",
              firebaseUser.uid
            );
            logout();
          }
        } catch (error) {
          console.error("[Auth] Error during auth state change:", error);
          logout();
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