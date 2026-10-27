import { Button, ErrorMessage } from "@/components/ui";
import { getAuthInstance } from "@/firebase/firebaseConfig";
import {
  biometricLogin,
  checkBiometricAvailability,
  enableBiometric,
  type BiometricStatus,
} from "@/services/nativeBiometricService";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { Suspense, useEffect, useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  FingerPrintIcon,
  SpinnerIcon,
} from "../components/icons";
import { useTranslation } from "../hooks/useTranslation";
import { useAppStore } from "../stores/useAppStore";
import { useUserStore } from "../stores/useUserStore";
import PublicPageHeader from "@/components/common/PublicPageHeader";
import { Link } from "react-router-dom";
const Globe = React.lazy(() => import("../components/ui/Globe"));

interface LoginPageProps {
  // onLogin prop is no longer needed
}

const getLoginErrorMessage = (
  error: unknown,
  t: (key: string) => string,
): string => {
  if (!(error instanceof FirebaseError)) {
    return t("loginFailed") || "Login failed. Please try again.";
  }

  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return t("invalidCredentials") || "Invalid email or password.";
    case "auth/user-disabled":
      return (
        t("accountDisabled") ||
        "This account is disabled. Please contact your administrator."
      );
    case "auth/too-many-requests":
      return (
        t("tooManyLoginAttempts") ||
        "Too many login attempts. Please wait a few minutes and try again."
      );
    case "auth/network-request-failed":
      return (
        t("networkError") ||
        "Network error. Please check your connection and try again."
      );
    default:
      return t("loginFailed") || "Login failed. Please try again.";
  }
};

const LoginPage: React.FC<LoginPageProps> = () => {
  const { t, dir } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetNotice, setResetNotice] = useState("");
  const [biometricStatus, setBiometricStatus] =
    useState<BiometricStatus | null>(null);
  const login = useUserStore((state) => state.login);
  const appSettings = useAppStore((state) => state.appSettings);
  const fallbackGlobeSettings = {
    baseColor: "#1e3a5f",
    markerColor: "#2dd4bf",
    glowColor: "#14b8a6",
    scale: 1.05,
    darkness: 0.35,
    lightIntensity: 2.0,
    rotationSpeed: 0.004,
  };

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability().then((status) => {
      if (status.isAvailable && status.isEnabled) {
        setBiometricStatus(status);
      }
    });
  }, []);

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError("");
    setResetNotice("");
    try {
      const credentials = await biometricLogin();
      if (credentials) {
        try {
          const user = await login(credentials.email, credentials.password);
          if (!user) {
            // If Firebase Auth succeeded but profile hydration is still in progress,
            // avoid showing a false invalid-credentials message.
            const authUser = getAuthInstance().currentUser;
            if (!authUser) {
              setError(t("invalidCredentials") || "Invalid email or password.");
            }
          }
        } catch (error) {
          setError(getLoginErrorMessage(error, t));
        }
      }
    } catch {
      setError(
        t("biometricFailed") ||
          "Biometric authentication failed. Please use your password.",
      );
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetNotice("");
    setLoading(true);
    try {
      try {
        const user = await login(email, password);
        if (!user) {
          // If Firebase Auth succeeded but profile hydration is still in progress,
          // avoid showing a false invalid-credentials message.
          const authUser = getAuthInstance().currentUser;
          if (!authUser) {
            setError(t("invalidCredentials") || "Invalid email or password.");
          }
        } else {
          // Offer to enable biometric on successful login (native only)
          checkBiometricAvailability().then((status) => {
            if (status.isAvailable && !status.isEnabled && email && password) {
              enableBiometric(email, password).catch(() => {
                // Silently fail — biometric is optional
              });
            }
          });
        }
      } catch (error) {
        setError(getLoginErrorMessage(error, t));
      }
      // onLogin is no longer needed here; the auth listener handles the UI change.
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setResetNotice("");

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError(
        t("enterEmailForReset") ||
          "Enter your work email first, then use Forgot Password.",
      );
      return;
    }

    setResetLoading(true);
    try {
      const auth = getAuthInstance();
      await sendPasswordResetEmail(auth, normalizedEmail);
      setResetNotice(
        t("passwordResetSent") ||
          "Password reset email sent. Please check your inbox.",
      );
    } catch {
      setError(
        t("passwordResetFailed") ||
          "Could not send reset email. Contact your hospital administrator if the issue persists.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  const globeSettings = appSettings?.globeSettings ?? fallbackGlobeSettings;
  return (
    <div
      dir={dir}
      className="min-h-screen bg-brand-background text-brand-text-primary dark:bg-dark-brand-background dark:text-dark-brand-text-primary"
    >
      <PublicPageHeader />
      <main
        id="public-main"
        tabIndex={-1}
        className="grid min-h-[calc(100svh-85px)] grid-cols-1 lg:grid-cols-2"
      >
        {/* Left Side: Form */}
        <div className="flex flex-col justify-center items-center px-4 py-10 sm:p-8 relative z-10">
          <div className="w-full max-w-md">
            <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 sm:p-8 rounded-3xl shadow-xl shadow-brand-primary/5 border border-brand-border dark:border-dark-brand-border">
              <div className="flex flex-col items-center text-center gap-3 mb-8 animate-[scaleIn_0.5s_ease-out]">
                <img
                  src={appSettings?.logoUrl || "/logo.webp"}
                  alt="AccreditEx Logo"
                  width={48}
                  height={48}
                  loading="eager"
                  className="h-12 w-12 object-contain"
                />
                <p className="text-xl font-bold">
                  <span className="text-brand-text-primary dark:text-dark-brand-text-primary">
                    Accredit
                  </span>
                  <span className="text-brand-primary">Ex</span>
                </p>
                <h1 className="text-3xl font-bold">
                  {t("public_login_title")}
                </h1>
                <p className="text-sm leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("public_login_subtitle")}
                </p>
              </div>
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                dir={dir}
                aria-describedby={error ? "login-error" : undefined}
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("emailAddress")}
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-background px-4 py-3 text-brand-text-primary outline-none focus:ring-2 focus:ring-brand-primary dark:border-dark-brand-border dark:bg-dark-brand-background dark:text-dark-brand-text-primary"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("password")}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-background py-3 ps-4 pe-12 text-brand-text-primary outline-none focus:ring-2 focus:ring-brand-primary dark:border-dark-brand-border dark:bg-dark-brand-background dark:text-dark-brand-text-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-brand-text-secondary hover:bg-brand-primary/10 dark:text-dark-brand-text-secondary"
                      aria-label={t(
                        showPassword
                          ? "public_hidePassword"
                          : "public_showPassword",
                      )}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={resetLoading}
                      className="font-medium text-brand-primary hover:text-sky-600"
                    >
                      {resetLoading
                        ? t("sendingReset") || "Sending..."
                        : t("forgotPassword")}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("public_login_access")}
                </p>

                <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                  {t("public_login_legal")}{" "}
                  <a
                    href="/terms-of-service.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-brand-primary"
                  >
                    {t("landing_footer_terms")}
                  </a>{" "}
                  {t("public_and")}{" "}
                  <a
                    href="/privacy-policy.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-brand-primary"
                  >
                    {t("landing_footer_privacy")}
                  </a>
                  .
                </p>

                {resetNotice && (
                  <div
                    role="status"
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                  >
                    {resetNotice}
                  </div>
                )}

                {error && (
                  <div id="login-error">
                    <ErrorMessage message={error} />
                  </div>
                )}

                {/* Biometric Login Button (native only) */}
                {biometricStatus?.isAvailable && biometricStatus?.isEnabled && (
                  <button
                    type="button"
                    onClick={handleBiometricLogin}
                    disabled={biometricLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-brand-primary text-brand-primary hover:bg-brand-primary/10 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {biometricLoading ? (
                      <SpinnerIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      <FingerPrintIcon className="w-5 h-5" />
                    )}
                    {biometricStatus.biometryType === "face"
                      ? t("loginWithFace") || "Sign in with Face ID"
                      : t("loginWithFingerprint") || "Sign in with Fingerprint"}
                  </button>
                )}

                <div>
                  <Button
                    type="submit"
                    disabled={loading}
                    loading={loading}
                    className="w-full"
                  >
                    {t("loginButton")}
                  </Button>
                </div>
              </form>
            </div>
            <p className="mt-6 text-center text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("public_login_new")}{" "}
              <Link
                to="/register"
                className="font-semibold text-brand-primary underline underline-offset-4"
              >
                {t("public_trial")}
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side: Globe */}
        <aside className="hidden lg:flex relative flex-col items-center justify-center gap-6 p-10 overflow-hidden border-s border-brand-border bg-brand-primary/5 dark:border-dark-brand-border">
          <div className="relative z-10 max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">
              {t("public_hero_eyebrow")}
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              {t("public_login_value")}
            </h2>
            <p className="mt-4 leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("public_login_value_body")}
            </p>
          </div>
          <div aria-hidden="true" className="w-[420px] h-[420px] max-w-full">
            <Suspense
              fallback={
                <div className="w-full h-full animate-pulse bg-slate-200 dark:bg-slate-700 rounded-full" />
              }
            >
              <Globe width={420} height={420} {...globeSettings} />
            </Suspense>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default LoginPage;
