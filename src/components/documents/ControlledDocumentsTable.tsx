import React from "react";
import { AppDocument } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import DocumentRow from "./DocumentRow";
import { EmptyState, TableContainer } from "@/components/ui";
import { DocumentIcon } from "../icons";

interface ControlledDocumentsTableProps {
  documents: AppDocument[];
  canModify: boolean;
  onApprove: (doc: AppDocument) => void;
  onDelete: (docId: string) => void;
  onView: (doc: AppDocument) => void;
}

const ControlledDocumentsTable: React.FC<ControlledDocumentsTableProps> = ({
  documents,
  canModify,
  onApprove,
  onDelete,
  onView,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border overflow-hidden">
      <TableContainer>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
              >
                {t("documentName")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
              >
                {t("status")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
              >
                {t("version")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
              >
                {t("reviewDate")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
              >
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-brand-surface divide-y divide-gray-200 dark:divide-dark-brand-border">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                canModify={canModify}
                onApprove={onApprove}
                onDelete={onDelete}
                onView={onView}
              />
            ))}
          </tbody>
        </table>
        {documents.length === 0 && (
          <EmptyState
            icon={DocumentIcon}
            title={t("noControlledDocuments")}
            message=""
          />
        )}
      </TableContainer>
    </div>
  );
};

export default ControlledDocumentsTable;
