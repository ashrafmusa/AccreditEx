import { Button, ErrorMessage, Input } from "@/components/ui";
import { getAuthInstance } from "@/firebase/firebaseConfig";
import {
  biometricLogin,
  checkBiometricAvailability,
  enableBiometric,
  type BiometricStatus,
} from "@/services/nativeBiometricService";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { Suspense, useEffect, useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  FingerPrintIcon,
  LogoIcon,
  SpinnerIcon,
} from "../components/icons";
import { useTranslation } from "../hooks/useTranslation";
import { useAppStore } from "../stores/useAppStore";
import { useUserStore } from "../stores/useUserStore";
const Globe = React.lazy(() => import("../components/ui/Globe"));

interface LoginPageProps {
  // onLogin prop is no longer needed
}

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
        const user = await login(credentials.email, credentials.password);
        if (!user) {
          setError(
            t("invalidCredentialsEnterprise") ||
              t("invalidCredentials") ||
              "Invalid credentials or account not provisioned for your organization.",
          );
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
      const user = await login(email, password);
      if (!user) {
        setError(
          t("invalidCredentialsEnterprise") ||
            t("invalidCredentials") ||
            "Invalid credentials or account not provisioned for your organization.",
        );
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
  const userLocation = { lat: 24.7136, long: 46.6753 }; // Riyadh, Saudi Arabia

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 dark:bg-slate-900">
      {/* Left Side: Form */}
      <div className="flex flex-col justify-center items-center p-8 relative z-10">
        <div className="w-full max-w-sm">
          <div className="bg-brand-surface dark:bg-dark-brand-surface p-10 rounded-2xl shadow-2xl border border-brand-border dark:border-dark-brand-border animate-[fadeInUp_0.5s_ease-out]">
            <div className="flex flex-col items-center text-center gap-3 mb-8 animate-[scaleIn_0.5s_ease-out]">
              {appSettings?.logoUrl ? (
                <img
                  src={appSettings.logoUrl}
                  alt="App Logo"
                  className="h-12 w-12"
                />
              ) : (
                <LogoIcon className="h-12 w-12 text-brand-primary" />
              )}
              <h1 className="text-3xl font-bold">
                <span className="text-brand-text-primary dark:text-dark-brand-text-primary">
                  Accredit
                </span>
                <span className="text-brand-primary">Ex</span>
              </h1>
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-800 dark:text-white"
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
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ms-2 block text-sm text-gray-900 dark:text-gray-200"
                  >
                    {t("rememberMe")}
                  </label>
                </div>
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
                {t("enterpriseAccessNotice") ||
                  "Need access? Contact your hospital administrator. Accounts are provisioned by your organization."}
              </p>

              {resetNotice && (
                <div
                  role="status"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                >
                  {resetNotice}
                </div>
              )}

              {error && <ErrorMessage message={error} />}

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
        </div>
      </div>

      {/* Right Side: Globe */}
      <div className="hidden lg:flex relative items-center justify-center p-8 dot-grid overflow-hidden">
        <div className="w-[700px] h-[700px] max-w-full max-h-full">
          <Suspense
            fallback={
              <div className="w-full h-full animate-pulse bg-slate-200 dark:bg-slate-700 rounded-full" />
            }
          >
            <Globe
              width={700}
              height={700}
              {...globeSettings}
              userLocation={userLocation}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
