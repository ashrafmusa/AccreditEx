import CookieBanner from "@/components/common/CookieBanner";
import GlobalConfirmDialog from "@/components/common/GlobalConfirmDialog";
import { LanguageProvider } from "@/components/common/LanguageProvider";
import Layout from "@/components/common/Layout";
import LoadingScreen from "@/components/common/LoadingScreen";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { ToastProvider } from "@/components/common/Toast";
import TrialBanner from "@/components/common/TrialBanner";
import { useToast } from "@/hooks/useToast";
import React, { Suspense, useEffect, useRef, useState } from "react";
// FIX: Corrected import path for useProjectStore
import { useProjectStore } from "@/stores/useProjectStore";
// FIX: Corrected import path for useUserStore
import { getAuthInstance } from "@/firebase/firebaseConfig";
import { useFirebaseAuth } from "@/firebase/firebaseHooks";
import { SecurityService } from "@/services/securityService";
import { useAppStore } from "@/stores/useAppStore";
import { useUserStore } from "@/stores/useUserStore";

// Lazy load heavy components
const MainRouter = React.lazy(() => import("@/components/common/MainRouter"));
// Import AppRouter but don't lazy load it as it's small and needed immediately
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useNavigation } from "@/hooks/useNavigation";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { AppRouter } from "@/router/AppRouter";
import { useLocation, useNavigate } from "react-router-dom";

const OnboardingPage = React.lazy(() => import("@/pages/OnboardingPage"));
const LoginPage = React.lazy(() => import("@/pages/LoginPage"));
const LandingPage = React.lazy(() => import("@/pages/LandingPage"));
const PitchDeckPage = React.lazy(() => import("@/pages/PitchDeckPage"));

// AI Assistant Component — lazy loaded (not needed until user is authenticated & idle)
const AIAssistant = React.lazy(() =>
  import("@/components/ai/AIAssistant").then((m) => ({
    default: m.AIAssistant,
  })),
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AppInitializer /> <CookieBanner />{" "}
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

const AppInitializer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const initialized = useRef(false);
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const shouldBlockForInitialization =
    currentPath !== "/" && currentPath !== "/login" && currentPath !== "/pitch";

  const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(
          () =>
            reject(new Error(`Initialization timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  };

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
        await withTimeout(fetchAllAppData(), 15000);

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

  if (isLoading && shouldBlockForInitialization) {
    return <LoadingScreen />;
  }

  return (
    <AppRouter>
      <AppManager />
    </AppRouter>
  );
};

const AppManager: React.FC = () => {
  // Use the new navigation hook that syncs with URL
  const { navigation, setNavigation } = useNavigation({
    view: "dashboard",
  });

  // Use the document title hook for SEO
  useDocumentTitle(navigation);

  // Initialize push notifications on native platforms
  usePushNotifications();

  const currentUser = useUserStore((state) => state.currentUser);
  const [authChecked, setAuthChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => !localStorage.getItem("accreditex-onboarding-complete"),
  );

  const location = useLocation();
  const navigate = useNavigate();

  useFirebaseAuth(); // This hook handles user state

  // SEC-H3: Automatic session timeout (2026-04-17)
  // Polls every 60 s; if the user has been inactive beyond the configured timeout
  // window, they are logged out automatically.
  useEffect(() => {
    if (!currentUser) return;

    const security = SecurityService.getInstance();

    // Track any user interaction to refresh the "last activity" timestamp
    const resetActivity = () => security.updateLastActivity();
    const events = [
      "mousemove",
      "keydown",
      "pointerdown",
      "scroll",
      "touchstart",
    ];
    events.forEach((ev) =>
      window.addEventListener(ev, resetActivity, { passive: true }),
    );

    // Initialize timestamp on mount so the countdown starts from now
    security.updateLastActivity();

    const timer = setInterval(async () => {
      const timedOut = await security.checkSessionTimeout();
      if (timedOut) {
        await security.logoutDueToInactivity();
        navigate("/login");
      }
    }, 60_000); // check every 60 seconds

    return () => {
      clearInterval(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetActivity));
    };
  }, [currentUser, navigate]);

  useFirebaseAuth(); // This hook handles user state

  useEffect(() => {
    const auth = getAuthInstance();
    // Optimization: Check current auth state synchronously to avoid unnecessary loading delay
    const currentAuthUser = auth.currentUser;
    if (currentAuthUser !== null) {
      // Auth state already known (user logged in or definitely logged out)
      setAuthChecked(true);
    }

    // Subscribe to auth changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("accreditex-onboarding-complete", "true");
    localStorage.setItem("hasCompletedOnboarding", "true");
    setShowOnboarding(false);
  };

  // Combine auth check with lazy loading - single loading screen
  if (!authChecked) {
    return <LoadingScreen />; // Show loading screen while checking auth
  }

  // PUBLIC ROUTES — accessible without authentication
  if (!currentUser) {
    // /pitch — Investor pitch deck
    if (location.pathname === "/pitch") {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
          }
        >
          <PitchDeckPage />
        </Suspense>
      );
    }

    // /login — Direct login page
    if (location.pathname === "/login") {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
          }
        >
          <LoginPage />
        </Suspense>
      );
    }

    // Everything else — Marketing landing page
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
        }
      >
        <LandingPage onLogin={() => navigate("/login")} />
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-9999 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-md focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <TrialBanner setNavigation={setNavigation} />
      <Layout setNavigation={setNavigation} navigation={navigation}>
        <main id="main-content">
          <Suspense fallback={<LoadingScreen />}>
            <MainRouter navigation={navigation} setNavigation={setNavigation} />
          </Suspense>
        </main>
      </Layout>
      {/* AI Assistant - Lazy loaded, available when logged in */}
      <Suspense fallback={null}>
        <AIAssistant />
      </Suspense>
      {/* Global confirm dialog - driven by useConfirmStore, replaces window.confirm */}
      <GlobalConfirmDialog />
    </div>
  );
};

export default App;
