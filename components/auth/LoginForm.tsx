import React, { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  SpinnerIcon,
} from "../icons";

interface LoginFormProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  loading: boolean;
  error: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading, error }) => {
  const { t, dir } = useTranslation();
  const [email, setEmail] = useState("e.reed@healthcare.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
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
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-800 dark:text-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
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
            className="font-medium text-brand-primary hover:text-indigo-500"
          >
            {t("forgotPassword")}
          </a>
        </div>
      </div>

      {error && (
        <div
          id="login-error"
          role="alert"
          className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-3 flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]"
        >
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-300" />
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-indigo-400"
        >
          {loading ? (
            <SpinnerIcon className="animate-spin h-5 w-5 text-white" />
          ) : (
            t("loginButton")
          )}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
