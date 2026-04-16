import { db, getAuthInstance } from '@/firebase/firebaseConfig';
import { migrateUserDocToAuthUid } from '@/services/secureUserService';
import { useTenantStore } from '@/stores/useTenantStore';
import { useUserStore } from '@/stores/useUserStore';
import { User } from '@/types';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
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