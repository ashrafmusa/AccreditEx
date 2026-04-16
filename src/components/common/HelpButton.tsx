/**
 * Help Button - Floating Contextual Help
 *
 * Provides quick access to:
 * - Guided tours
 * - Contextual help
 * - FAQ/Documentation
 * - Keyboard shortcuts
 *
 * @author AccreditEx Team
 * @version 1.0.0
 */

import { allTours, isTourCompleted, resetAllTours } from "@/data/tours";
import { useTranslation } from "@/hooks/useTranslation";
import React, { useState } from "react";
import {
  ArrowPathIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  XMarkIcon,
} from "../icons";
import GuidedTour from "./GuidedTour";

interface HelpButtonProps {
  /** Current page/context for contextual help */
  context?: "documentHub" | "documentEditor" | "dashboard" | "projects";
}

const HelpButton: React.FC<HelpButtonProps> = ({ context = "documentHub" }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTour, setActiveTour] = useState<keyof typeof allTours | null>(
    null,
  );

  // Get contextual tours based on current page
  const getContextualTours = () => {
    switch (context) {
      case "documentHub":
        return [
          {
            id: "documentHub" as const,
            title: t("documentHubTour") || "Document Hub Tour",
            description:
              t("documentHubTourDesc") || "Learn how to manage documents",
            isCompleted: isTourCompleted(allTours.documentHub.id),
          },
          {
            id: "bulkActions" as const,
            title: t("bulkActionsTour") || "Bulk Actions",
            description:
              t("bulkActionsTourDesc") || "Approve multiple documents at once",
            isCompleted: isTourCompleted(allTours.bulkActions.id),
          },
        ];
      case "documentEditor":
        return [
          {
            id: "documentEditor" as const,
            title: t("editorTour") || "Editor Tour",
            description: t("editorTourDesc") || "Master the document editor",
            isCompleted: isTourCompleted(allTours.documentEditor.id),
          },
          {
            id: "collaboration" as const,
            title: t("collaborationTour") || "Collaboration Features",
            description:
              t("collaborationTourDesc") || "Use comments and @mentions",
            isCompleted: isTourCompleted(allTours.collaboration.id),
          },
        ];
      default:
        return [];
    }
  };

  const contextualTours = getContextualTours();

  const startTour = (tourId: keyof typeof allTours) => {
    setActiveTour(tourId);
    setIsOpen(false);
  };

  const handleResetTours = () => {
    if (
      confirm(
        t("resetToursConfirm") ||
          "Reset all tours? You can replay them from the beginning.",
      )
    ) {
      resetAllTours();
      window.location.reload();
    }
  };

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 ltr:right-6 rtl:left-6 z-40 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center group"
        title={t("help") || "Help"}
        aria-label={t("help") || "Help"}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <QuestionMarkCircleIcon className="w-7 h-7" />
        )}

        {/* Pulse animation when tours are not completed */}
        {!isOpen && contextualTours.some((t) => !t.isCompleted) && (
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
        )}
      </button>

      {/* Help Panel */}
      {isOpen && (
        <div className="fixed bottom-24 ltr:right-6 rtl:left-6 w-96 max-w-[calc(100vw-3rem)] bg-white dark:bg-dark-brand-surface rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-40 animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                {t("help") || "Help & Tours"}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={t("close")}
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("helpPanelDescription") ||
                "Get started with guided tours and quick help"}
            </p>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Guided Tours Section */}
            {contextualTours.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-4 h-4 text-blue-500" />
                  <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                    {t("guidedTours") || "Guided Tours"}
                  </h4>
                </div>
                <div className="space-y-2">
                  {contextualTours.map((tour) => (
                    <button
                      key={tour.id}
                      onClick={() => startTour(tour.id)}
                      className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-brand-text-primary dark:text-dark-brand-text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {tour.title}
                            </span>
                            {tour.isCompleted && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                {t("completed") || "Completed"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                            {tour.description}
                          </p>
                        </div>
                        <SparklesIcon className="w-5 h-5 text-blue-500 group-hover:text-blue-600 shrink-0 ltr:ml-2 rtl:mr-2" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Help */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpenIcon className="w-4 h-4 text-brand-primary" />
                <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                  {t("quickHelp") || "Quick Help"}
                </h4>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <h5 className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                    {t("creatingDocuments") || "Creating Documents"}
                  </h5>
                  <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("creatingDocumentsHelp") ||
                      'Click "Create Document" and choose: AI Generate (recommended), Blank, or Upload.'}
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                    {t("bulkApproval") || "Bulk Approval"}
                  </h5>
                  <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("bulkApprovalHelp") ||
                      "Select documents with checkboxes, then use the floating toolbar to approve all at once."}
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                    {t("collaboration") || "Collaboration"}
                  </h5>
                  <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("collaborationHelp") ||
                      "Open any document and click the comment icon to add feedback and @mention colleagues."}
                  </p>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cog6ToothIcon className="w-4 h-4 text-orange-500" />
                <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                  {t("keyboardShortcuts") || "Keyboard Shortcuts"}
                </h4>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("search") || "Search"}
                  </span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono">
                    Ctrl+K
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("newDocument") || "New Document"}
                  </span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono">
                    Ctrl+N
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("save") || "Save"}
                  </span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono">
                    Ctrl+S
                  </kbd>
                </div>
              </div>
            </div>

            {/* Reset Tours (Development) */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleResetTours}
                className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                {t("resetTours") || "Reset All Tours"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Tour */}
      {activeTour && (
        <GuidedTour
          config={allTours[activeTour]}
          enabled={true}
          onComplete={() => setActiveTour(null)}
          onDismiss={() => setActiveTour(null)}
        />
      )}
    </>
  );
};

export default HelpButton;
