import { create } from 'zustand';
import { User } from '@/types';
import { getAuthInstance, db } from '@/firebase/firebaseConfig';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
// MIGRATION: Replaced BackendService with Firebase services
import { getUsers } from '@/services/userService';
import { deviceSessionService } from '@/services/deviceSessionService';
import { handleError, AppError, AuthenticationError } from '@/services/errorHandling';
import { logger } from '@/services/logger';
// Security fix (2026-02-18): Secure user creation with Auth UID alignment
import { createUserSecurely } from '@/services/secureUserService';

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
            logger.warn('Failed to track session', err)
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
        logger.warn('Failed to remove session', err)
      );
    }

    const auth = getAuthInstance();
    await signOut(auth);
    set({ currentUser: null });
  },
  // Security fix (2026-02-18): addUser now creates a Firebase Auth account
  // AND stores the Firestore document keyed by Auth UID (fixes C-1 + C-2).
  // A password reset email is sent to the new user automatically.
  addUser: async (userData) => {
    try {
      const currentUser = get().currentUser;
      if (!currentUser) {
        throw new AppError('Not authenticated', 'UNAUTHORIZED');
      }
      if (currentUser.role !== 'Admin') {
        throw new AppError('Only administrators can create new users', 'UNAUTHORIZED');
      }

      const newUser = await createUserSecurely(userData, currentUser.role);
      set(state => ({ users: [...state.users, newUser] }));
      logger.info(`[useUserStore] User created: ${newUser.email} (${newUser.id})`);
    } catch (error) {
      handleError(error, 'addUser');
      throw new AppError(
        error instanceof Error ? error.message : 'Failed to add user',
        'OPERATION_FAILED'
      );
    }
  },
  updateUser: async (updatedUser) => {
    try {
      const state = get();
      const currentUser = state.currentUser;

      // Authorization check: User can only update their own profile OR must be admin
      if (!currentUser) {
        throw new AppError('Not authenticated', 'UNAUTHORIZED');
      }

      const isOwnProfile = currentUser.id === updatedUser.id;
      const isAdmin = currentUser.role === 'Admin';

      if (!isOwnProfile && !isAdmin) {
        throw new AppError('You can only update your own profile', 'UNAUTHORIZED');
      }

      // Prevent role escalation: Non-admins cannot change roles
      if (!isAdmin && updatedUser.role !== currentUser.role && currentUser.id === updatedUser.id) {
        throw new AppError('You cannot change your own role', 'UNAUTHORIZED');
      }

      const userRef = doc(db, 'users', updatedUser.id);
      await setDoc(userRef, updatedUser, { merge: true });
      set(state => ({
        users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
        currentUser: state.currentUser?.id === updatedUser.id ? updatedUser : state.currentUser
      }));
    } catch (error) {
      handleError(error, 'updateUser');
      throw new AppError('Failed to update user', 'OPERATION_FAILED');
    }
  },
  deleteUser: async (userId) => {
    try {
      const currentUser = get().currentUser;
      if (!currentUser || currentUser.role !== 'Admin') {
        throw new AppError('Only administrators can delete users', 'UNAUTHORIZED');
      }
      // Prevent deleting yourself
      if (currentUser.id === userId) {
        throw new AppError('You cannot delete your own account', 'OPERATION_FAILED');
      }
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      set(state => ({ users: state.users.filter(u => u.id !== userId) }));
    } catch (error) {
      handleError(error, 'deleteUser');
      throw new AppError('Failed to delete user', 'OPERATION_FAILED');
    }
  },
}));
