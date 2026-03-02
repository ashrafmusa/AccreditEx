import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import CommandPalette from "@/components/common/CommandPalette";
import Header from "@/components/common/Header";
import KeyboardShortcutsModal from "@/components/common/KeyboardShortcutsModal";
import MobileSidebar from "@/components/common/MobileSidebar";
import NavigationRail from "@/components/common/NavigationRail";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardNavigation";
import { useTranslation } from "@/hooks/useTranslation";
import { NavigationState, Notification } from "@/types";
import React, { lazy, Suspense, useEffect, useState } from "react";
// FIX: Corrected import path for notification service
import { getNotificationsForUser } from "@/services/notificationServiceFirebase";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";

// Lazy-load GuidedTour — only loaded when tour is active (zero bundle cost otherwise)
const GuidedTour = lazy(() => import("@/components/onboarding/GuidedTour"));

interface LayoutProps {
  navigation: NavigationState;
  setNavigation: (state: NavigationState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  navigation,
  setNavigation,
  children,
}) => {
  const { dir } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const [tourSteps, setTourSteps] = useState<any[]>([]);

  const currentUser = useUserStore((state) => state.currentUser)!;
  const projects = useProjectStore((state) => state.projects);
  const logout = useUserStore((state) => state.logout);
  const users = useUserStore((state) => state.users);

  const documents = useAppStore((state) => state.documents);
  const standards = useAppStore((state) => state.standards);
  const accreditationPrograms = useAppStore(
    (state) => state.accreditationPrograms,
  );

  // Breadcrumbs from navigation state
  const breadcrumbItems = useBreadcrumbs(navigation);

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "d",
      handler: () => {
        if (navigation.view !== "dashboard") {
          setNavigation({ view: "dashboard" });
        }
      },
    },
    {
      key: "p",
      handler: () => {
        if (navigation.view !== "projects") {
          setNavigation({ view: "projects" });
        }
      },
    },
    {
      key: "a",
      handler: () => {
        if (navigation.view !== "accreditationHub") {
          setNavigation({ view: "accreditationHub" });
        }
      },
    },
    {
      key: "t",
      handler: () => {
        if (navigation.view !== "training") {
          setNavigation({ view: "training" });
        }
      },
    },
    {
      key: "?",
      shiftKey: true,
      handler: () => setIsKeyboardShortcutsOpen(true),
    },
    {
      key: "/",
      handler: () => {
        const searchInput = document.querySelector(
          'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]',
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
    },
  ]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userNotifications = await getNotificationsForUser(currentUser.id);
        setNotifications((prevNotifications) => {
          if (
            JSON.stringify(prevNotifications) !==
            JSON.stringify(userNotifications)
          ) {
            return userNotifications;
          }
          return prevNotifications;
        });
      } catch (error) {
        // Silently handle notification fetch errors
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const handleMarkAsRead = async (notificationId: string | "all") => {
    try {
      const { markNotificationAsRead, markAllNotificationsAsRead } =
        await import("@/services/notificationServiceFirebase");
      if (notificationId === "all") {
        await markAllNotificationsAsRead(currentUser.id);
      } else {
        await markNotificationAsRead(notificationId);
      }
      // Refetch immediately after marking as read
      const updated = await getNotificationsForUser(currentUser.id);
      setNotifications(updated);
    } catch (error) {
      console.warn("Failed to mark notification as read:", error);
    }
  };

  const isProjectsActive = [
    "projects",
    "projectDetail",
    "createProject",
    "editProject",
  ].includes(navigation.view);
  const isSettingsActive = navigation.view === "settings";

  // Start guided tour for new users (after initial onboarding wizard)
  useEffect(() => {
    const hasCompletedOnboarding =
      localStorage.getItem("hasCompletedOnboarding") === "true";
    const hasCompletedTour =
      localStorage.getItem("accreditex_tour_completed_new-user") === "true";

    if (hasCompletedOnboarding && !hasCompletedTour) {
      // Delay tour start to let the dashboard render fully
      const timer = setTimeout(() => {
        import("@/data/tourSteps").then(({ newUserTourSteps }) => {
          setTourSteps(newUserTourSteps);
          setShowGuidedTour(true);
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      {/* Skip to main content link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        setIsOpen={setIsCommandPaletteOpen}
        setNavigation={setNavigation}
        projects={projects}
        users={users}
        documents={documents}
        standards={standards}
        programs={accreditationPrograms}
      />
      <div
        className={`flex h-screen ${dir === "rtl" ? "flex-row-reverse" : ""}`}
      >
        <div className="hidden sm:block">
          <NavigationRail
            setNavigation={setNavigation}
            navigation={navigation}
            isExpanded={isNavExpanded}
            setIsExpanded={setIsNavExpanded}
          />
        </div>
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          setNavigation={setNavigation}
          navigation={navigation}
          isProjectsActive={isProjectsActive}
          isSettingsActive={isSettingsActive}
        />
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            isNavExpanded ? "sm:ms-64" : "sm:ms-20"
          }`}
        >
          <Header
            navigation={navigation}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            notifications={notifications}
            setNavigation={setNavigation}
            onLogout={logout}
            onMarkAsRead={handleMarkAsRead}
          />
          <main
            id="main-content"
            role="main"
            aria-label="Main content"
            className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 bg-brand-background dark:bg-dark-brand-background page-enter-active scroll-smooth overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="max-w-7xl mx-auto">
              {breadcrumbItems.length > 0 && (
                <Breadcrumbs
                  items={breadcrumbItems}
                  setNavigation={setNavigation}
                />
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
      {/* Guided Tour Overlay — lazy-loaded, only renders when active */}
      {showGuidedTour && tourSteps.length > 0 && (
        <Suspense fallback={null}>
          <GuidedTour
            tourId="new-user"
            steps={tourSteps}
            isActive={showGuidedTour}
            onComplete={() => setShowGuidedTour(false)}
          />
        </Suspense>
      )}
      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />
    </>
  );
};

export default Layout;
