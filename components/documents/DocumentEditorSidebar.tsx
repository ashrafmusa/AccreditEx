import React from "react";
import { AppDocument, Standard } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import {
  SparklesIcon,
  DocumentTextIcon,
  PencilIcon,
  GlobeAltIcon,
} from "../icons";
import { aiService } from "@/services/ai";
import { useToast } from "@/hooks/useToast";

interface DocumentEditorSidebarProps {
  document: AppDocument;
  setDocument: React.Dispatch<React.SetStateAction<AppDocument>>;
  standards: Standard[];
  isEditMode: boolean;
  setIsEditMode: (isEdit: boolean) => void;
  canEdit: boolean;
  viewingVersion: number | "current";
  setViewingVersion: (version: number | "current") => void;
}

const DocumentEditorSidebar: React.FC<DocumentEditorSidebarProps> = (props) => {
  const {
    document,
    setDocument,
    standards,
    isEditMode,
    setIsEditMode,
    canEdit,
    viewingVersion,
    setViewingVersion,
  } = props;
  const { t, lang } = useTranslation();
  const toast = useToast();

  const handleGenerate = async (standardId: string) => {
    const standard = standards.find((s) => s.standardId === standardId);
    if (!standard) return;
    try {
      const content = await aiService.generatePolicyFromStandard(
        standard,
        lang
      );
      setDocument((d) => ({
        ...d,
        content: { ...d.content, [lang]: content },
      }));
      if (!isEditMode) setIsEditMode(true);
    } catch (e) {
      toast.error(t("errorGeneratingContent"));
    }
  };

  const handleImprove = async () => {
    try {
      const improved = await aiService.improveWriting(
        document.content[lang],
        lang
      );
      setDocument((d) => ({
        ...d,
        content: { ...d.content, [lang]: improved },
      }));
    } catch (e) {
      toast.error("Failed to improve text.");
    }
  };

  const handleTranslate = async () => {
    try {
      const targetLang = lang === "en" ? "ar" : "en";
      const translated = await aiService.translateText(
        document.content[lang],
        lang
      );
      setDocument((d) => ({
        ...d,
        content: { ...d.content, [targetLang]: translated },
      }));
    } catch (e) {
      toast.error("Failed to translate text.");
    }
  };

  return (
    <aside className="w-80 border-l dark:border-dark-brand-border flex-shrink-0 flex flex-col">
      <div className="p-4 border-b dark:border-dark-brand-border">
        {canEdit && (
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-brand-primary"
          >
            {isEditMode ? t("viewMode") : t("editDocument")}
          </button>
        )}
      </div>

      {isEditMode && (
        <div className="p-4 border-b dark:border-dark-brand-border">
          <h4 className="text-sm font-semibold flex items-center gap-1">
            <SparklesIcon className="w-4 h-4" />
            {t("aiAssistant")}
          </h4>
          <div className="mt-2 space-y-2">
            <select
              onChange={(e) => handleGenerate(e.target.value)}
              className="w-full text-sm p-2 border rounded-md"
            >
              <option>{t("selectStandard")}</option>
              {standards.map((s) => (
                <option key={s.standardId} value={s.standardId}>
                  {s.standardId}
                </option>
              ))}
            </select>
            <button
              onClick={handleImprove}
              className="w-full text-sm p-2 border rounded-md flex items-center gap-2 hover:bg-gray-100"
            >
              <PencilIcon className="w-4 h-4" />
              {t("improveWriting")}
            </button>
            <button
              onClick={handleTranslate}
              className="w-full text-sm p-2 border rounded-md flex items-center gap-2 hover:bg-gray-100"
            >
              <GlobeAltIcon className="w-4 h-4" />
              {t("translate")}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 flex-grow overflow-y-auto">
        <h4 className="text-sm font-semibold">{t("versionHistory")}</h4>
        <ul className="mt-2 space-y-2">
          <li>
            <button
              onClick={() => setViewingVersion("current")}
              className={`w-full text-left text-sm p-2 rounded-md ${
                viewingVersion === "current"
                  ? "bg-indigo-100 font-semibold"
                  : "hover:bg-gray-100"
              }`}
            >
              v{document.currentVersion} (
              {t(
                (document.status.charAt(0).toLowerCase() +
                  document.status.slice(1).replace(" ", "")) as any
              )}
              ) - Current
            </button>
          </li>
          {document.versionHistory.map((v) => (
            <li key={v.version}>
              <button
                onClick={() => setViewingVersion(v.version)}
                className={`w-full text-left text-sm p-2 rounded-md ${
                  viewingVersion === v.version
                    ? "bg-indigo-100 font-semibold"
                    : "hover:bg-gray-100"
                }`}
              >
                v{v.version} (Approved)
                <span className="block text-xs text-gray-500">
                  {new Date(v.date).toLocaleDateString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default DocumentEditorSidebar;
