import React, { useState, useEffect, useRef } from "react";
import { NavigationState } from "@/types";
// FIX: Corrected import path for backendService
import { backendService } from "@/services/BackendService";
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
import { auth } from "@/firebase/firebaseConfig";

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
  // FIX: Added calls to fetch users and projects data on initialization.
  const fetchAllUsers = useUserStore((state) => state.fetchAllUsers);
  const fetchAllProjects = useProjectStore((state) => state.fetchAllProjects);


  useEffect(() => {
    const initializeApp = async () => {
      if (initialized.current) {
        return;
      }
      initialized.current = true;
      
      try {
        // Initialize backend (handles Firestore seeding) and fetch all data
        await backendService.initialize();
        // FIX: Fetch all data concurrently
        await Promise.all([
          fetchAllAppData(),
          fetchAllUsers(),
          fetchAllProjects(),
        ]);
      } catch (error) {
        console.error("Failed to initialize application:", error);
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
      document.documentElement.style.setProperty('--brand-primary-color', appSettings.primaryColor);
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
    () => !localStorage.getItem("accreditex-onboarding-complete")
  );

  useFirebaseAuth(); // This hook handles user state

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
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