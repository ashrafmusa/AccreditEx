import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import AIDocumentGenerator from "@/components/ai/AIDocumentGenerator";

const AIDocumentGeneratorPage: React.FC = () => {
  const { t } = useTranslation();

  const handleDocumentGenerated = (response: any) => {
    console.log("Document generated successfully:", response);
  };

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
        context={{
          userRole: "Admin",
          departmentId: "IT",
          projectId: "PROJ-001",
        }}
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
