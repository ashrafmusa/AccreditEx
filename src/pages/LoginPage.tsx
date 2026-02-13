
import React, { useState } from 'react';
import { UserRole } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { EyeIcon, EyeSlashIcon, LogoIcon, ExclamationTriangleIcon, SpinnerIcon } from '../components/icons';
import { useUserStore } from '../stores/useUserStore';
import { useAppStore } from '../stores/useAppStore';
import Globe from '../components/ui/Globe';
import { Button, Input, ErrorMessage } from "@/components/ui";

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
  const login = useUserStore((state) => state.login);
  const appSettings = useAppStore((state) => state.appSettings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (!user) {
        setError(t("invalidCredentials"));
      }
      // onLogin is no longer needed here; the auth listener handles the UI change.
    } finally {
      setLoading(false);
    }
  };

  if (!appSettings) {
    return null; // Or a loading state
  }

  const globeSettings = appSettings.globeSettings;
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
                        aria-label={showPassword ? "Hide password" : "Show password"}
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
                    className="ml-2 block text-sm text-gray-900 dark:text-gray-200"
                  >
                    {t("rememberMe")}
                  </label>
                </div>
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-brand-primary hover:text-sky-600"
                  >
                    {t("forgotPassword")}
                  </a>
                </div>
              </div>

              {error && <ErrorMessage message={error} />}

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
          <Globe
            width={700}
            height={700}
            {...globeSettings}
            userLocation={userLocation}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;