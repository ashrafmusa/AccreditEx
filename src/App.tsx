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
import { aiAgentService } from "@/services/aiAgentService";
import { SecurityService } from "@/services/securityService";
import { useAppStore } from "@/stores/useAppStore";
import { useTenantStore } from "@/stores/useTenantStore";
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
const RegistrationPage = React.lazy(() => import("@/pages/RegistrationPage"));
const ProgramSelectorPage = React.lazy(
  () => import("@/pages/ProgramSelectorPage"),
);

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
  const currentUser = useUserStore((state) => state.currentUser);
  // OPTIMIZATION: Load users and projects on-demand instead of all at startup
  const fetchAllUsers = useUserStore((state) => state.fetchAllUsers);
  const fetchAllProjects = useProjectStore((state) => state.fetchAllProjects);

  useEffect(() => {
    // Pre-warm the Render AI backend on app load and keep it warm while active
    const stopKeepAlive = aiAgentService.startKeepAlive();
    return () => stopKeepAlive();
  }, []);

  useEffect(() => {
    // Unauthenticated public entry routes do not fetch tenant-protected collections on startup;
    // post-login hydration below loads appSettings, users, and projects once currentUser is ready.
    if (!currentUser?.id) {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  // FIX: Re-fetch app data, users, and projects AFTER currentUser and tenant organizationId are hydrated
  // (avoids racing 12 Firestore queries against user profile hydration during sign-in).
  useEffect(() => {
    if (!currentUser?.id) return;

    let cancelled = false;
    const hydratePostLoginData = async () => {
      try {
        if (
          currentUser.organizationId &&
          !useTenantStore.getState().organizationId
        ) {
          await useTenantStore
            .getState()
            .loadOrganizationForUser(currentUser.organizationId);
        }
        await withTimeout(fetchAllAppData(), 15000);
        if (!cancelled) {
          await Promise.all([fetchAllUsers(), fetchAllProjects()]).catch(() => {});
        }
      } catch {
        // Silent — non-fatal initialization fallback
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void hydratePostLoginData();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.organizationId, fetchAllAppData, fetchAllUsers, fetchAllProjects]);

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

  const currentUser = useUserStore((state) => state.currentUser);
  const location = useLocation();

  // Use public titles before sign-in and workspace titles after authentication.
  useDocumentTitle(
    navigation,
    currentUser || location.pathname === "/pitch"
      ? undefined
      : location.pathname === "/login"
        ? "login"
        : location.pathname === "/register"
          ? "register"
          : "landing",
  );

  // Initialize push notifications on native platforms
  usePushNotifications();

  const [authChecked, setAuthChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => !localStorage.getItem("accreditex-onboarding-complete"),
  );
  const [showProgramSelector, setShowProgramSelector] =
    useState<boolean>(false);

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

  // Check if user needs to select an accreditation program
  useEffect(() => {
    if (currentUser && !currentUser.profile?.accreditationProgram) {
      setShowProgramSelector(true);
    } else {
      setShowProgramSelector(false);
    }
  }, [currentUser]);

  // Redirect authenticated users away from public auth entry routes (/login, /register) to /dashboard
  useEffect(() => {
    if (
      currentUser &&
      (location.pathname === "/login" || location.pathname === "/register")
    ) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("accreditex-onboarding-complete", "true");
    localStorage.setItem("hasCompletedOnboarding", "true");
    setShowOnboarding(false);
  };

  // Listen for replay-tour event dispatched from DashboardHeader "Tour" button
  useEffect(() => {
    const handler = () => setShowOnboarding(true);
    window.addEventListener("accreditex:replay-tour", handler);
    return () => window.removeEventListener("accreditex:replay-tour", handler);
  }, []);

  // Combine auth check with lazy loading - single loading screen for protected routes
  const isPublicEntryPath =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/pitch";

  if (!authChecked && !isPublicEntryPath) {
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

    // /register — Self-service free trial registration
    if (location.pathname === "/register") {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
          }
        >
          <RegistrationPage />
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

  if (showProgramSelector) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <ProgramSelectorPage />
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
