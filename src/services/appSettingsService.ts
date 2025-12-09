import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { AppSettings, UserRole } from '../types';

const settingsCollection = collection(db, 'appSettings');

export const getAppSettings = async (): Promise<AppSettings | null> => {
    try {
        const settingsSnapshot = await getDocs(settingsCollection);
        if (settingsSnapshot.empty) {
            console.warn('No app settings found in Firestore');
            return getDefaultSettings();
        }
        const settingsDoc = settingsSnapshot.docs[0];
        return { ...settingsDoc.data() } as AppSettings;
    } catch (error) {
        console.error('Error fetching app settings:', error);
        return getDefaultSettings();
    }
};

export const updateAppSettings = async (settings: AppSettings): Promise<void> => {
    try {
        const settingsSnapshot = await getDocs(settingsCollection);

        if (settingsSnapshot.empty) {
            // If no settings exist, create a new document
            await setDoc(doc(settingsCollection, 'default'), settings);
            console.log('App settings created in Firestore');
        } else {
            // Update existing document
            const settingsDocId = settingsSnapshot.docs[0].id;
            const settingsDocRef = doc(db, 'appSettings', settingsDocId);
            await updateDoc(settingsDocRef, settings as Record<string, any>);
            console.log('App settings updated in Firestore');
        }
    } catch (error) {
        console.error('Error updating app settings:', error);
        throw error;
    }
};

// Fallback default settings
const getDefaultSettings = (): AppSettings => ({
    appName: 'AccreditEx',
    logoUrl: '',
    primaryColor: '#4f46e5',
    defaultLanguage: 'en',
    defaultUserRole: UserRole.TeamMember,
    passwordPolicy: {
        minLength: 8,
        requireUppercase: false,
        requireNumber: false,
        requireSymbol: false
    },
    globeSettings: {
        baseColor: '#1e293b',
        markerColor: '#818cf8',
        glowColor: '#4f46e5',
        scale: 2.5,
        darkness: 0.9,
        lightIntensity: 1.2,
        rotationSpeed: 0.02
    },
    appearance: {
        compactMode: false,
        sidebarCollapsed: false,
        showAnimations: true,
        cardStyle: 'elevated',
        customColors: {
            primary: '#4f46e5',
            success: '#22c55e',
            warning: '#f97316',
            danger: '#ef4444'
        }
    },
    notifications: {
        emailNotifications: true,
        pushNotifications: false,
        taskReminders: true,
        projectUpdates: true,
        trainingDueDates: true,
        auditSchedules: true
    },
    accessibility: {
        fontSize: 'medium',
        highContrast: false,
        reduceMotion: false,
        screenReaderOptimized: false
    }
});