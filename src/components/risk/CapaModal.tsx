import React, { useState, useEffect, FC } from "react";
import { CAPAReport, User } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import DatePicker from "../ui/DatePicker";

interface CapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (capa: Omit<CAPAReport, "id">, projectId: string) => void;
  users: User[];
  existingCapa: (CAPAReport & { projectId: string }) | null;
}

const CapaModal: FC<CapaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  users,
  existingCapa,
}) => {
  const { t, dir } = useTranslation();
  const isEditMode = !!existingCapa;

  const [description, setDescription] = useState("");
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [status, setStatus] = useState<"Open" | "Closed">("Open");

  useEffect(() => {
    if (existingCapa) {
      setDescription(existingCapa.description || "");
      setRootCauseAnalysis(existingCapa.rootCauseAnalysis || "");
      setActionPlan(existingCapa.actionPlan || "");
      setAssignedTo(existingCapa.assignedTo || null);
      setDueDate(
        existingCapa.dueDate ? new Date(existingCapa.dueDate) : undefined,
      );
      setStatus(existingCapa.status as "Open" | "Closed");
    }
  }, [existingCapa, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !existingCapa) return;

    const capaData = {
      ...existingCapa,
      description,
      rootCauseAnalysis,
      actionPlan,
      assignedTo,
      dueDate: dueDate!.toISOString().split("T")[0],
      status,
    };
    const { projectId, ...rest } = capaData;
    onSave(rest as any, projectId);
  };

  if (!isOpen) return null;

  const inputClasses =
    "mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700";
  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-2xl m-4"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium">{t("capaReport")}</h3>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto">
            <div>
              <label className={labelClasses}>{t("description")}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label className={labelClasses}>{t("rootCauseAnalysis")}</label>
              <textarea
                value={rootCauseAnalysis}
                onChange={(e) => setRootCauseAnalysis(e.target.value)}
                rows={3}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>{t("actionPlan")}</label>
              <textarea
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                rows={3}
                className={inputClasses}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("assignedTo")}</label>
                <select
                  value={assignedTo || ""}
                  onChange={(e) => setAssignedTo(e.target.value || null)}
                  className={inputClasses}
                >
                  <option value="">{t("unassigned")}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>{t("dueDate")}</label>
                <DatePicker date={dueDate} setDate={setDueDate} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("status")}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={inputClasses}
                >
                  <option value="Open">{t("open")}</option>
                  <option value="Closed">{t("closed")}</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>
                  {t("pdcaStage") || "PDCA Stage"}
                </label>
                <select
                  value={existingCapa?.pdcaStage || "Plan"}
                  onChange={() => {}}
                  className={`${inputClasses} opacity-70`}
                  disabled={true}
                >
                  <option value="Plan">Plan</option>
                  <option value="Do">Do</option>
                  <option value="Check">Check</option>
                  <option value="Act">Act</option>
                  <option value="Completed">Completed</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {t("manageStageInBoard") || "Manage stage in PDCA Board"}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border rounded-md"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="py-2 px-4 border rounded-md text-white bg-brand-primary"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CapaModal;
