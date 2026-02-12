import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import AIDocumentGenerator from "@/components/ai/AIDocumentGenerator";

const AIDocumentGeneratorPage: React.FC = () => {
  const { t } = useTranslation();

  const handleDocumentGenerated = (response: any) => {
    console.log("Document generated successfully:", response);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("aiDocumentGenerator")}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
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
    </div>
  );
};

export default AIDocumentGeneratorPage;
