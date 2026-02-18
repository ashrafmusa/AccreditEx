import React, { useState, useEffect, FC } from "react";
import { Competency } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";

interface CompetencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (competency: Competency | Omit<Competency, "id">) => void;
  existingCompetency: Competency | null;
}

const CompetencyModal: FC<CompetencyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCompetency,
}) => {
  const { t, dir } = useTranslation();
  const isEditMode = !!existingCompetency;

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");

  useEffect(() => {
    if (isEditMode && existingCompetency) {
      setNameEn(existingCompetency.name.en);
      setNameAr(existingCompetency.name.ar);
      setDescriptionEn(existingCompetency.description.en);
      setDescriptionAr(existingCompetency.description.ar);
    } else {
      setNameEn("");
      setNameAr("");
      setDescriptionEn("");
      setDescriptionAr("");
    }
  }, [existingCompetency, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !nameAr || !descriptionEn || !descriptionAr) return;

    const data = {
      name: { en: nameEn, ar: nameAr },
      description: { en: descriptionEn, ar: descriptionAr },
    };

    if (isEditMode) {
      onSave({ id: existingCompetency.id, ...data });
    } else {
      onSave(data);
    }
  };

  if (!isOpen) return null;

  const inputClasses =
    "mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white";
  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter"
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
                <label htmlFor="nameEn" className={labelClasses}>
                  {t("competencyNameEn")}
                </label>
                <input
                  type="text"
                  id="nameEn"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label htmlFor="nameAr" className={labelClasses}>
                  {t("competencyNameAr")}
                </label>
                <input
                  type="text"
                  id="nameAr"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className={inputClasses}
                  required
                  dir="rtl"
                />
              </div>
              <div>
                <label htmlFor="descEn" className={labelClasses}>
                  {t("competencyDescriptionEn")}
                </label>
                <textarea
                  id="descEn"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  rows={3}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label htmlFor="descAr" className={labelClasses}>
                  {t("competencyDescriptionAr")}
                </label>
                <textarea
                  id="descAr"
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  rows={3}
                  className={inputClasses}
                  required
                  dir="rtl"
                />
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

export default CompetencyModal;
