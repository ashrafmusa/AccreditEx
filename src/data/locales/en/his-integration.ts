export const en = {
    // HIS Integration
    hisIntegration: 'HIS Integration',
    hisIntegrationDescription: 'Manage Healthcare Information System (HIS) configurations and connections',

    // Configuration Manager
    hisConfigurationManager: 'HIS Configuration Manager',
    createNewConfiguration: 'Create New Configuration',
    editConfiguration: 'Edit Configuration',
    configurationName: 'Configuration Name',
    configurationNamePlaceholder: 'e.g., Epic Production',
    hisType: 'HIS Type',
    baseUrl: 'Base URL',
    baseUrlPlaceholder: 'https://api.example.com',
    authType: 'Authentication Type',

    // HIS Types
    genericRestApi: 'Generic REST API',
    genericFhirServer: 'Generic FHIR Server',
    epicEhr: 'Epic EHR',
    cernerMillennium: 'Cerner Millennium',
    hl7v2: 'HL7 v2',
    medidata: 'Medidata',

    // Authentication Fields
    apiKey: 'API Key',
    apiKeyPlaceholder: 'Enter your API key',
    clientId: 'Client ID',
    clientIdPlaceholder: 'OAuth2 Client ID',
    clientSecret: 'Client Secret',
    clientSecretPlaceholder: 'OAuth2 Client Secret',
    username: 'Username',
    usernamePlaceholder: 'Username',
    password: 'Password',
    passwordPlaceholder: 'Password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Confirm password',
    customHeaders: 'Custom Headers',
    customHeadersPlaceholder: 'Enter custom headers (JSON format)',
    bearerToken: 'Bearer Token',
    bearerTokenPlaceholder: 'Enter your bearer token',

    // Configuration Options
    timeout: 'Timeout (ms)',
    timeoutPlaceholder: '30000',
    retryCount: 'Retry Count',
    retryCountPlaceholder: '3',
    retryDelay: 'Retry Delay (ms)',
    retryDelayPlaceholder: '1000',
    enabled: 'Enabled',

    // Sync Schedule Manager
    syncScheduleManager: 'Sync Schedule Manager',
    createSyncSchedule: 'Create Sync Schedule',
    editSyncSchedule: 'Edit Sync Schedule',
    syncFrequency: 'Sync Frequency',
    syncTime: 'Sync Time',
    dataTypesToSync: 'Data Types to Sync',
    selectDataTypes: 'Select which data types to sync',

    // Data Types
    patients: 'Patients',
    appointments: 'Appointments',
    medicalRecords: 'Medical Records',
    prescriptions: 'Prescriptions',
    labResults: 'Lab Results',

    // Sync Frequency Options
    hourly: 'Hourly',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    manual: 'Manual',

    // Sync Status Widget
    syncStatus: 'Sync Status',
    lastSyncTime: 'Last Sync Time',
    nextSyncTime: 'Next Sync Time',
    syncInProgress: 'Sync in Progress',
    syncCompleted: 'Sync Completed',
    syncFailed: 'Sync Failed',
    manualSync: 'Manual Sync',

    // Sync Progress Bar
    syncProgress: 'Sync Progress',
    syncingRecords: 'Syncing {current} of {total} records',

    // Conflict Resolver
    conflictResolver: 'Conflict Resolver',
    unresolvedConflicts: 'Unresolved Conflicts',
    conflictDetails: 'Conflict Details',
    selectResolutionAction: 'Select Resolution Action',
    keepLocal: 'Keep Local Version',
    keepRemote: 'Keep Remote Version',
    mergeConflict: 'Merge Both Versions',
    resolveConflict: 'Resolve Conflict',

    // Integration Dashboard
    integrationDashboard: 'Integration Dashboard',
    activeConnections: 'Active Connections',
    totalSyncs: 'Total Syncs',
    successfulSyncs: 'Successful Syncs',
    failedSyncs: 'Failed Syncs',
    syncSuccessRate: 'Sync Success Rate',

    // Actions and Buttons
    testConnection: 'Test Connection',
    saveConfiguration: 'Save Configuration',
    deleteConfiguration: 'Delete Configuration',
    cancelOperation: 'Cancel',
    startSync: 'Start Sync',
    stopSync: 'Stop Sync',
    retrySync: 'Retry Sync',

    // Messages
    connectionSuccessful: 'Connection test successful',
    connectionFailed: 'Connection test failed',
    configurationSaved: 'Configuration saved successfully',
    configurationDeleted: 'Configuration deleted successfully',
    syncStarted: 'Sync started successfully',
    syncStopped: 'Sync stopped successfully',
    areYouSureDelete: 'Are you sure you want to delete this configuration?',
    fieldsRequired: 'Please fill in all required fields',
    invalidUrl: 'Please enter a valid URL',
    passwordMismatch: 'Passwords do not match',
    required: 'This field is required',

    // Validation Messages
    configurationNameRequired: 'Configuration name is required',
    baseUrlRequired: 'Base URL is required',
    apiKeyRequired: 'API key is required',
    clientIdRequired: 'Client ID is required',
    clientSecretRequired: 'Client Secret is required',
    usernameRequired: 'Username is required',
    passwordRequired: 'Password is required',

    // Additional UI Labels
    dataManagement: 'Data Management',
    localData: 'Local Data',
    hisData: 'HIS Data',
    resolutionStrategy: 'Resolution Strategy',
    customValue: 'Custom Value',
    addConfiguration: 'Add Configuration',
    successCount: 'Success',
    errorCount: 'Errors',
    systemHealth: 'System Health',
};
