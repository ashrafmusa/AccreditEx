/**
 * Change Request Detail Component
 * Displays detailed view of a single change request with edit capabilities
 */

import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { useChangeControlStore } from "@/stores/useChangeControlStore";
import {
  ChangePriority,
  ChangeRequest,
  ChangeStatus,
} from "@/types/changeControl";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Edit2,
  MapPin,
  Save,
  X,
} from "lucide-react";
import { useState } from "react";
import ApprovalWorkflow from "./ApprovalWorkflow";

interface ChangeRequestDetailProps {
  request: ChangeRequest;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ChangeRequestDetail({
  request,
  onClose,
  onUpdate,
}: ChangeRequestDetailProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { updateRequest, deleteRequest, loading } = useChangeControlStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(request);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "overview" | "impact" | "approval" | "implementation"
  >("overview");

  const handleEdit = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: name === "priority" ? (value as ChangePriority) : value,
    }));
  };

  const handleSave = async () => {
    try {
      await updateRequest(editData.id, editData);
      setIsEditing(false);
      onUpdate();
      toast.success(t("changeRequestUpdated") || "Change request updated");
    } catch (error) {
      toast.error(
        t("errorUpdatingChangeRequest") || "Error updating change request",
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRequest(editData.id);
      toast.success(t("changeRequestDeleted") || "Change request deleted");
      onClose();
    } catch (error) {
      toast.error(
        t("errorDeletingChangeRequest") || "Error deleting change request",
      );
    }
  };

  const getStatusBadgeColor = (status: ChangeStatus) => {
    const colors: Record<ChangeStatus, string> = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      implemented: "bg-teal-100 text-teal-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status];
  };

  const getPriorityColor = (priority: ChangePriority) => {
    const colors: Record<ChangePriority, string> = {
      low: "text-green-600 bg-green-50",
      medium: "text-yellow-600 bg-yellow-50",
      high: "text-orange-600 bg-orange-50",
      critical: "text-red-600 bg-red-50",
    };
    return colors[priority];
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-brand-secondary p-6 overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-brand-border">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              name="title"
              value={editData.title}
              onChange={handleEdit}
              className="text-2xl font-bold w-full px-2 py-1 rounded border border-brand-border mb-2"
            />
          ) : (
            <h2 className="text-2xl font-bold mb-2 text-brand-text-primary dark:text-dark-brand-text-primary">
              {request.title}
            </h2>
          )}
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(request.status)}`}
            >
              {t(`status.${request.status}`) || request.status}
            </span>
            {isEditing ? (
              <select
                name="priority"
                value={editData.priority}
                onChange={handleEdit}
                className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${getPriorityColor(editData.priority)}`}
              >
                <option value="low">{t("priority.low")}</option>
                <option value="medium">{t("priority.medium")}</option>
                <option value="high">{t("priority.high")}</option>
                <option value="critical">{t("priority.critical")}</option>
              </select>
            ) : (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request.priority)}`}
              >
                {t(`priority.${request.priority}`) || request.priority}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-4">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="p-2 hover:bg-green-100 text-green-600 rounded-md transition-colors disabled:opacity-50"
              >
                <Save size={20} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="border-b border-brand-border mb-6 flex gap-4">
        {["overview", "impact", "approval", "implementation"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeSection === tab
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-text-secondary hover:text-brand-text-primary"
            }`}
          >
            {t(`section.${tab}`) || tab}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
              {t("description")}
            </h3>
            {isEditing ? (
              <textarea
                name="description"
                value={editData.description}
                onChange={handleEdit}
                rows={3}
                className="w-full px-3 py-2 rounded border border-brand-border text-sm resize-none"
              />
            ) : (
              <p className="text-brand-text-secondary text-sm">
                {request.description || "-"}
              </p>
            )}
          </div>

          {/* Business Justification */}
          <div>
            <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
              {t("businessJustification")}
            </h3>
            {isEditing ? (
              <textarea
                name="businessJustification"
                value={editData.businessJustification}
                onChange={handleEdit}
                rows={3}
                className="w-full px-3 py-2 rounded border border-brand-border text-sm resize-none"
              />
            ) : (
              <p className="text-brand-text-secondary text-sm">
                {request.businessJustification || "-"}
              </p>
            )}
          </div>

          {/* Expected Benefits */}
          <div>
            <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
              {t("expectedBenefits")}
            </h3>
            {isEditing ? (
              <textarea
                name="expectedBenefits"
                value={editData.expectedBenefits}
                onChange={handleEdit}
                rows={2}
                className="w-full px-3 py-2 rounded border border-brand-border text-sm resize-none"
              />
            ) : (
              <p className="text-brand-text-secondary text-sm">
                {request.expectedBenefits || "-"}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-brand-text-primary mb-2 flex items-center gap-2">
                <Calendar size={16} />
                {t("dateRequested")}
              </h3>
              <p className="text-brand-text-secondary text-sm">
                {new Date(request.dateRequested).toLocaleString()}
              </p>
            </div>
            {request.plannedStartDate && (
              <div>
                <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
                  {t("plannedStartDate")}
                </h3>
                <p className="text-brand-text-secondary text-sm">
                  {new Date(request.plannedStartDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Requestor Info */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-brand-text-secondary">
              <span className="font-medium text-brand-text-primary">
                {t("requestedBy")}:
              </span>{" "}
              {request.requestedByName || "-"}
            </p>
          </div>
        </div>
      )}

      {/* Impact Section */}
      {activeSection === "impact" && (
        <div className="space-y-6">
          {request.impact ? (
            <>
              {request.impact.riskLevel === "critical" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                  <AlertCircle
                    size={20}
                    className="text-red-600 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <h3 className="font-semibold text-red-800">
                      {t("criticalRiskAlert")}
                    </h3>
                    <p className="text-red-700 text-sm mt-1">
                      {request.impact.mitigation}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
                    {t("riskLevel")}
                  </h3>
                  <p className="text-brand-text-secondary text-sm capitalize">
                    {request.impact.riskLevel || "-"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
                    {t("estimatedHours")}
                  </h3>
                  <p className="text-brand-text-secondary text-sm">
                    {request.impact.estimatedHours || 0}
                  </p>
                </div>
              </div>

              {request.impact.affectedSystems &&
                request.impact.affectedSystems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
                      {t("affectedSystems")}
                    </h3>
                    <ul className="text-sm text-brand-text-secondary space-y-1">
                      {request.impact.affectedSystems.map((sys, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <MapPin size={14} />
                          {sys}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {request.impact.riskAssessment && (
                <div>
                  <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
                    {t("riskAssessment")}
                  </h3>
                  <p className="text-brand-text-secondary text-sm">
                    {request.impact.riskAssessment}
                  </p>
                </div>
              )}

              {request.impact.mitigation && (
                <div>
                  <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
                    {t("mitigation")}
                  </h3>
                  <p className="text-brand-text-secondary text-sm">
                    {request.impact.mitigation}
                  </p>
                </div>
              )}

              {request.impact.backoutPlan && (
                <div>
                  <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
                    {t("backoutPlan")}
                  </h3>
                  <p className="text-brand-text-secondary text-sm">
                    {request.impact.backoutPlan}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-brand-text-secondary text-sm">
              {t("noImpactAnalysisYet")}
            </p>
          )}
        </div>
      )}

      {/* Approval Section */}
      {activeSection === "approval" && (
        <ApprovalWorkflow request={request} onUpdate={onUpdate} />
      )}

      {/* Implementation Section */}
      {activeSection === "implementation" && (
        <div className="space-y-6">
          {request.implementation ? (
            <>
              <div className="bg-green-50 p-4 rounded-md flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {t("implementedBy")}:{" "}
                    {request.implementation.implementedByName || "-"}
                  </p>
                  <p className="text-sm text-green-700">
                    {format(
                      new Date(request.implementation.implementationDate),
                      "PPP p",
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
                    {t("actualHoursSpent")}
                  </h3>
                  <p className="text-brand-text-secondary text-sm">
                    {request.implementation.actualHoursSpent || 0}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
                    {t("successCriteriaMet")}
                  </h3>
                  <p
                    className={`text-sm font-medium ${request.implementation.successCriteriaMet ? "text-green-600" : "text-red-600"}`}
                  >
                    {request.implementation.successCriteriaMet
                      ? "✓ Yes"
                      : "✗ No"}
                  </p>
                </div>
              </div>

              {request.implementation.issues &&
                request.implementation.issues.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
                      {t("issues")}
                    </h3>
                    <ul className="space-y-1">
                      {request.implementation.issues.map((issue, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-brand-text-secondary flex items-start gap-2"
                        >
                          <span className="text-red-500 mt-1">•</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {request.implementation.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-brand-text-primary mb-2">
                    {t("notes")}
                  </h3>
                  <p className="text-brand-text-secondary text-sm">
                    {request.implementation.notes}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-brand-text-secondary text-sm">
              {t("notImplementedYet")}
            </p>
          )}
        </div>
      )}

      {/* Delete Button */}
      {!isEditing && (
        <div className="mt-auto pt-6 border-t border-brand-border">
          {showDeleteConfirm ? (
            <div className="bg-red-50 p-4 rounded-md mb-4">
              <p className="text-sm text-red-800 mb-3">{t("confirmDelete")}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-3 py-2 rounded-md border border-red-200 text-sm text-red-600 hover:bg-red-50"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-3 py-2 rounded-md text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50"
            >
              {t("deleteChangeRequest")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
