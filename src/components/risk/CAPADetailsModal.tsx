import React, { useState } from "react";
import { CAPAReport, Project } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { XMarkIcon, TrashIcon } from "@/components/icons";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/hooks/useToast";

interface CAPADetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  capa: CAPAReport;
  project?: Project;
}

const CAPADetailsModal: React.FC<CAPADetailsModalProps> = ({
  isOpen,
  onClose,
  capa,
  project,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { updateCapa, deleteCapa } = useProjectStore();
  const { currentUser } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCapa, setEditedCapa] = useState<CAPAReport>(capa);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAdmin = currentUser?.role === "Admin";

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!project) return;
    try {
      await updateCapa(project.id, editedCapa);
      toast.success("CAPA updated successfully!");
      setIsEditing(false);
      onClose();
    } catch (error) {
      toast.error("Failed to update CAPA");
    }
  };

  const handleDelete = async () => {
    if (!project) {
      toast.error("Cannot delete CAPA: Project not found");
      console.error("Project is undefined. CAPA:", capa);
      return;
    }
    
    setShowDeleteConfirm(false);
    
    try {
      await deleteCapa(project.id, capa.id);
      toast.success("CAPA deleted successfully!");
      onClose();
    } catch (error: any) {
      console.error("Delete CAPA error:", error);
      toast.error(error?.message || "Failed to delete CAPA");
    }
  };

  const pdcaStages = ["Plan", "Do", "Check", "Act"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              CAPA Report Details
            </h2>
            {project && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t("inProject")} {project.name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Warning if project not found */}
          {!project && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Warning: Parent project not found. Delete and edit functions are disabled.
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                CAPA ID: {capa.id} | Source Project ID: {capa.sourceProjectId || "N/A"}
              </p>
            </div>
          )}
          
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={editedCapa.description || ""}
                onChange={(e) =>
                  setEditedCapa({ ...editedCapa, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
              />
            ) : (
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                {capa.description || "No description"}
              </p>
            )}
          </div>

          {/* Root Cause */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              🔍 Root Cause Analysis
            </label>
            {isEditing ? (
              <textarea
                value={editedCapa.rootCause}
                onChange={(e) =>
                  setEditedCapa({ ...editedCapa, rootCause: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Describe the root cause..."
              />
            ) : (
              <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-md whitespace-pre-wrap">
                {capa.rootCause}
              </div>
            )}
          </div>

          {/* Corrective Action */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              ✅ Corrective Action (AI Generated Action Plan)
            </label>
            {isEditing ? (
              <textarea
                value={editedCapa.correctiveAction}
                onChange={(e) =>
                  setEditedCapa({
                    ...editedCapa,
                    correctiveAction: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
                placeholder="Define corrective action..."
              />
            ) : (
              <div className="text-gray-900 dark:text-white bg-gradient-to-br from-rose-50 to-cyan-50 dark:from-pink-900/20 dark:to-cyan-900/20 p-4 rounded-md border border-rose-200 dark:border-pink-700 whitespace-pre-wrap">
                {capa.correctiveAction}
              </div>
            )}
          </div>

          {/* Preventive Action */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              🛡️ Preventive Action
            </label>
            {isEditing ? (
              <textarea
                value={editedCapa.preventiveAction || ""}
                onChange={(e) =>
                  setEditedCapa({
                    ...editedCapa,
                    preventiveAction: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Define preventive action..."
              />
            ) : (
              <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-md whitespace-pre-wrap">
                {capa.preventiveAction || "To be defined"}
              </div>
            )}
          </div>

          {/* PDCA Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                PDCA Stage
              </label>
              {isEditing ? (
                <select
                  value={editedCapa.pdcaStage || "Plan"}
                  onChange={(e) =>
                    setEditedCapa({
                      ...editedCapa,
                      pdcaStage: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {pdcaStages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    capa.pdcaStage === "Plan"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : capa.pdcaStage === "Do"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                      : capa.pdcaStage === "Check"
                      ? "bg-rose-100 text-pink-700 dark:bg-pink-900/30 dark:text-rose-300"
                      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  }`}
                >
                  {capa.pdcaStage || "Plan"}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  capa.status === "Open"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                }`}
              >
                {capa.status}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Created:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {new Date(capa.createdAt).toLocaleDateString()}
              </span>
            </div>
            {capa.updatedAt && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Updated:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {new Date(capa.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          {isAdmin && !isEditing && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              Delete CAPA
            </button>
          )}
          <div
            className={`flex gap-3 ${isAdmin && !isEditing ? "" : "ml-auto"}`}
          >
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setEditedCapa(capa);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-pink-600"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Close
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-pink-600"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Delete CAPA Report?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this CAPA report? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CAPADetailsModal;
