import React, { useState, useEffect, useRef, Suspense } from "react";
import { NavigationState } from "@/types";
import Layout from "@/components/common/Layout";
import { LanguageProvider } from "@/components/common/LanguageProvider";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { ToastProvider } from "@/components/common/Toast";
import { useToast } from "@/hooks/useToast";
import LoadingScreen from "@/components/common/LoadingScreen";
// FIX: Corrected import path for useProjectStore
import { useProjectStore } from "@/stores/useProjectStore";
// FIX: Corrected import path for useUserStore
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { useFirebaseAuth } from "@/firebase/firebaseHooks";
import { getAuthInstance } from "@/firebase/firebaseConfig";

// Lazy load heavy components
const MainRouter = React.lazy(() => import("@/components/common/MainRouter"));
const OnboardingPage = React.lazy(() => import("@/pages/OnboardingPage"));
const LoginPage = React.lazy(() => import("@/pages/LoginPage"));

// AI Assistant Component
import { AIAssistant } from "@/components/ai/AIAssistant";

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
  const toast = useToast();
  const initialized = useRef(false);

  const fetchAllAppData = useAppStore((state) => state.fetchAllData);
  const appSettings = useAppStore((state) => state.appSettings);
  // OPTIMIZATION: Load users and projects on-demand instead of all at startup
  const fetchAllUsers = useUserStore((state) => state.fetchAllUsers);
  const fetchAllProjects = useProjectStore((state) => state.fetchAllProjects);

  useEffect(() => {
    const initializeApp = async () => {
      if (initialized.current) {
        return;
      }
      initialized.current = true;

      try {
        // OPTIMIZATION: Only fetch critical app settings on startup
        // Users and projects load on-demand via lazy loading
        await fetchAllAppData();

        // Optionally pre-fetch users and projects in background after settings load
        // This happens after the UI is interactive
        setTimeout(() => {
          Promise.all([fetchAllUsers(), fetchAllProjects()]).catch(() => {
            // Silently handle errors - data will load on-demand
          });
        }, 1000);
      } catch (error) {
        toast.error("Failed to load application data. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, [fetchAllAppData, fetchAllUsers, fetchAllProjects, toast]);

  // Set the primary color theme variable when app settings load/change.
  useEffect(() => {
    if (appSettings?.primaryColor) {
      document.documentElement.style.setProperty(
        "--user-primary",
        appSettings.primaryColor,
      );
    }
  }, [appSettings?.primaryColor]);

  if (isLoading || !appSettings) {
    return <LoadingScreen />;
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
    () => !localStorage.getItem("accreditex-onboarding-complete"),
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
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LoginPage />
      </Suspense>
    );
  }

  if (showOnboarding) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <OnboardingPage onComplete={handleOnboardingComplete} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary">
      <Layout setNavigation={setNavigation} navigation={navigation}>
        <Suspense fallback={<LoadingScreen />}>
          <MainRouter navigation={navigation} setNavigation={setNavigation} />
        </Suspense>
      </Layout>
      {/* AI Assistant - Always available when logged in */}
      <AIAssistant />
    </div>
  );
};

export default App;
