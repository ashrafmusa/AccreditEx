/**
 * BranchManagementPage — AccrediTex
 *
 * Admin page for managing organization branches (sub-locations).
 * Uses branchService for CRUD and renders a table of branches with
 * add/edit/deactivate/delete actions.
 */

import {
  BuildingOffice2Icon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import {
  addBranch,
  deactivateBranch,
  deleteBranch,
  getBranches,
  updateBranch,
} from "@/services/branchService";
import type { Branch, NavigationState } from "@/types";
import React, { useCallback, useEffect, useState } from "react";

interface BranchManagementPageProps {
  setNavigation: (state: NavigationState) => void;
}

// ── Default empty form ───────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  nameAr: "",
  location: "",
  city: "",
  country: "",
  phone: "",
  email: "",
  headUserId: "",
  isActive: true,
};

type BranchForm = typeof EMPTY_FORM;

// ── Component ────────────────────────────────────────────────

const BranchManagementPage: React.FC<BranchManagementPageProps> = () => {
  const { t } = useTranslation();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Load ────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (e: any) {
      setError(e.message || "Failed to load branches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Handlers ────────────────────────────────────────────

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setForm({
      name: branch.name,
      nameAr: branch.nameAr ?? "",
      location: branch.location ?? "",
      city: branch.city ?? "",
      country: branch.country ?? "",
      phone: branch.phone ?? "",
      email: branch.email ?? "",
      headUserId: branch.headUserId ?? "",
      isActive: branch.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateBranch(editingId, {
          ...form,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addBranch(form);
      }
      await load();
      closeModal();
    } catch (e: any) {
      setError(e.message || "Failed to save branch.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateBranch(id);
      } else {
        await updateBranch(id, {
          isActive: true,
          updatedAt: new Date().toISOString(),
        });
      }
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to update branch status.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBranch(id);
      setDeleteConfirm(null);
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to delete branch.");
    }
  };

  const setField = (key: keyof BranchForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("branches") || "Branch Management"}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("branchesDesc") ||
              "Manage physical sub-locations (branches) of your organization."}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          {t("addBranch") || "Add Branch"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">
          <span className="w-6 h-6 border-2 border-gray-300 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400 dark:text-gray-500">
          <BuildingOffice2Icon className="w-10 h-10 opacity-40" />
          <p className="text-sm">
            {t("noBranches") || "No branches yet. Add the first one."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-start">
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  {t("branchName") || "Name"}
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                  {t("location") || "Location"}
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">
                  {t("contact") || "Contact"}
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 text-center">
                  {t("status") || "Status"}
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 text-right">
                  {t("actions") || "Actions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {branches.map((branch) => (
                <tr
                  key={branch.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BuildingOffice2Icon className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {branch.name}
                        </p>
                        {branch.nameAr && (
                          <p className="text-xs text-gray-400 dir-rtl">
                            {branch.nameAr}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                    {[branch.city, branch.country].filter(Boolean).join(", ") ||
                      branch.location ||
                      "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    {branch.email || branch.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        branch.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {branch.isActive
                        ? t("active") || "Active"
                        : t("inactive") || "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(branch)}
                        title={t("edit") || "Edit"}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleDeactivate(branch.id, branch.isActive)
                        }
                        title={
                          branch.isActive
                            ? t("deactivate") || "Deactivate"
                            : t("activate") || "Activate"
                        }
                        className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        {branch.isActive ? (
                          <XMarkIcon className="w-4 h-4" />
                        ) : (
                          <CheckIcon className="w-4 h-4" />
                        )}
                      </button>
                      {deleteConfirm === branch.id ? (
                        <button
                          onClick={() => handleDelete(branch.id)}
                          className="px-2 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          {t("confirmDelete") || "Confirm"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(branch.id)}
                          title={t("delete") || "Delete"}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId
                  ? t("editBranch") || "Edit Branch"
                  : t("addBranch") || "Add Branch"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Name (required) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("branchName") || "Branch Name"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. North Campus"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>
              {/* Arabic Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("nameAr") || "Arabic Name"}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={form.nameAr}
                  onChange={(e) => setField("nameAr", e.target.value)}
                  placeholder="الاسم بالعربية"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>
              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("city") || "City"}
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("country") || "Country"}
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setField("country", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>
              {/* Location / Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("address") || "Address / Location"}
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>
              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("phone") || "Phone"}
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("email") || "Email"}
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>
              {/* Active toggle */}
              <div className="flex items-center gap-2">
                <input
                  id="branchActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <label
                  htmlFor="branchActive"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t("branchActive") || "Active branch"}
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckIcon className="w-4 h-4" />
                )}
                {saving ? t("saving") || "Saving…" : t("save") || "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagementPage;
