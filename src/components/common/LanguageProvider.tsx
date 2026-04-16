import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Language, Direction } from "@/types";

interface LanguageContextType {
  lang: Language;
  dir: Direction;
  toggleLang: () => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  dir: "ltr",
  toggleLang: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLang] = useState<Language>("en");
  const [dir, setDir] = useState<Direction>("ltr");

  useEffect(() => {
    const newDir = lang === "ar" ? "rtl" : "ltr";
    setDir(newDir);
    document.documentElement.lang = lang;
    document.documentElement.dir = newDir;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prevLang) => (prevLang === "en" ? "ar" : "en"));
  }, []);

  // Memoize context value to prevent unnecessary re-renders of all consumers
  // This prevents 295+ components from re-rendering just because the context object reference changed
  const contextValue = useMemo(
    () => ({ lang, dir, toggleLang }),
    [lang, dir, toggleLang],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};
