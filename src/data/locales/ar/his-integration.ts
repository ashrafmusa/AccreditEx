export const ar = {
    // HIS Integration
    hisIntegration: 'تكامل نظام المعلومات الصحية',
    hisIntegrationDescription: 'إدارة تكوينات واتصالات نظام المعلومات الصحية (HIS)',
    
    // Configuration Manager
    hisConfigurationManager: 'مدير تكوين HIS',
    createNewConfiguration: 'إنشاء تكوين جديد',
    editConfiguration: 'تعديل التكوين',
    configurationName: 'اسم التكوين',
    configurationNamePlaceholder: 'مثال: Epic الإنتاج',
    hisType: 'نوع HIS',
    baseUrl: 'عنوان URL الأساسي',
    baseUrlPlaceholder: 'https://api.example.com',
    authType: 'نوع المصادقة',
    
    // HIS Types
    genericRestApi: 'واجهة REST عامة',
    genericFhirServer: 'خادم FHIR عام',
    epicEhr: 'Epic EHR',
    cernerMillennium: 'Cerner Millennium',
    hl7v2: 'HL7 v2',
    medidata: 'Medidata',
    
    // Authentication Fields
    apiKey: 'مفتاح API',
    apiKeyPlaceholder: 'أدخل مفتاح API الخاص بك',
    clientId: 'معرّف العميل',
    clientIdPlaceholder: 'معرّف عميل OAuth2',
    clientSecret: 'سر العميل',
    clientSecretPlaceholder: 'سر عميل OAuth2',
    username: 'اسم المستخدم',
    usernamePlaceholder: 'اسم المستخدم',
    password: 'كلمة المرور',
    passwordPlaceholder: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
    customHeaders: 'رؤوس مخصصة',
    customHeadersPlaceholder: 'أدخل رؤوس مخصصة (بصيغة JSON)',
    bearerToken: 'Bearer Token',
    bearerTokenPlaceholder: 'أدخل bearer token الخاص بك',
    
    // Configuration Options
    timeout: 'المهلة الزمنية (ميلي ثانية)',
    timeoutPlaceholder: '30000',
    retryCount: 'عدد المحاولات',
    retryCountPlaceholder: '3',
    retryDelay: 'تأخير المحاولة (ميلي ثانية)',
    retryDelayPlaceholder: '1000',
    enabled: 'مفعّل',
    
    // Sync Schedule Manager
    syncScheduleManager: 'مدير جدول المزامنة',
    createSyncSchedule: 'إنشاء جدول مزامنة',
    editSyncSchedule: 'تعديل جدول المزامنة',
    syncFrequency: 'تكرار المزامنة',
    syncTime: 'وقت المزامنة',
    dataTypesToSync: 'أنواع البيانات للمزامنة',
    selectDataTypes: 'حدد أنواع البيانات للمزامنة',
    
    // Data Types
    patients: 'المريضات',
    appointments: 'المواعيد',
    medicalRecords: 'السجلات الطبية',
    prescriptions: 'الوصفات الطبية',
    labResults: 'نتائج الاختبار',
    
    // Sync Frequency Options
    hourly: 'كل ساعة',
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    manual: 'يدوي',
    
    // Sync Status Widget
    syncStatus: 'حالة المزامنة',
    lastSyncTime: 'آخر وقت مزامنة',
    nextSyncTime: 'وقت المزامنة التالي',
    syncInProgress: 'المزامنة جارية',
    syncCompleted: 'اكتملت المزامنة',
    syncFailed: 'فشلت المزامنة',
    manualSync: 'مزامنة يدوية',
    
    // Sync Progress Bar
    syncProgress: 'تقدم المزامنة',
    syncingRecords: 'جاري مزامنة {current} من {total} سجل',
    
    // Conflict Resolver
    conflictResolver: 'محلّل التضارب',
    unresolvedConflicts: 'التضاربات غير المحلولة',
    conflictDetails: 'تفاصيل التضارب',
    selectResolutionAction: 'حدد إجراء القرار',
    keepLocal: 'احتفظ بالإصدار المحلي',
    keepRemote: 'احتفظ بالإصدار البعيد',
    mergeConflict: 'دمج كلا الإصدارين',
    resolveConflict: 'حل التضارب',
    
    // Integration Dashboard
    integrationDashboard: 'لوحة تحكم التكامل',
    activeConnections: 'الاتصالات النشطة',
    totalSyncs: 'إجمالي المزامنات',
    successfulSyncs: 'المزامنات الناجحة',
    failedSyncs: 'المزامنات الفاشلة',
    syncSuccessRate: 'معدل نجاح المزامنة',
    
    // Actions and Buttons
    testConnection: 'اختبار الاتصال',
    saveConfiguration: 'حفظ التكوين',
    deleteConfiguration: 'حذف التكوين',
    cancelOperation: 'إلغاء',
    startSync: 'بدء المزامنة',
    stopSync: 'إيقاف المزامنة',
    retrySync: 'أعد محاولة المزامنة',
    
    // Messages
    connectionSuccessful: 'اختبار الاتصال ناجح',
    connectionFailed: 'فشل اختبار الاتصال',
    configurationSaved: 'تم حفظ التكوين بنجاح',
    configurationDeleted: 'تم حذف التكوين بنجاح',
    syncStarted: 'بدأت المزامنة بنجاح',
    syncStopped: 'توقفت المزامنة بنجاح',
    areYouSureDelete: 'هل أنت متأكد من رغبتك في حذف هذا التكوين؟',
    fieldsRequired: 'يرجى ملء جميع الحقول المطلوبة',
    invalidUrl: 'يرجى إدخال عنوان URL صحيح',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    required: 'هذا الحقل مطلوب',
    
    // Validation Messages
    configurationNameRequired: 'اسم التكوين مطلوب',
    baseUrlRequired: 'عنوان URL الأساسي مطلوب',
    apiKeyRequired: 'مفتاح API مطلوب',
    clientIdRequired: 'معرّف العميل مطلوب',
    clientSecretRequired: 'سر العميل مطلوب',
    usernameRequired: 'اسم المستخدم مطلوب',
    passwordRequired: 'كلمة المرور مطلوبة',
};
