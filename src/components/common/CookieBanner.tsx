/**
 * CookieBanner — GDPR / UAE PDPL-aligned cookie consent banner.
 * Shows on first visit. Stores preference in localStorage.
 * Only strictly necessary cookies (auth session) are used regardless of choice.
 * Analytics/functional cookies are no-ops until accepted.
 *
 * Usage: Mount once in App.tsx after <ThemeProvider>
 */

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

const STORAGE_KEY = "accreditex:cookie-consent";

type ConsentState = "accepted" | "declined" | null;

function getStoredConsent(): ConsentState {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "accepted" || v === "declined") return v;
  } catch {
    // localStorage blocked (private mode, etc.)
  }
  return null;
}

function storeConsent(v: "accepted" | "declined"): void {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    // ignore
  }
}

/** Call this to check whether non-essential cookies are consented. */
export function hasCookieConsent(): boolean {
  return getStoredConsent() === "accepted";
}

const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if no decision stored yet
    if (getStoredConsent() === null) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    storeConsent("accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    storeConsent("declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
          className="fixed bottom-0 inset-x-0 z-[9998] p-4 flex justify-center"
        >
          <div className="w-full max-w-3xl bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon */}
            <span className="text-2xl shrink-0" aria-hidden>
              🍪
            </span>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary font-semibold mb-0.5">
                We use cookies
              </p>
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary leading-relaxed">
                AccrediTex uses strictly necessary cookies for authentication
                and optional functional cookies for preferences (language, dark
                mode).{" "}
                <a
                  href="/privacy-policy.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-primary underline underline-offset-2"
                >
                  Privacy Policy
                </a>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDecline}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-brand-border dark:border-dark-brand-border text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-brand-background dark:hover:bg-dark-brand-background transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
