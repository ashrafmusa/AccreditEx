/**
 * useUserStore — Unit Tests
 *
 * Tests authentication, RBAC guards, and CRUD operations.
 * Firebase and external services are fully mocked.
 */
import type { User } from '@/types';

/* ── Mock Firebase ───────────────────────────────────────── */
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockGetDocs = jest.fn();
const mockSetDoc = jest.fn();
const mockDeleteDoc = jest.fn();

jest.mock('firebase/auth', () => ({
    signInWithEmailAndPassword: (...args: any[]) => mockSignIn(...args),
    signOut: (...args: any[]) => mockSignOut(...args),
}));

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => 'users-ref'),
    query: jest.fn(() => 'query-ref'),
    where: jest.fn(),
    getDocs: (...args: any[]) => mockGetDocs(...args),
    setDoc: (...args: any[]) => mockSetDoc(...args),
    deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
    doc: jest.fn((_db, _col, id) => `doc-ref-${id}`),
}));

jest.mock('@/firebase/firebaseConfig', () => ({
    getAuthInstance: jest.fn(() => 'mock-auth'),
    db: 'mock-db',
}));

/* ── Mock Services ───────────────────────────────────────── */
const mockGetUsers = jest.fn();
jest.mock('@/services/userService', () => ({
    getUsers: (...args: any[]) => mockGetUsers(...args),
}));

jest.mock('@/services/deviceSessionService', () => ({
    deviceSessionService: {
        createOrUpdateSession: jest.fn().mockResolvedValue(undefined),
        signOutDevice: jest.fn().mockResolvedValue(undefined),
        getCurrentDeviceId: jest.fn(() => 'device-1'),
    },
}));

jest.mock('@/services/errorHandling', () => ({
    handleError: jest.fn(),
    AppError: class AppError extends Error {
        code: string;
        constructor(message: string, code: string) {
            super(message);
            this.code = code;
        }
    },
    AuthenticationError: class AuthenticationError extends Error { },
}));

jest.mock('@/services/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/services/analyticsTrackingService', () => ({
    analytics: { trackLogin: jest.fn() },
}));

const mockCreateUserSecurely = jest.fn();
jest.mock('@/services/secureUserService', () => ({
    createUserSecurely: (...args: any[]) => mockCreateUserSecurely(...args),
}));

const mockGuard = jest.fn();
jest.mock('@/services/permissionService', () => ({
    permissionService: { guard: (...args: any[]) => mockGuard(...args) },
    Action: { Create: 'create', Delete: 'delete', Read: 'read', Update: 'update' },
    Resource: { User: 'user' },
}));

/* ── Import AFTER mocks ──────────────────────────────────── */
import { useUserStore } from '@/stores/useUserStore';

/* ── Helpers ─────────────────────────────────────────────── */
const adminUser: User = {
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@test.com',
    role: 'Admin',
    department: 'IT',
    status: 'Active',
    assignedProjects: [],
    createdAt: '2025-01-01',
} as User;

const regularUser: User = {
    id: 'user-1',
    name: 'Normal User',
    email: 'user@test.com',
    role: 'TeamMember',
    department: 'Quality',
    status: 'Active',
    assignedProjects: [],
    createdAt: '2025-01-01',
} as User;

describe('useUserStore', () => {
    beforeEach(() => {
        useUserStore.setState({ currentUser: null, users: [] });
        jest.clearAllMocks();
    });

    describe('initial state', () => {
        it('starts with null user and empty list', () => {
            const { currentUser, users } = useUserStore.getState();
            expect(currentUser).toBeNull();
            expect(users).toEqual([]);
        });
    });

    describe('setCurrentUser', () => {
        it('sets current user', () => {
            useUserStore.getState().setCurrentUser(adminUser);
            expect(useUserStore.getState().currentUser).toEqual(adminUser);
        });

        it('clears current user with null', () => {
            useUserStore.getState().setCurrentUser(adminUser);
            useUserStore.getState().setCurrentUser(null);
            expect(useUserStore.getState().currentUser).toBeNull();
        });
    });

    describe('fetchAllUsers', () => {
        it('loads users from userService', async () => {
            mockGetUsers.mockResolvedValue([adminUser, regularUser]);
            await useUserStore.getState().fetchAllUsers();
            expect(useUserStore.getState().users).toEqual([adminUser, regularUser]);
        });
    });

    describe('login', () => {
        it('returns user on successful login', async () => {
            mockSignIn.mockResolvedValue({
                user: { email: 'admin@test.com' },
            });
            mockGetDocs.mockResolvedValue({
                empty: false,
                docs: [{ id: 'admin-1', data: () => ({ ...adminUser, id: undefined }) }],
            });

            const result = await useUserStore.getState().login('admin@test.com', 'pass123');
            expect(result).toBeTruthy();
            expect(result!.email).toBe('admin@test.com');
        });

        it('returns null when no Firestore user doc found', async () => {
            mockSignIn.mockResolvedValue({
                user: { email: 'ghost@test.com' },
            });
            mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

            const result = await useUserStore.getState().login('ghost@test.com', 'pass');
            expect(result).toBeNull();
        });

        it('returns null on auth failure', async () => {
            mockSignIn.mockRejectedValue(new Error('Invalid credentials'));
            const result = await useUserStore.getState().login('wrong@test.com', 'bad');
            expect(result).toBeNull();
        });
    });

    describe('logout', () => {
        it('clears current user', async () => {
            useUserStore.setState({ currentUser: adminUser });
            mockSignOut.mockResolvedValue(undefined);
            await useUserStore.getState().logout();
            expect(useUserStore.getState().currentUser).toBeNull();
        });
    });

    describe('addUser', () => {
        it('creates user via secureUserService and adds to list', async () => {
            const newUser = { ...regularUser, id: 'new-1' };
            mockGuard.mockResolvedValue(adminUser);
            mockCreateUserSecurely.mockResolvedValue(newUser);

            useUserStore.setState({ currentUser: adminUser, users: [] });
            await useUserStore.getState().addUser({ name: 'New', email: 'new@test.com' } as any);

            expect(useUserStore.getState().users).toContainEqual(newUser);
        });

        it('throws when RBAC guard fails', async () => {
            mockGuard.mockRejectedValue(new Error('Forbidden'));
            useUserStore.setState({ currentUser: regularUser });

            await expect(
                useUserStore.getState().addUser({ name: 'X' } as any)
            ).rejects.toThrow();
        });
    });

    describe('updateUser', () => {
        it('allows admin to update any user', async () => {
            useUserStore.setState({ currentUser: adminUser, users: [regularUser] });
            mockSetDoc.mockResolvedValue(undefined);

            const updated = { ...regularUser, name: 'Updated' };
            await useUserStore.getState().updateUser(updated);

            expect(mockSetDoc).toHaveBeenCalled();
            expect(useUserStore.getState().users[0].name).toBe('Updated');
        });

        it('allows user to update own profile', async () => {
            useUserStore.setState({ currentUser: regularUser, users: [regularUser] });
            mockSetDoc.mockResolvedValue(undefined);

            const updated = { ...regularUser, name: 'Self Updated' };
            await useUserStore.getState().updateUser(updated);

            expect(useUserStore.getState().users[0].name).toBe('Self Updated');
        });

        it('rejects non-admin updating another user', async () => {
            useUserStore.setState({ currentUser: regularUser, users: [adminUser] });

            await expect(
                useUserStore.getState().updateUser({ ...adminUser, name: 'Hacked' })
            ).rejects.toThrow();
        });

        it('rejects unauthenticated update', async () => {
            useUserStore.setState({ currentUser: null });
            await expect(
                useUserStore.getState().updateUser(regularUser)
            ).rejects.toThrow();
        });
    });

    describe('deleteUser', () => {
        it('deletes user with admin permission', async () => {
            mockGuard.mockResolvedValue(adminUser);
            mockDeleteDoc.mockResolvedValue(undefined);
            useUserStore.setState({ currentUser: adminUser, users: [regularUser] });

            await useUserStore.getState().deleteUser('user-1');
            expect(useUserStore.getState().users).toHaveLength(0);
        });

        it('prevents self-deletion', async () => {
            mockGuard.mockResolvedValue(adminUser);
            useUserStore.setState({ currentUser: adminUser, users: [adminUser] });

            await expect(
                useUserStore.getState().deleteUser('admin-1')
            ).rejects.toThrow();
        });
    });
});
