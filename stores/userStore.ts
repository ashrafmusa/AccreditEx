import { create } from 'zustand';
import { User } from '@/types';
import { backendService } from '@/services/BackendService';
import { auth } from '@/firebase/firebaseConfig';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

interface UserState {
    users: User[];
    currentUser: User | null;
    fetchUsers: () => Promise<void>;
    setCurrentUser: (user: User | null) => void;
    login: (email: string, passwordAttempt: string) => Promise<User | null>;
    logout: () => void;
    addUser: (newUserData: Omit<User, 'id'>) => Promise<void>;
    updateUser: (updatedUser: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
    users: [],
    currentUser: null,
    fetchUsers: async () => {
        const users = await backendService.getUsers();
        set({ users });
    },
    setCurrentUser: (user: User | null) => {
        set({ currentUser: user });
    },
    login: async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // The auth state listener in useFirebaseAuth will handle setting the user.
            // We can return the user from the store after the listener has run.
            // A small delay helps ensure the state propagates from the listener.
            await new Promise(resolve => setTimeout(resolve, 100));
            return get().currentUser;
        } catch (error) {
            console.error("Firebase login failed:", error);
            return null;
        }
    },
    logout: () => {
        signOut(auth);
        set({ currentUser: null });
    },
    addUser: async (newUserData) => {
        const newUser = await backendService.addUser(newUserData);
        set(state => ({ users: [...state.users, newUser] }));
    },
    updateUser: async (updatedUser) => {
        const updated = await backendService.updateUser(updatedUser);
        set(state => ({
            users: state.users.map(u => u.id === updated.id ? updated : u),
            currentUser: get().currentUser?.id === updated.id ? updated : get().currentUser
        }));
    },
    deleteUser: async (userId) => {
        await backendService.deleteUser(userId);
        set(state => ({ users: state.users.filter(u => u.id !== userId) }));
    },
}));