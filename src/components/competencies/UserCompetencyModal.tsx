import React, { useState, useEffect, FC } from "react";
import { UserCompetency, Competency, AppDocument } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import DatePicker from "../ui/DatePicker";

interface UserCompetencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (competency: UserCompetency) => void;
  competencies: Competency[];
  documents: AppDocument[];
  existingUserCompetency: UserCompetency | null;
}

const UserCompetencyModal: FC<UserCompetencyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  competencies,
  documents,
  existingUserCompetency,
}) => {
  const { t, dir, lang } = useTranslation();
  const isEditMode = !!existingUserCompetency;

  const [competencyId, setCompetencyId] = useState("");
  const [issueDate, setIssueDate] = useState<Date | undefined>();
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [evidenceDocumentId, setEvidenceDocumentId] = useState("");

  useEffect(() => {
    if (existingUserCompetency) {
      setCompetencyId(existingUserCompetency.competencyId);
      setIssueDate(new Date(existingUserCompetency.issueDate));
      setExpiryDate(
        existingUserCompetency.expiryDate
          ? new Date(existingUserCompetency.expiryDate)
          : undefined,
      );
      setEvidenceDocumentId(
        existingUserCompetency.evidenceDocumentIds?.[0] || "",
      );
    } else {
      setCompetencyId("");
      setIssueDate(undefined);
      setExpiryDate(undefined);
      setEvidenceDocumentId("");
    }
  }, [existingUserCompetency, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!competencyId || !issueDate) return;

    onSave({
      competencyId,
      issueDate: issueDate.toISOString().split("T")[0],
      expiryDate: expiryDate
        ? expiryDate.toISOString().split("T")[0]
        : undefined,
      evidenceDocumentId: evidenceDocumentId || undefined,
    } as any);
  };

  if (!isOpen) return null;

  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-lg m-4 modal-content-enter"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
              {isEditMode ? t("editCompetency") : t("addCompetency")}
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="competency" className={labelClasses}>
                  {t("competency")}
                </label>
                <select
                  id="competency"
                  value={competencyId}
                  onChange={(e) => setCompetencyId(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                  required
                  disabled={isEditMode}
                >
                  <option value="">{t("selectCompetency")}</option>
                  {competencies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[lang]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="issueDate" className={labelClasses}>
                    {t("issueDate")}
                  </label>
                  <DatePicker date={issueDate} setDate={setIssueDate} />
                </div>
                <div>
                  <label htmlFor="expiryDate" className={labelClasses}>
                    {t("expiryDate")}
                  </label>
                  <DatePicker
                    date={expiryDate}
                    setDate={setExpiryDate}
                    fromDate={issueDate}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="evidence" className={labelClasses}>
                  {t("evidence")}
                </label>
                <select
                  id="evidence"
                  value={evidenceDocumentId}
                  onChange={(e) => setEvidenceDocumentId(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{t("selectEvidence")}</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name[lang]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 px-4 sm:px-6 py-3 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-sky-700"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCompetencyModal;
