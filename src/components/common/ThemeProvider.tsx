import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { Theme } from "@/types";
import { useAppStore } from "@/stores/useAppStore";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isSystemDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper function to check system preference
const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// Helper function to safely get stored theme
const getStoredTheme = (): Theme | null => {
  try {
    const stored = localStorage.getItem("accreditex-theme");
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(
    () => getStoredTheme() || getSystemTheme()
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSystemDark, setIsSystemDark] = useState(false);

  // Subscribe to appSettings changes
  const appSettings = useAppStore((state) => state.appSettings);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const storedTheme = getStoredTheme();
      const systemTheme = getSystemTheme();

      setIsSystemDark(systemTheme === "dark");

      if (storedTheme) {
        setTheme(storedTheme);
      } else {
        setTheme(systemTheme);
      }
    } catch (error) {
      console.error("Failed to load theme preference:", error);
      setTheme("light");
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Apply custom colors from appSettings (reactive to changes)
  useEffect(() => {
    if (appSettings?.appearance?.customColors) {
      const { primary, success, warning, danger } =
        appSettings.appearance.customColors;
      const root = document.documentElement;
      root.style.setProperty("--user-primary", primary);
      root.style.setProperty("--user-success", success);
      root.style.setProperty("--user-warning", warning);
      root.style.setProperty("--user-danger", danger);
    }
  }, [appSettings]);

  // Apply theme to document and persist
  useEffect(() => {
    if (!isInitialized) return;

    try {
      console.log(
        "📱 Applying theme:",
        theme,
        "| Dark class:",
        theme === "dark" ? "added" : "removed"
      );
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("accreditex-theme", theme);
      console.log("✅ Theme applied successfully");
    } catch (error) {
      console.error("Failed to apply theme:", error);
    }
  }, [theme, isInitialized]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const isDark = "matches" in e ? e.matches : (e as MediaQueryList).matches;
      setIsSystemDark(isDark);

      // Only auto-switch if user hasn't explicitly set a preference
      const storedTheme = getStoredTheme();
      if (!storedTheme) {
        setTheme(isDark ? "dark" : "light");
      }
    };

    // Use modern addEventListener if available, fallback to addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      const legacyQuery = mediaQuery as MediaQueryList & {
        addListener: (handler: (e: MediaQueryListEvent) => void) => void;
        removeListener: (handler: (e: MediaQueryListEvent) => void) => void;
      };
      legacyQuery.addListener(handleChange);
      return () => legacyQuery.removeListener(handleChange);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      console.log("🌓 Theme toggled:", prevTheme, "→", newTheme);
      return newTheme;
    });
  }, []);

  const handleSetTheme = useCallback((newTheme: Theme) => {
    console.log("🎨 Theme set to:", newTheme);
    setTheme(newTheme);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setTheme: handleSetTheme, isSystemDark }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
