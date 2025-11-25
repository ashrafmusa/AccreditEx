import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { useUserStore } from '@/stores/useUserStore';
import { User } from '@/types';

export function useFirebaseAuth() {
  const setCurrentUser = useUserStore(state => state.setCurrentUser);
  const logout = useUserStore(state => state.logout);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        // User is signed in. Fetch their profile from Firestore by email.
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("email", "==", firebaseUser.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          // Combine the document data and the document ID into the user object
          const userData = { ...userDoc.data(), id: userDoc.id } as User;
          setCurrentUser(userData);
        } else {
          // This case occurs if a user exists in Firebase Auth but not in the 'users'
          // collection in Firestore. This is a critical data inconsistency.
          // For app stability, we log out the user.
          // In a production environment, this should trigger an alert for an admin.
          console.error("User document not found in Firestore for email:", firebaseUser.email);
          logout();
        }
      } else {
        // User is signed out.
        // The store's logout function handles clearing the currentUser.
        if (useUserStore.getState().currentUser) {
            logout();
        }
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [setCurrentUser, logout]);
}