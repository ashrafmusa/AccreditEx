import React from "react";
import { AccreditationProgram } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { PencilIcon, TrashIcon } from "../icons";

interface ProgramCardProps {
  program: AccreditationProgram;
  standardCount: number;
  projectCount: number;
  canModify: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  standardCount,
  projectCount,
  canModify,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const { t, lang } = useTranslation();

  return (
    <article className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl shadow-sm border border-brand-border dark:border-dark-brand-border hover:shadow-lg transition-all flex flex-col justify-between h-full">
      <div className="p-5">
        <h3 className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
          <button
            type="button"
            onClick={onSelect}
            className="text-start rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
          >
            {program.name}
          </button>
        </h3>
        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1 line-clamp-2 min-h-10">
          {program.description?.[lang] || program.description?.en || ""}
        </p>
        <div className="mt-4 flex space-x-6 rtl:space-x-reverse">
          <div>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("totalStandards")}
            </p>
            <p className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
              {standardCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("projects")}
            </p>
            <p className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
              {projectCount}
            </p>
          </div>
        </div>
      </div>
      <div className="border-t dark:border-dark-brand-border bg-slate-50 dark:bg-slate-900/50 px-5 py-3 flex justify-between items-center rounded-b-xl">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {canModify && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="min-h-11 min-w-11 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-brand-primary rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
                aria-label={t("editProgram")}
              >
                <PencilIcon className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="min-h-11 min-w-11 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
                aria-label={t("deleteProgram")}
              >
                <TrashIcon className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onSelect}
          aria-label={t("qualityProgramOpenLabel").replace(
            "{name}",
            program.name,
          )}
          className="min-h-11 rounded-lg px-2 text-sm font-semibold text-brand-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
        >
          {t("qualityProgramViewStandards")}
        </button>
      </div>
    </article>
  );
};

export default ProgramCard;
