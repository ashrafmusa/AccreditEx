/**
 * Supplier Form Component
 */

import { useTranslation } from "@/hooks/useTranslation";
import { useSupplierStore } from "@/stores/useSupplierStore";
import { useUserStore } from "@/stores/useUserStore";
import { Supplier } from "@/types/supplier";
import React, { useState } from "react";

interface SupplierFormProps {
  onSuccess: () => Promise<void>;
  onCancel: () => void;
  supplier?: Supplier;
}

const defaultScorecard = {
  id: "",
  supplierId: "",
  overallScore: 80,
  qualityScore: 80,
  deliveryScore: 80,
  responsiveness: 80,
  complianceScore: 80,
  lastEvaluationDate: new Date(),
  nextEvaluationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  history: [],
};

export default function SupplierForm({
  onSuccess,
  onCancel,
  supplier,
}: SupplierFormProps) {
  const { t } = useTranslation();
  const { user } = useUserStore();
  const { createSupplier, updateSupplier } = useSupplierStore();

  const [formData, setFormData] = useState<Omit<Supplier, "id"> | Supplier>(
    supplier || {
      id: "",
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      type: "",
      categories: [],
      status: "approved",
      riskLevel: "medium",
      scorecard: defaultScorecard,
      certifications: [],
      contracts: [],
      auditHistory: [],
      nonConformances: [],
      correctionPlans: [],
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user?.id || "",
      updatedBy: user?.id || "",
    },
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError("");

      if (supplier && "id" in formData && formData.id) {
        await updateSupplier(formData as Supplier, user.id);
      } else {
        await createSupplier(formData, user.id);
      }

      await onSuccess();
    } catch (err: any) {
      setError(err.message || t("errorSavingSupplier"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-brand-surface rounded-lg p-6 shadow-md">
      <h3 className="text-xl font-bold mb-4">
        {supplier ? t("editSupplier") : t("addNewSupplier")}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("supplierName")}
            </label>
            <input
              type="text"
              required
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-brand-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("type")}
            </label>
            <input
              type="text"
              value={formData.type || ""}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full px-3 py-2 border border-brand-border rounded-lg"
              placeholder={t("eg")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("contactPerson")}
            </label>
            <input
              type="text"
              required
              value={formData.contactPerson || ""}
              onChange={(e) =>
                setFormData({ ...formData, contactPerson: e.target.value })
              }
              className="w-full px-3 py-2 border border-brand-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("email")}
            </label>
            <input
              type="email"
              required
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-brand-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("phone")}
            </label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-brand-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("status")}
            </label>
            <select
              value={formData.status || "approved"}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-brand-border rounded-lg"
            >
              <option value="approved">{t("approved")}</option>
              <option value="conditional">{t("conditional")}</option>
              <option value="probation">{t("probation")}</option>
              <option value="suspended">{t("suspended")}</option>
              <option value="inactive">{t("inactive")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("riskLevel")}
            </label>
            <select
              value={formData.riskLevel || "medium"}
              onChange={(e) =>
                setFormData({ ...formData, riskLevel: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-brand-border rounded-lg"
            >
              <option value="low">{t("low")}</option>
              <option value="medium">{t("medium")}</option>
              <option value="high">{t("high")}</option>
              <option value="critical">{t("critical")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("address")}
            </label>
            <input
              type="text"
              value={formData.address || ""}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-3 py-2 border border-brand-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("city")}
            </label>
            <input
              type="text"
              value={formData.city || ""}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="w-full px-3 py-2 border border-brand-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("country")}
            </label>
            <input
              type="text"
              value={formData.country || ""}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="w-full px-3 py-2 border border-brand-border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("notes")}</label>
          <textarea
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full px-3 py-2 border border-brand-border rounded-lg h-24"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {loading ? t("saving") : t("save")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
