/**
 * Approval Workflow Component
 * Manages the approval process for change requests
 */

import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { useChangeControlStore } from "@/stores/useChangeControlStore";
import { useUserStore } from "@/stores/useUserStore";
import { ApprovalStatus, ChangeRequest } from "@/types/changeControl";
import { Check, Clock, Send, X } from "lucide-react";
import { useState } from "react";

interface ApprovalWorkflowProps {
  request: ChangeRequest;
  onUpdate: () => void;
}

export default function ApprovalWorkflow({
  request,
  onUpdate,
}: ApprovalWorkflowProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { currentUser } = useUserStore();
  const { submitRequest, addApprovalRecord, loading } = useChangeControlStore();

  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalData, setApprovalData] = useState({
    status: "approved" as ApprovalStatus,
    comments: "",
  });

  const handleSubmitForApproval = async () => {
    try {
      await submitRequest(
        request.id,
        request.requiredApprovals || 1,
        currentUser?.id || "",
      );
      onUpdate();
      toast.success(t("submittedForApproval") || "Submitted for approval");
    } catch (error) {
      toast.error(
        t("errorSubmittingForApproval") || "Error submitting for approval",
      );
    }
  };

  const handleAddApproval = async () => {
    if (!currentUser) {
      toast.error(t("mustBeLoggedIn") || "You must be logged in");
      return;
    }

    try {
      await addApprovalRecord(
        request.id,
        {
          approverId: currentUser.id,
          approverName: currentUser.name || "Unknown",
          approverRole: currentUser.role || "user",
          status: approvalData.status,
          comments: approvalData.comments,
          dateSubmitted: new Date(),
          dateReviewed: new Date(),
        } as any,
        currentUser?.id || "",
      );

      setShowApprovalForm(false);
      setApprovalData({ status: "approved", comments: "" });
      onUpdate();
      toast.success(t("approvalRecorded") || "Approval recorded");
    } catch (error) {
      toast.error(t("errorRecordingApproval") || "Error recording approval");
    }
  };

  const approvalProgress =
    request.approvals.length > 0
      ? (request.approvals.filter((a) => a.status === "approved").length /
          request.requiredApprovals) *
        100
      : 0;

  const isPending =
    request.status === "submitted" || request.status === "under_review";
  const isApproved = request.status === "approved";
  const isDeadlinePassed = request.approvalDeadline
    ? new Date(request.approvalDeadline) < new Date()
    : false;

  const getApprovalStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case "approved":
        return <Check size={20} className="text-green-600" />;
      case "rejected":
        return <X size={20} className="text-red-600" />;
      case "needs_revision":
        return <Clock size={20} className="text-yellow-600" />;
      default:
        return <Clock size={20} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">
          {t("approvalStatus")}
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-blue-800">
                {t("approvals")}:{" "}
                {
                  request.approvals.filter((a) => a.status === "approved")
                    .length
                }
                /{request.requiredApprovals}
              </span>
              <span className="text-sm font-medium text-blue-900">
                {Math.round(approvalProgress)}%
              </span>
            </div>
            <div className="h-3 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${approvalProgress}%` }}
              />
            </div>
          </div>

          {isDeadlinePassed && isPending && (
            <p className="text-sm text-red-600 font-medium">
              ⚠️ {t("approvalDeadlinePassed")}
            </p>
          )}

          {request.approvalDeadline && (
            <p className="text-sm text-blue-700">
              {t("deadline")}:{" "}
              {new Date(request.approvalDeadline).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Approval Records */}
      <div>
        <h3 className="text-sm font-semibold text-brand-text-primary mb-4">
          {t("approvalHistory")}
        </h3>

        {request.approvals.length === 0 ? (
          <p className="text-sm text-brand-text-secondary text-center py-8">
            {t("noApprovalsYet")}
          </p>
        ) : (
          <div className="space-y-3">
            {request.approvals.map((approval, idx) => (
              <div
                key={idx}
                className="p-4 border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getApprovalStatusIcon(approval.status)}
                      <h4 className="font-medium text-brand-text-primary">
                        {approval.approverName}
                      </h4>
                      <span className="text-xs text-brand-text-secondary">
                        ({approval.approverRole})
                      </span>
                    </div>
                    <p className="text-sm text-brand-text-secondary mb-2">
                      {approval.dateReviewed
                        ? new Date(approval.dateReviewed).toLocaleString()
                        : "-"}
                    </p>
                    {approval.comments && (
                      <p className="text-sm bg-gray-50 p-2 rounded border border-gray-200 text-brand-text-secondary">
                        {approval.comments}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      approval.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : approval.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {t(`approvalStatus.${approval.status}`) || approval.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {request.status === "draft" && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <button
            onClick={handleSubmitForApproval}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-brand-primary text-white font-medium hover:bg-brand-primary/90 disabled:opacity-50"
          >
            <Send size={16} />
            {t("submitForApproval")}
          </button>
        </div>
      )}

      {isPending && !showApprovalForm && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <button
            onClick={() => setShowApprovalForm(true)}
            className="w-full px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            {t("addApproval")}
          </button>
        </div>
      )}

      {/* Approval Form */}
      {showApprovalForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <h3 className="font-semibold text-brand-text-primary">
            {t("recordApproval")}
          </h3>

          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              {t("decision")} *
            </label>
            <select
              value={approvalData.status}
              onChange={(e) =>
                setApprovalData((prev) => ({
                  ...prev,
                  status: e.target.value as ApprovalStatus,
                }))
              }
              className="w-full px-3 py-2 rounded-md border border-brand-border text-sm"
            >
              <option value="approved">{t("approvalStatus.approved")}</option>
              <option value="rejected">{t("approvalStatus.rejected")}</option>
              <option value="needs_revision">
                {t("approvalStatus.needs_revision")}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              {t("comments")}
            </label>
            <textarea
              value={approvalData.comments}
              onChange={(e) =>
                setApprovalData((prev) => ({
                  ...prev,
                  comments: e.target.value,
                }))
              }
              placeholder={t("addYourComments") || "Add your comments..."}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-brand-border text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowApprovalForm(false)}
              className="flex-1 px-3 py-2 rounded-md border border-brand-border text-sm font-medium text-brand-text-primary hover:bg-gray-100"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleAddApproval}
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-md bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {t("recordApproval")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
