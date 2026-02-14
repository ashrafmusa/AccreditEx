import React, { FC, ReactNode } from "react";

interface SettingsButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  icon?: FC<{ className: string }>;
  fullWidth?: boolean;
  tooltip?: string;
  type?: "button" | "submit" | "reset";
}

const SettingsButton: FC<SettingsButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  children,
  icon: Icon,
  fullWidth = false,
  tooltip,
  type = "button",
}) => {
  const sizeClasses = {
    sm: "py-1.5 px-4 text-xs",
    md: "py-2.5 px-6 text-sm",
    lg: "py-3 px-8 text-base",
  };

  const variantClasses = {
    primary:
      disabled || loading
        ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
        : "bg-brand-primary hover:bg-sky-700 text-white shadow-sm hover:shadow-md active:scale-[0.98] hover:-translate-y-0.5",
    secondary: disabled
      ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 active:scale-[0.98]",
    danger: disabled
      ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
      : "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md active:scale-[0.98] hover:-translate-y-0.5",
    success: disabled
      ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md active:scale-[0.98] hover:-translate-y-0.5",
    outline: disabled
      ? "bg-transparent border-2 border-gray-300 dark:border-gray-700 text-gray-500 cursor-not-allowed"
      : "bg-transparent border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white active:scale-[0.98]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={tooltip}
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 gap-2 relative overflow-hidden group ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${
        disabled || loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      {!disabled && !loading && (
        <span className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
      )}
      <span className="relative flex items-center gap-2">
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : Icon ? (
          <Icon className="w-4 h-4" />
        ) : null}
        {children}
      </span>
    </button>
  );
};

export { SettingsButton };
export default SettingsButton;
