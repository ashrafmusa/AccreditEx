import { SettingsPreset, AppSettings } from '@/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const COLLECTION_NAME = 'settings_presets';

export const createPreset = async (preset: Omit<SettingsPreset, 'id' | 'createdAt' | 'usageCount'>): Promise<string> => {
    const presetData = {
        ...preset,
        createdAt: new Date().toISOString(),
        usageCount: 0,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...presetData,
        createdAtTimestamp: Timestamp.now(),
    });

    return docRef.id;
};

export const getPresets = async (category?: string): Promise<SettingsPreset[]> => {
    let q = query(collection(db, COLLECTION_NAME), orderBy('usageCount', 'desc'));

    if (category) {
        q = query(collection(db, COLLECTION_NAME), where('category', '==', category), orderBy('usageCount', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as SettingsPreset[];
};

export const getUserPresets = async (userId: string): Promise<SettingsPreset[]> => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as SettingsPreset[];
};

export const getPublicPresets = async (): Promise<SettingsPreset[]> => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('isPublic', '==', true),
        orderBy('usageCount', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as SettingsPreset[];
};

export const applyPreset = async (presetId: string): Promise<Partial<AppSettings>> => {
    const presets = await getPresets();
    const preset = presets.find(p => p.id === presetId);

    if (!preset) {
        throw new Error('Preset not found');
    }

    // Increment usage count
    const presetRef = doc(db, COLLECTION_NAME, presetId);
    await updateDoc(presetRef, {
        usageCount: preset.usageCount + 1,
    });

    return preset.settings;
};

export const updatePreset = async (presetId: string, updates: Partial<SettingsPreset>): Promise<void> => {
    const presetRef = doc(db, COLLECTION_NAME, presetId);
    await updateDoc(presetRef, updates);
};

export const deletePreset = async (presetId: string): Promise<void> => {
    const presetRef = doc(db, COLLECTION_NAME, presetId);
    await deleteDoc(presetRef);
};

// Built-in presets
export const BUILT_IN_PRESETS: SettingsPreset[] = [
    {
        id: 'preset-dark-minimalist',
        name: 'Dark Minimalist',
        description: 'Clean dark theme with minimal animations',
        category: 'theme',
        settings: {
            appearance: {
                compactMode: true,
                sidebarCollapsed: false,
                showAnimations: false,
                cardStyle: 'outlined' as const,
                customColors: {
                    primary: '#6366f1',
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                },
            },
        },
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        usageCount: 0,
        icon: '🌙',
    },
    {
        id: 'preset-high-contrast',
        name: 'High Contrast',
        description: 'Accessibility-focused high contrast theme',
        category: 'theme',
        settings: {
            accessibility: {
                highContrast: true,
                fontSize: 'large',
                reduceMotion: true,
                screenReaderOptimized: true,
            },
            appearance: {
                compactMode: false,
                sidebarCollapsed: false,
                showAnimations: false,
                cardStyle: 'elevated' as const,
                customColors: {
                    primary: '#4f46e5',
                    success: '#22c55e',
                    warning: '#f97316',
                    danger: '#ef4444',
                },
            },
        },
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        usageCount: 0,
        icon: '🎯',
    },
    {
        id: 'preset-secure',
        name: 'Maximum Security',
        description: 'Strict security and password policies',
        category: 'security',
        settings: {
            passwordPolicy: {
                minLength: 12,
                requireUppercase: true,
                requireNumber: true,
                requireSymbol: true,
            },
            users: {
                enableUserManagement: true,
                requireEmailVerification: true,
                autoDeactivateInactiveUsers: true,
                inactivityThresholdDays: 90,
                sessionTimeoutMinutes: 15,
                maxLoginAttempts: 3,
                lockoutDurationMinutes: 30,
            },
        },
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        usageCount: 0,
        icon: '🔒',
    },
    {
        id: 'preset-productivity',
        name: 'Productivity Focus',
        description: 'Optimized notifications and minimal distractions',
        category: 'notifications',
        settings: {
            notifications: {
                emailNotifications: false,
                pushNotifications: true,
                taskReminders: true,
                projectUpdates: false,
                trainingDueDates: true,
                auditSchedules: true,
            },
            appearance: {
                compactMode: true,
                sidebarCollapsed: false,
                showAnimations: false,
                cardStyle: 'flat' as const,
                customColors: {
                    primary: '#4f46e5',
                    success: '#22c55e',
                    warning: '#f97316',
                    danger: '#ef4444',
                },
            },
        },
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        usageCount: 0,
        icon: '⚡',
    },
];

export const getBuiltInPresets = (): SettingsPreset[] => {
    return BUILT_IN_PRESETS;
};