import { create } from 'zustand';
import { User } from '@/types';
import { getAuthInstance, db } from '@/firebase/firebaseConfig';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
// MIGRATION: Replaced BackendService with Firebase services
import { getUsers } from '@/services/userService';
import { deviceSessionService } from '@/services/deviceSessionService';

interface UserState {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User | null) => void;
  fetchAllUsers: () => Promise<void>;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  addUser: (userData: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  users: [],
  setCurrentUser: (user) => set({ currentUser: user }),
  fetchAllUsers: async () => {
    const users = await getUsers();
    set({ users });
  },
  login: async (email, password) => {
    try {
      const auth = getAuthInstance();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      if (firebaseUser.email) {
        // The onAuthStateChanged listener in firebaseHooks will handle fetching 
        // from Firestore and setting the current user.
        // We just need to find the user to return it immediately for any post-login actions.
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("email", "==", firebaseUser.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const user = { ...userDoc.data(), id: userDoc.id } as User;
          
          // Track device session (non-blocking)
          deviceSessionService.createOrUpdateSession(user.id).catch(err => 
            console.error('Failed to track session:', err)
          );
          
          return user;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  },
  logout: async () => {
    const currentUser = get().currentUser;
    
    // Sign out current device session
    if (currentUser) {
      const currentDeviceId = deviceSessionService.getCurrentDeviceId();
      await deviceSessionService.signOutDevice(currentUser.id, currentDeviceId).catch(err =>
        console.error('Failed to remove session:', err)
      );
    }
    
    const auth = getAuthInstance();
    await signOut(auth);
    set({ currentUser: null });
  },
  addUser: async (userData) => {
    try {
      const usersRef = collection(db, 'users');
      const userId = `user-${Date.now()}`;
      await setDoc(doc(usersRef, userId), { ...userData, id: userId });
      const newUser: User = { ...userData, id: userId };
      set(state => ({ users: [...state.users, newUser] }));
    } catch (error) {
      throw error;
    }
  },
  updateUser: async (updatedUser) => {
    try {
      const userRef = doc(db, 'users', updatedUser.id);
      await setDoc(userRef, updatedUser, { merge: true });
      set(state => ({
        users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
        currentUser: state.currentUser?.id === updatedUser.id ? updatedUser : state.currentUser
      }));
    } catch (error) {
      throw error;
    }
  },
  deleteUser: async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      set(state => ({ users: state.users.filter(u => u.id !== userId) }));
    } catch (error) {
      throw error;
    }
  },
}));