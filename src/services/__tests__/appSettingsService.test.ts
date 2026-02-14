import { getAppSettings, updateAppSettings } from '../appSettingsService';
import { AppSettings, UserRole } from '../../types';

// Mock Firebase functions
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => 'mocked-collection'),
    getDocs: () => mockGetDocs(),
    doc: (...args: any[]) => mockDoc(...args),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    setDoc: (...args: any[]) => mockSetDoc(...args),
}));

jest.mock('../../firebase/firebaseConfig', () => ({
    db: 'mocked-db',
}));

// Mock console methods to avoid noise in tests
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => { });
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => { });

describe('appSettingsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConsoleWarn.mockClear();
        mockConsoleError.mockClear();
        mockConsoleLog.mockClear();

        // Set up default mock return values
        mockDoc.mockReturnValue('mocked-doc-result');
    });

    afterAll(() => {
        mockConsoleWarn.mockRestore();
        mockConsoleError.mockRestore();
        mockConsoleLog.mockRestore();
    });

    const mockAppSettings: AppSettings = {
        appName: 'Test App',
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#ff0000',
        defaultLanguage: 'en',
        defaultUserRole: UserRole.Admin,
        passwordPolicy: {
            minLength: 10,
            requireUppercase: true,
            requireNumber: true,
            requireSymbol: true,
        },
        globeSettings: {
            baseColor: '#000000',
            markerColor: '#ffffff',
            glowColor: '#ff0000',
            scale: 3.0,
            darkness: 0.5,
            lightIntensity: 2.0,
            rotationSpeed: 0.05,
        },
        appearance: {
            compactMode: true,
            sidebarCollapsed: true,
            showAnimations: false,
            cardStyle: 'flat',
            customColors: {
                primary: '#ff0000',
                success: '#00ff00',
                warning: '#ffff00',
                danger: '#ff0000',
            },
        },
        notifications: {
            emailNotifications: false,
            pushNotifications: true,
            taskReminders: false,
            projectUpdates: false,
            trainingDueDates: false,
            auditSchedules: false,
        },
        accessibility: {
            fontSize: 'large',
            highContrast: true,
            reduceMotion: true,
            screenReaderOptimized: true,
        },
    };

    const mockEmptySnapshot = {
        empty: true,
        docs: [],
    };

    const mockSnapshotWithData = {
        empty: false,
        docs: [
            {
                id: 'test-settings-id',
                data: () => mockAppSettings,
            },
        ],
    };

    describe('getAppSettings', () => {
        test('should return app settings when they exist in Firestore', async () => {
            mockGetDocs.mockResolvedValue(mockSnapshotWithData);

            const result = await getAppSettings();

            expect(result).toEqual(mockAppSettings);
            expect(mockGetDocs).toHaveBeenCalledTimes(1);
            expect(mockConsoleWarn).not.toHaveBeenCalled();
        });

        test('should return default settings when no settings exist in Firestore', async () => {
            mockGetDocs.mockResolvedValue(mockEmptySnapshot);

            const result = await getAppSettings();

            expect(result).toEqual({
                appName: 'AccreditEx',
                logoUrl: '',
                primaryColor: '#4f46e5',
                defaultLanguage: 'en',
                defaultUserRole: UserRole.TeamMember,
                passwordPolicy: {
                    minLength: 8,
                    requireUppercase: false,
                    requireNumber: false,
                    requireSymbol: false,
                },
                globeSettings: {
                    baseColor: '#1e293b',
                    markerColor: '#818cf8',
                    glowColor: '#4f46e5',
                    scale: 2.5,
                    darkness: 0.9,
                    lightIntensity: 1.2,
                    rotationSpeed: 0.02,
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
                        danger: '#ef4444',
                    },
                },
                notifications: {
                    emailNotifications: true,
                    pushNotifications: false,
                    taskReminders: true,
                    projectUpdates: true,
                    trainingDueDates: true,
                    auditSchedules: true,
                },
                accessibility: {
                    fontSize: 'medium',
                    highContrast: false,
                    reduceMotion: false,
                    screenReaderOptimized: false,
                },
            });
            expect(mockGetDocs).toHaveBeenCalledTimes(1);
            expect(mockConsoleWarn).toHaveBeenCalledWith('No app settings found in Firestore');
        });

        test('should return default settings when Firestore query fails', async () => {
            const error = new Error('Firestore connection failed');
            mockGetDocs.mockRejectedValue(error);

            const result = await getAppSettings();

            expect(result).toBeDefined();
            expect(result?.appName).toBe('AccreditEx'); // Verify it's default settings
            expect(mockConsoleError).toHaveBeenCalledWith('Error fetching app settings:', error);
        });

        test('should handle corrupted data gracefully', async () => {
            const corruptedSnapshot = {
                empty: false,
                docs: [
                    {
                        id: 'corrupted-id',
                        data: () => ({ invalid: 'data' }), // Missing required fields
                    },
                ],
            };
            mockGetDocs.mockResolvedValue(corruptedSnapshot);

            const result = await getAppSettings();

            expect(result).toEqual({ invalid: 'data' });
            expect(mockGetDocs).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateAppSettings', () => {
        test('should update existing settings in Firestore', async () => {
            mockGetDocs.mockResolvedValue(mockSnapshotWithData);
            mockSetDoc.mockResolvedValue(undefined);

            await updateAppSettings(mockAppSettings);

            expect(mockGetDocs).toHaveBeenCalledTimes(1);
            expect(mockSetDoc).toHaveBeenCalledWith(
                'mocked-doc-result',
                JSON.parse(JSON.stringify(mockAppSettings)),
                { merge: true }
            );
            expect(mockConsoleLog).toHaveBeenCalledWith('App settings updated in Firestore');
        });

        test('should create new settings when none exist', async () => {
            mockGetDocs.mockResolvedValue(mockEmptySnapshot);
            mockSetDoc.mockResolvedValue(undefined);
            mockDoc.mockReturnValue('mocked-doc-result');

            await updateAppSettings(mockAppSettings);

            expect(mockGetDocs).toHaveBeenCalledTimes(1);
            expect(mockSetDoc).toHaveBeenCalledWith(
                'mocked-doc-result',
                JSON.parse(JSON.stringify(mockAppSettings))
            );
            expect(mockConsoleLog).toHaveBeenCalledWith('App settings created in Firestore');
        });

        test('should validate required fields before saving', async () => {
            const invalidSettings = {
                ...mockAppSettings,
                appName: '', // Missing required field
            };

            await expect(updateAppSettings(invalidSettings)).rejects.toThrow(
                'Missing required fields in AppSettings'
            );

            expect(mockGetDocs).not.toHaveBeenCalled();
            expect(mockSetDoc).not.toHaveBeenCalled();
        });

        test('should validate defaultLanguage is required', async () => {
            const invalidSettings = {
                ...mockAppSettings,
                defaultLanguage: '' as any, // Missing required field
            };

            await expect(updateAppSettings(invalidSettings)).rejects.toThrow(
                'Missing required fields in AppSettings'
            );
        });

        test('should validate defaultUserRole is required', async () => {
            const invalidSettings = {
                ...mockAppSettings,
                defaultUserRole: undefined as any, // Missing required field
            };

            await expect(updateAppSettings(invalidSettings)).rejects.toThrow(
                'Missing required fields in AppSettings'
            );
        });

        test('should handle Firestore errors during update', async () => {
            mockGetDocs.mockResolvedValue(mockSnapshotWithData);
            const firestoreError = new Error('Permission denied');
            mockSetDoc.mockRejectedValue(firestoreError);

            await expect(updateAppSettings(mockAppSettings)).rejects.toThrow('Permission denied');

            expect(mockConsoleError).toHaveBeenCalledWith('Error updating app settings:', firestoreError);
        });

        test('should handle Firestore errors during creation', async () => {
            mockGetDocs.mockResolvedValue(mockEmptySnapshot);
            const firestoreError = new Error('Quota exceeded');
            mockSetDoc.mockRejectedValue(firestoreError);

            await expect(updateAppSettings(mockAppSettings)).rejects.toThrow('Quota exceeded');

            expect(mockConsoleError).toHaveBeenCalledWith('Error updating app settings:', firestoreError);
        });

        test('should serialize complex objects correctly', async () => {
            mockGetDocs.mockResolvedValue(mockSnapshotWithData);
            mockSetDoc.mockResolvedValue(undefined);

            const complexSettings = {
                ...mockAppSettings,
                customField: {
                    nestedObject: {
                        deeplyNested: 'value',
                    },
                    arrayField: [1, 2, 3],
                },
            };

            await updateAppSettings(complexSettings);

            const expectedSerializedData = JSON.parse(JSON.stringify(complexSettings));
            expect(mockSetDoc).toHaveBeenCalledWith(
                'mocked-doc-result',
                expectedSerializedData,
                { merge: true }
            );
        });

        test('should handle getDocs failure during update', async () => {
            const error = new Error('Network error');
            mockGetDocs.mockRejectedValue(error);

            await expect(updateAppSettings(mockAppSettings)).rejects.toThrow('Network error');

            expect(mockConsoleError).toHaveBeenCalledWith('Error updating app settings:', error);
            expect(mockSetDoc).not.toHaveBeenCalled();
        });
    });

    describe('Default Settings Structure', () => {
        test('should provide consistent default settings structure', async () => {
            mockGetDocs.mockResolvedValue(mockEmptySnapshot);

            const result = await getAppSettings();

            // Verify all required top-level properties exist
            expect(result).toHaveProperty('appName');
            expect(result).toHaveProperty('logoUrl');
            expect(result).toHaveProperty('primaryColor');
            expect(result).toHaveProperty('defaultLanguage');
            expect(result).toHaveProperty('defaultUserRole');
            expect(result).toHaveProperty('passwordPolicy');
            expect(result).toHaveProperty('globeSettings');
            expect(result).toHaveProperty('appearance');
            expect(result).toHaveProperty('notifications');
            expect(result).toHaveProperty('accessibility');

            // Verify nested objects have expected structures
            expect(result?.passwordPolicy).toHaveProperty('minLength');
            expect(result?.passwordPolicy).toHaveProperty('requireUppercase');
            expect(result?.passwordPolicy).toHaveProperty('requireNumber');
            expect(result?.passwordPolicy).toHaveProperty('requireSymbol');

            expect(result?.globeSettings).toHaveProperty('baseColor');
            expect(result?.globeSettings).toHaveProperty('markerColor');
            expect(result?.globeSettings).toHaveProperty('glowColor');
            expect(result?.globeSettings).toHaveProperty('scale');

            expect(result?.appearance).toHaveProperty('compactMode');
            expect(result?.appearance).toHaveProperty('customColors');
            expect(result?.appearance.customColors).toHaveProperty('primary');

            expect(result?.notifications).toHaveProperty('emailNotifications');
            expect(result?.notifications).toHaveProperty('pushNotifications');

            expect(result?.accessibility).toHaveProperty('fontSize');
            expect(result?.accessibility).toHaveProperty('highContrast');
        });

        test('should have valid default values', async () => {
            mockGetDocs.mockResolvedValue(mockEmptySnapshot);

            const result = await getAppSettings();

            expect(result?.appName).toBe('AccreditEx');
            expect(result?.defaultLanguage).toBe('en');
            expect(result?.defaultUserRole).toBe(UserRole.TeamMember);
            expect(typeof result?.passwordPolicy.minLength).toBe('number');
            expect(result?.passwordPolicy.minLength).toBeGreaterThan(0);
            expect(typeof result?.globeSettings.scale).toBe('number');
            expect(typeof result?.notifications.emailNotifications).toBe('boolean');
        });
    });

    describe('Error Edge Cases', () => {
        test('should handle null response from Firestore', async () => {
            mockGetDocs.mockResolvedValue(null);

            // This should not crash the app
            const result = await getAppSettings();

            expect(result).toBeDefined();
            expect(result?.appName).toBe('AccreditEx');
            expect(mockConsoleError).toHaveBeenCalled();
        });

        test('should handle partial settings data', async () => {
            const partialSnapshot = {
                empty: false,
                docs: [
                    {
                        id: 'partial-id',
                        data: () => ({
                            appName: 'Partial App',
                            // Missing other required fields
                        }),
                    },
                ],
            };
            mockGetDocs.mockResolvedValue(partialSnapshot);

            const result = await getAppSettings();

            expect(result?.appName).toBe('Partial App');
            // Should still return the partial data rather than defaults
            expect(result).toEqual({ appName: 'Partial App' });
        });
    });
});