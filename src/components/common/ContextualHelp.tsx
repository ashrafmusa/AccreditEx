import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import {
  QuestionMarkCircleIcon,
  XMarkIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
} from "@/components/icons";

export interface HelpAction {
  labelKey: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export interface HelpContent {
  pageKey: string;
  titleKey: string;
  purposeKey: string;
  keyActions: {
    titleKey: string;
    items: string[];
  };
  tips: {
    titleKey: string;
    items: string[];
  };
  actions?: HelpAction[];
}

interface ContextualHelpProps {
  content: HelpContent;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * ContextualHelp - Page-specific help system component
 *
 * Provides contextual assistance with:
 * - Page purpose explanation
 * - Key actions guide
 * - Tips and best practices
 * - Links to documentation
 * - Contact support option
 *
 * @example
 * ```tsx
 * const projectHelpContent: HelpContent = {
 *   pageKey: "projects",
 *   titleKey: "helpProjectsTitle",
 *   // ... other content
 * };
 *
 * <ContextualHelp content={projectHelpContent} />
 * ```
 */
export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  content,
  className = "",
  size = "md",
}) => {
  const { t, dir } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleContactSupport = () => {
    // Navigate to support or open support chat
    window.location.href = "mailto:support@accreditex.com";
  };

  const handleViewDocs = () => {
    // Open documentation in new tab
    window.open("/docs", "_blank");
  };

  const defaultActions: HelpAction[] = [
    {
      labelKey: "viewDocumentation",
      onClick: handleViewDocs,
      variant: "secondary",
    },
    {
      labelKey: "contactSupport",
      onClick: handleContactSupport,
      variant: "primary",
    },
  ];

  const allActions = [...(content.actions || []), ...defaultActions];

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  const footer = (
    <div className="flex items-center justify-between w-full gap-4">
      <div className="flex items-center gap-2">
        <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-brand-primary" />
        <span className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("needMoreHelp")}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {allActions.map((action, index) => (
          <Button
            key={index}
            onClick={action.onClick}
            variant={action.variant === "primary" ? "primary" : "ghost"}
            size="sm"
          >
            {action.variant === "primary" && (
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-1.5" />
            )}
            {action.variant === "secondary" && (
              <DocumentTextIcon className="w-4 h-4 mr-1.5" />
            )}
            {t(action.labelKey)}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Help Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className={`text-brand-text-secondary hover:text-brand-primary transition-colors ${className}`}
        aria-label={t("getHelp")}
        title={t("getHelp")}
      >
        <QuestionMarkCircleIcon className={`${sizeClasses[size]}`} />
      </Button>

      {/* Help Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t(content.titleKey)}
        footer={footer}
        size="lg"
      >
        <div className="py-2 space-y-6">
          {/* Page Purpose */}
          <section>
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-3">
              {t("whatIsThisPage")}
            </h3>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary leading-relaxed">
              {t(content.purposeKey)}
            </p>
          </section>

          {/* Key Actions */}
          <section>
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-3">
              {t(content.keyActions.titleKey)}
            </h3>
            <ul className="space-y-2">
              {content.keyActions.items.map((actionKey, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t(actionKey)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Tips & Best Practices */}
          <section>
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-3">
              {t(content.tips.titleKey)}
            </h3>
            <ul className="space-y-2">
              {content.tips.items.map((tipKey, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="shrink-0 w-2 h-2 bg-brand-secondary rounded-full mt-2"></span>
                  <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t(tipKey)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Modal>
    </>
  );
};

export default ContextualHelp;
