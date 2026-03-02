/**
 * Supplier Detail Component
 */

import { useTranslation } from "@/hooks/useTranslation";
import { useSupplierStore } from "@/stores/useSupplierStore";
import { useUserStore } from "@/stores/useUserStore";
import { Supplier } from "@/types/supplier";
import { Edit2, Trash2, X } from "lucide-react";
import { useState } from "react";

interface SupplierDetailProps {
  supplier: Supplier;
  onClose: () => void;
  onUpdate: () => Promise<void>;
}

export default function SupplierDetail({
  supplier,
  onClose,
  onUpdate,
}: SupplierDetailProps) {
  const { t } = useTranslation();
  const { user } = useUserStore();
  const { updateSupplier, deleteSupplier } = useSupplierStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSupplier, setEditedSupplier] = useState(supplier);

  const handleSave = async () => {
    if (user) {
      await updateSupplier(editedSupplier, user.id);
      setIsEditing(false);
      await onUpdate();
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t("confirmDelete"))) {
      await deleteSupplier(supplier.id);
      onClose();
      await onUpdate();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-text-primary">
            {supplier.name}
          </h2>
          <p className="text-brand-text-secondary">{supplier.type}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="bg-white dark:bg-dark-brand-surface rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("contactPerson")}
              </label>
              <input
                type="text"
                value={editedSupplier.contactPerson}
                onChange={(e) =>
                  setEditedSupplier({
                    ...editedSupplier,
                    contactPerson: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("email")}
              </label>
              <input
                type="email"
                value={editedSupplier.email}
                onChange={(e) =>
                  setEditedSupplier({
                    ...editedSupplier,
                    email: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("phone")}
              </label>
              <input
                type="tel"
                value={editedSupplier.phone}
                onChange={(e) =>
                  setEditedSupplier({
                    ...editedSupplier,
                    phone: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("status")}
              </label>
              <select
                value={editedSupplier.status}
                onChange={(e) =>
                  setEditedSupplier({
                    ...editedSupplier,
                    status: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="approved">{t("approved")}</option>
                <option value="conditional">{t("conditional")}</option>
                <option value="probation">{t("probation")}</option>
                <option value="suspended">{t("suspended")}</option>
                <option value="inactive">{t("inactive")}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("notes")}
            </label>
            <textarea
              value={editedSupplier.notes}
              onChange={(e) =>
                setEditedSupplier({ ...editedSupplier, notes: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg h-24"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
            >
              {t("save")}
            </button>
            <button
              onClick={() => {
                setEditedSupplier(supplier);
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Info Section */}
          <div className="bg-white dark:bg-dark-brand-surface rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t("contactInformation")}
            </h3>
            {renderInfoField("contactPerson", supplier.contactPerson)}
            {renderInfoField("email", supplier.email)}
            {renderInfoField("phone", supplier.phone)}
            {renderInfoField("address", supplier.address)}
            {renderInfoField("city", supplier.city)}
          </div>

          {/* Scorecard Section */}
          <div className="bg-white dark:bg-dark-brand-surface rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t("vendorScorecard")}
            </h3>
            {renderScoreField("overallScore", supplier.scorecard.overallScore)}
            {renderScoreField("qualityScore", supplier.scorecard.qualityScore)}
            {renderScoreField(
              "deliveryScore",
              supplier.scorecard.deliveryScore,
            )}
            {renderScoreField(
              "responsiveness",
              supplier.scorecard.responsiveness,
            )}
            {renderScoreField(
              "complianceScore",
              supplier.scorecard.complianceScore,
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function renderInfoField(label: string, value: string) {
  return (
    <div className="mb-3">
      <p className="text-xs text-brand-text-secondary uppercase font-medium">
        {label}
      </p>
      <p className="text-brand-text-primary">{value || "—"}</p>
    </div>
  );
}

function renderScoreField(label: string, value: number) {
  const percentage = (value / 100) * 100;
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-brand-text-primary">{label}</p>
        <p className="text-sm font-bold text-brand-primary">{value}/100</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-brand-primary h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
