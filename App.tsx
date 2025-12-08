import React, { useState, useEffect, useRef } from "react";
import { NavigationState, AppSettings, Language } from "@/types";
import Layout from "@/components/common/Layout";
import { LanguageProvider } from "@/components/common/LanguageProvider";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { ToastProvider } from "@/components/common/Toast";
import { useToast } from "@/hooks/useToast";
import MainRouter from "@/components/common/MainRouter";
import OnboardingPage from "@/pages/OnboardingPage";

import LoginPage from "@/pages/LoginPage";
import LoadingScreen from "@/components/common/LoadingScreen";
// FIX: Corrected import path for useProjectStore
import { useProjectStore } from "@/stores/useProjectStore";
// FIX: Corrected import path for useUserStore
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { useFirebaseAuth } from "@/firebase/firebaseHooks";
import { getAuthInstance } from "@/firebase/firebaseConfig";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AppInitializer />
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

const AppInitializer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [hasSettings, setHasSettings] = useState(false);
  const toast = useToast();
  const initialized = useRef(false);
  const appSettingsRef = useRef<any>(null);

  const fetchAllAppData = useAppStore((state) => state.fetchAllData);
  let appSettings = useAppStore((state) => state.appSettings);
  const setAppSettings = useAppStore((state) => state.setAppSettings);
  const initializationError = useAppStore((state) => state.initializationError);
  const clearInitializationError = useAppStore(
    (state) => state.clearInitializationError
  );
  // FIX: Added calls to fetch users and projects data on initialization.
  const fetchAllUsers = useUserStore((state) => state.fetchAllUsers);
  const fetchAllProjects = useProjectStore((state) => state.fetchAllProjects);

  // Define initialization logic outside useEffect so it can be reused for retry
  const initializeApp = async () => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    try {
      // MIGRATION: Removed backendService.initialize()
      // Firebase handles initialization automatically via firebaseConfig

      // Create a timeout promise (10 seconds - more reasonable)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Firebase connection timeout - data loading took too long"
              )
            ),
          10000
        )
      );

      try {
        // Fetch all data concurrently with timeout protection
        await Promise.race([
          Promise.all([fetchAllAppData(), fetchAllUsers(), fetchAllProjects()]),
          timeoutPromise,
        ]);
      } catch (timeoutError) {
        // If timeout, set default app settings so app can at least load
        console.warn("Firebase timeout, using offline mode:", timeoutError);

        // Set default appSettings to allow app to proceed
        if (!appSettings) {
          const defaultSettings: AppSettings = {
            appName: "Accreditex",
            logoUrl: "",
            primaryColor: "#3B82F6",
            defaultLanguage: "en" as Language,
            defaultUserRole: "User" as any,
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireNumber: true,
              requireSymbol: false,
            },
            globeSettings: {
              baseColor: "#1e40af",
              markerColor: "#ef4444",
              glowColor: "#3b82f6",
              scale: 1,
              darkness: 0.5,
              lightIntensity: 1,
              rotationSpeed: 0.1,
            },
            appearance: {
              compactMode: false,
              sidebarCollapsed: false,
              showAnimations: true,
              cardStyle: "default",
            },
            notifications: {
              emailNotifications: true,
              pushNotifications: true,
              taskReminders: true,
              projectUpdates: true,
              trainingDueDates: true,
              auditSchedules: true,
            },
            accessibility: {
              fontSize: "medium",
              highContrast: false,
              reduceMotion: false,
              screenReaderOptimized: false,
            },
          };
          setAppSettings(defaultSettings);
          appSettingsRef.current = defaultSettings;
          setHasSettings(true);
        }

        // Notify user but don't fail completely
        const errorMsg =
          timeoutError instanceof Error
            ? timeoutError.message
            : "Failed to connect to server";
        setInitError(errorMsg);
        toast.warning(`App loaded in offline mode: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Failed to initialize application:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setInitError(errorMsg);
      toast.error("Failed to load application. " + errorMsg);

      // Set minimal default settings to allow app to load
      if (!appSettings) {
        const defaultSettings: AppSettings = {
          appName: "Accreditex",
          logoUrl: "",
          primaryColor: "#3B82F6",
          defaultLanguage: "en" as Language,
          defaultUserRole: "User" as any,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireNumber: true,
            requireSymbol: false,
          },
          globeSettings: {
            baseColor: "#1e40af",
            markerColor: "#ef4444",
            glowColor: "#3b82f6",
            scale: 1,
            darkness: 0.5,
            lightIntensity: 1,
            rotationSpeed: 0.1,
          },
          appearance: {
            compactMode: false,
            sidebarCollapsed: false,
            showAnimations: true,
            cardStyle: "default",
          },
          notifications: {
            emailNotifications: true,
            pushNotifications: true,
            taskReminders: true,
            projectUpdates: true,
            trainingDueDates: true,
            auditSchedules: true,
          },
          accessibility: {
            fontSize: "medium",
            highContrast: false,
            reduceMotion: false,
            screenReaderOptimized: false,
          },
        };
        setAppSettings(defaultSettings);
        appSettingsRef.current = defaultSettings;
        setHasSettings(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeApp();
  }, [
    fetchAllAppData,
    fetchAllUsers,
    fetchAllProjects,
    appSettings,
    setAppSettings,
    toast,
    initializationError,
    clearInitializationError,
  ]);

  // Handle retry for initialization errors
  const handleRetryInitialization = () => {
    setIsLoading(true);
    setHasSettings(false);
    clearInitializationError();
    initialized.current = false;
    initializeApp();
  };

  // Set the primary color theme variable when app settings load/change.
  useEffect(() => {
    if (appSettings?.primaryColor) {
      document.documentElement.style.setProperty(
        "--brand-primary-color",
        appSettings.primaryColor
      );
    }
  }, [appSettings?.primaryColor]);

  if (isLoading || !hasSettings) {
    return <LoadingScreen />;
  }

  // Show error screen with retry button if initialization failed and we have an error
  if (initializationError && !isLoading) {
    return (
      <div className="min-h-screen bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Initialization Error
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {initializationError}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              The application encountered an error while initializing. Please
              try again.
            </p>
            <button
              onClick={handleRetryInitialization}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Retry Initialization
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AppManager />;
};

const AppManager: React.FC = () => {
  const [navigation, setNavigation] = useState<NavigationState>({
    view: "dashboard",
  });

  const currentUser = useUserStore((state) => state.currentUser);
  const [authChecked, setAuthChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => !localStorage.getItem("accreditex-onboarding-complete")
  );

  useFirebaseAuth(); // This hook handles user state

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("accreditex-onboarding-complete", "true");
    setShowOnboarding(false);
  };

  if (!authChecked) {
    return <LoadingScreen />; // Show loading screen while checking auth
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  if (showOnboarding) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary">
      <Layout setNavigation={setNavigation} navigation={navigation}>
        <MainRouter navigation={navigation} setNavigation={setNavigation} />
      </Layout>
    </div>
  );
};

export default App;