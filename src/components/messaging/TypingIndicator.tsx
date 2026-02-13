import React from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface TypingIndicatorProps {
  userName: string;
  show: boolean;
  size?: "sm" | "md";
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userName,
  show,
  size = "md",
}) => {
  const { t } = useTranslation();
  if (!show) return null;

  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  const spacing = size === "sm" ? "gap-1" : "gap-1.5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={`flex items-center ${spacing} px-3 py-2`}>
      <div
        className={`flex ${spacing} bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2`}
      >
        <div
          className={`${dotSize} bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce`}
          style={{ animationDelay: "0ms" }}
        />
        <div
          className={`${dotSize} bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce`}
          style={{ animationDelay: "150ms" }}
        />
        <div
          className={`${dotSize} bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce`}
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <p className={`${textSize} text-gray-500 dark:text-gray-400 italic ml-2`}>
        {t("isTyping").replace("{name}", userName)}
      </p>
    </div>
  );
};

export { TypingIndicator };
export default TypingIndicator;
