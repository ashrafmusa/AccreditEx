import { create } from 'zustand';
import { User } from '@/types';
import { auth, db } from '@/firebase/firebaseConfig';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
// FIX: Corrected import path for backendService
import { backendService } from '@/services/BackendService';

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
    const users = await backendService.getUsers();
    set({ users });
  },
  login: async (email, password) => {
    try {
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
          return { ...userDoc.data(), id: userDoc.id } as User;
        }
      }
      return null;
    } catch (error) {
      console.error("Login failed:", error);
      return null;
    }
  },
  logout: async () => {
    await signOut(auth);
    set({ currentUser: null });
  },
  addUser: async (userData) => {
    const newUser = await backendService.addUser(userData);
    set(state => ({ users: [...state.users, newUser] }));
  },
  updateUser: async (updatedUser) => {
    const returnedUser = await backendService.updateUser(updatedUser);
    set(state => ({
      users: state.users.map(u => u.id === returnedUser.id ? returnedUser : u),
      currentUser: state.currentUser?.id === returnedUser.id ? returnedUser : state.currentUser
    }));
  },
  deleteUser: async (userId) => {
    await backendService.deleteUser(userId);
    set(state => ({ users: state.users.filter(u => u.id !== userId) }));
  },
}));