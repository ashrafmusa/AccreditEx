import React, { useCallback, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useUserStore } from "@/stores/useUserStore";
import { useProjectStore } from "@/stores/useProjectStore";
import AIDocumentGenerator from "@/components/ai/AIDocumentGenerator";
import type { DocumentGenerationResponse } from "@/services/aiDocumentGeneratorService";

const AIDocumentGeneratorPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const currentUser = useUserStore((s) => s.currentUser);
  const projects = useProjectStore((s) => s.projects);

  const context = useMemo(
    () => ({
      userRole: currentUser?.role ?? "Viewer",
      departmentId: currentUser?.departmentId ?? currentUser?.department ?? "",
      projectId: projects[0]?.id ?? "",
    }),
    [currentUser, projects],
  );

  const handleDocumentGenerated = useCallback(
    (response: DocumentGenerationResponse) => {
      toast.showToast(
        t("documentGeneratedSuccess") ?? "Document generated successfully",
        "success",
      );

      // Auto-download when content is available
      if (response.content) {
        const blob = new Blob([response.content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ai-document-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [toast, t],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
          {t("aiDocumentGenerator")}
        </h1>
        <p className="mt-1 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("aiDocumentGeneratorDescription")}
        </p>
      </div>

      <AIDocumentGenerator
        onDocumentGenerated={handleDocumentGenerated}
        context={context}
        preferences={{
          tone: "professional",
          length: "comprehensive",
          format: "markdown",
        }}
      />
    </div>
  );
};

export default AIDocumentGeneratorPage;
