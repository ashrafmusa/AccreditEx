import React, { useMemo } from "react";
import { AppDocument, Standard } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import {
  SparklesIcon,
  DocumentTextIcon,
  PencilIcon,
  GlobeAltIcon,
  LinkIcon,
} from "../icons";
import { aiService } from "@/services/ai";
import { useToast } from "@/hooks/useToast";
import { useAppStore } from "@/stores/useAppStore";

interface DocumentEditorSidebarProps {
  document: AppDocument;
  setDocument: React.Dispatch<React.SetStateAction<AppDocument>>;
  standards: Standard[];
  isEditMode: boolean;
  setIsEditMode: (isEdit: boolean) => void;
  canEdit: boolean;
  viewingVersion: number | "current";
  setViewingVersion: (version: number | "current") => void;
  onCompareVersions?: (v1: number | 'current', v2: number | 'current') => void;
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
    onCompareVersions,
  } = props;
  const { t, lang } = useTranslation();
  const toast = useToast();
  const { documents } = useAppStore();

  const [selectedVersionForComparison, setSelectedVersionForComparison] = React.useState<number | 'current' | null>(null);

  // Get related documents
  const relatedDocuments = useMemo(() => {
    if (!document.relatedDocumentIds?.length) return [];
    return documents.filter(d => document.relatedDocumentIds?.includes(d.id));
  }, [document.relatedDocumentIds, documents]);

  // Get parent document
  const parentDocument = useMemo(() => {
    if (!document.parentDocumentId) return null;
    return documents.find(d => d.id === document.parentDocumentId);
  }, [document.parentDocumentId, documents]);

  // Get child documents
  const childDocuments = useMemo(() => {
    return documents.filter(d => d.parentDocumentId === document.id);
  }, [document.id, documents]);

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
        {/* Related Documents Section */}
        {(relatedDocuments.length > 0 || parentDocument || childDocuments.length > 0) && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold flex items-center gap-1 mb-2">
              <LinkIcon className="w-4 h-4" />
              {t("relatedDocuments") || "Related Documents"}
            </h4>
            
            {parentDocument && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">{t("parentDocument") || "Parent Document"}</p>
                <div className="text-sm p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer border border-blue-200 dark:border-blue-800">
                  <div className="font-medium">{parentDocument.name[lang]}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {parentDocument.type} • v{parentDocument.currentVersion}
                  </div>
                </div>
              </div>
            )}

            {childDocuments.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">{t("childDocuments") || "Child Documents"}</p>
                <div className="space-y-1">
                  {childDocuments.map(doc => (
                    <div key={doc.id} className="text-sm p-2 rounded-md bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer border border-green-200 dark:border-green-800">
                      <div className="font-medium">{doc.name[lang]}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {doc.type} • v{doc.currentVersion}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relatedDocuments.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">{t("linkedDocuments") || "Linked Documents"}</p>
                <div className="space-y-1">
                  {relatedDocuments.map(doc => (
                    <div key={doc.id} className="text-sm p-2 rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-700">
                      <div className="font-medium">{doc.name[lang]}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {doc.type} • v{doc.currentVersion}
                        {document.relationshipType && ` • ${document.relationshipType}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <h4 className="text-sm font-semibold">{t("versionHistory")}</h4>
        {document.versionHistory && document.versionHistory.length > 0 && onCompareVersions && (
          <p className="text-xs text-gray-500 mt-1 mb-2">
            {selectedVersionForComparison 
              ? t('clickVersionToCompare') || 'Click a version to compare'
              : t('selectVersionToCompare') || 'Select versions to compare'}
          </p>
        )}
        <ul className="mt-2 space-y-2">
          <li>
            <button
              onClick={() => {
                if (selectedVersionForComparison !== null && onCompareVersions) {
                  onCompareVersions(selectedVersionForComparison, 'current');
                  setSelectedVersionForComparison(null);
                } else if (onCompareVersions) {
                  setSelectedVersionForComparison('current');
                } else {
                  setViewingVersion("current");
                }
              }}
              className={`w-full text-left text-sm p-2 rounded-md ${
                viewingVersion === "current"
                  ? "bg-indigo-100 font-semibold"
                  : selectedVersionForComparison === 'current'
                  ? "bg-blue-100 ring-2 ring-blue-500"
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
                onClick={() => {
                  if (selectedVersionForComparison !== null && onCompareVersions) {
                    onCompareVersions(selectedVersionForComparison, v.version);
                    setSelectedVersionForComparison(null);
                  } else if (onCompareVersions) {
                    setSelectedVersionForComparison(v.version);
                  } else {
                    setViewingVersion(v.version);
                  }
                }}
                className={`w-full text-left text-sm p-2 rounded-md ${
                  viewingVersion === v.version
                    ? "bg-indigo-100 font-semibold"
                    : selectedVersionForComparison === v.version
                    ? "bg-blue-100 ring-2 ring-blue-500"
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
