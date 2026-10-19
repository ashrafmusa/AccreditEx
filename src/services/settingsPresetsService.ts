import { SettingsPreset, AppSettings } from '@/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, where, orderBy, Timestamp } from 'firebase/firestore';
import { db, getAuthInstance } from '../firebase/firebaseConfig';
import { getSharedTenantQuery, getTenantQuery, getTenantStamp } from '@/utils/tenantQuery';

const COLLECTION_NAME = 'settings_presets';

export const createPreset = async (preset: Omit<SettingsPreset, 'id' | 'createdAt' | 'usageCount'>): Promise<string> => {
    const user = getAuthInstance().currentUser;
    if (!user) {
        throw new Error('Authentication is required to create a settings preset.');
    }

    const presetData = {
        ...preset,
        createdBy: user.uid,
        ...getTenantStamp(),
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
    const userId = getAuthInstance().currentUser?.uid;
    const snapshots = [getDocs(getSharedTenantQuery(
        COLLECTION_NAME,
        orderBy('usageCount', 'desc'),
    ))];

    if (userId) {
        snapshots.push(getDocs(getTenantQuery(
            COLLECTION_NAME,
            where('createdBy', '==', userId),
            orderBy('usageCount', 'desc'),
        )));
    }

    const results = await Promise.all(snapshots);
    const byId = new Map<string, SettingsPreset>();
    for (const snapshot of results) {
        for (const presetDoc of snapshot.docs) {
            const data = presetDoc.data();
            const preset = { id: presetDoc.id, ...data } as SettingsPreset;
            const isVisible = data.scope === 'global' || preset.isPublic ||
                preset.createdBy === userId;
            if (isVisible && (!category || preset.category === category)) {
                byId.set(preset.id, preset);
            }
        }
    }
    return [...byId.values()].sort((a, b) => b.usageCount - a.usageCount);
};

export const getUserPresets = async (userId: string): Promise<SettingsPreset[]> => {
    const authenticatedUserId = getAuthInstance().currentUser?.uid;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
        throw new Error('Users may only load their own settings presets.');
    }

    const q = getTenantQuery(
        COLLECTION_NAME,
        where('createdBy', '==', authenticatedUserId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as SettingsPreset[];
};

export const getPublicPresets = async (): Promise<SettingsPreset[]> => {
    const q = getSharedTenantQuery(
        COLLECTION_NAME,
        orderBy('usageCount', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
        .filter(presetDoc => {
            const data = presetDoc.data();
            return data.scope === 'global' || data.isPublic === true;
        })
        .map(doc => ({ id: doc.id, ...doc.data() }) as SettingsPreset);
};

export const applyPreset = async (presetId: string): Promise<Partial<AppSettings>> => {
    const presets = await getPresets();
    const preset = presets.find(p => p.id === presetId);

    if (!preset) {
        throw new Error('Preset not found');
    }

    // Shared presets are read-only across tenants; only increment tenant-owned records.
    const ownedPresetSnapshot = await getDocs(
        getTenantQuery(COLLECTION_NAME, where('__name__', '==', presetId)),
    );
    if (!ownedPresetSnapshot.empty) {
        await updateDoc(ownedPresetSnapshot.docs[0].ref, {
            usageCount: preset.usageCount + 1,
        });
    }

    return preset.settings;
};

export const updatePreset = async (presetId: string, updates: Partial<SettingsPreset>): Promise<void> => {
    const presetRef = await getTenantPresetRef(presetId);
    await updateDoc(presetRef, updates);
};

export const deletePreset = async (presetId: string): Promise<void> => {
    const presetRef = await getTenantPresetRef(presetId);
    await deleteDoc(presetRef);
};

const getTenantPresetRef = async (presetId: string) => {
    const snapshot = await getDocs(
        getTenantQuery(COLLECTION_NAME, where('__name__', '==', presetId)),
    );
    if (snapshot.empty) {
        throw new Error(`Settings preset ${presetId} was not found in this organization.`);
    }
    return snapshot.docs[0].ref;
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