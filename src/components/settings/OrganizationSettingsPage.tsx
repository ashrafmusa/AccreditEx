import { BuildingOffice2Icon, LockClosedIcon } from "@/components/icons";
import ImageUpload from "@/components/settings/ImageUpload";
import { useTranslation } from "@/hooks/useTranslation";
import {
  checkIsSuperAdmin,
  updateOrganization,
} from "@/services/organizationService";
import { useTenantStore } from "@/stores/useTenantStore";
import React, { useEffect, useState } from "react";

const OrganizationSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentOrganization, loadOrganization } = useTenantStore();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [type, setType] = useState<
    "hospital" | "clinic" | "laboratory" | "group" | "other"
  >("other");
  const [country, setCountry] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    checkIsSuperAdmin()
      .then(setIsSuperAdmin)
      .catch(() => setIsSuperAdmin(false));
  }, []);

  useEffect(() => {
    if (!currentOrganization) return;
    setName(currentOrganization.name || "");
    setNameAr(currentOrganization.nameAr || "");
    setType(currentOrganization.type || "other");
    setCountry(currentOrganization.country || "");
    setContactEmail(currentOrganization.contactEmail || "");
    setLogoUrl(currentOrganization.logoUrl || "");
  }, [currentOrganization]);

  const handleLogoChange = (url: string) => {
    setLogoUrl(url);
  };

  const handleSave = async () => {
    if (!currentOrganization?.id || !isSuperAdmin) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateOrganization(currentOrganization.id, {
        name: name.trim(),
        nameAr: nameAr.trim() || undefined,
        type,
        country: country.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        logoUrl: logoUrl || undefined,
      });
      await loadOrganization(currentOrganization.id);
      setMessage(t("organizationSaved") || "Organization settings saved.");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to save.";
      setError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (!currentOrganization) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        {t("noOrganizationLoaded") || "No organization loaded."}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("organizationSettings") || "Organization Settings"}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("organizationSettingsDesc") ||
            "Manage your active organization profile and identity details."}
        </p>
      </div>

      {!isSuperAdmin && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 px-4 py-3 flex items-start gap-2">
          <LockClosedIcon className="h-5 w-5 mt-0.5 text-amber-700 dark:text-amber-400" />
          <p className="text-sm text-amber-900 dark:text-amber-200">
            {t("organizationAdminRequired") ||
              "Only platform super-admins can save organization profile changes."}
          </p>
        </div>
      )}

      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <BuildingOffice2Icon className="h-5 w-5 text-brand-primary" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {t("organizationProfile") || "Organization Profile"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:row-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("organizationLogo") || "Organization Logo"}
            </label>
            <ImageUpload
              currentImage={logoUrl}
              onImageChange={handleLogoChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("orgName") || "Organization Name"}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={!isSuperAdmin || saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("orgNameAr") || "Organization Name (Arabic)"}
            </label>
            <input
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={!isSuperAdmin || saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("orgType") || "Type"}
            </label>
            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as
                    | "hospital"
                    | "clinic"
                    | "laboratory"
                    | "group"
                    | "other",
                )
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={!isSuperAdmin || saving}
            >
              <option value="hospital">
                {t("orgTypeHospital") || "Hospital"}
              </option>
              <option value="clinic">{t("orgTypeClinic") || "Clinic"}</option>
              <option value="laboratory">
                {t("orgTypeLaboratory") || "Laboratory"}
              </option>
              <option value="group">{t("orgTypeGroup") || "Group"}</option>
              <option value="other">{t("orgTypeOther") || "Other"}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("country") || "Country"}
            </label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={!isSuperAdmin || saving}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("contactEmail") || "Contact Email"}
            </label>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              type="email"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={!isSuperAdmin || saving}
            />
          </div>
        </div>

        {(message || error) && (
          <div className="mt-4">
            {message && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {message}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!isSuperAdmin || saving || !name.trim()}
            className="px-4 py-2 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? t("saving") || "Saving..."
              : t("saveOrganization") || "Save Organization"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default OrganizationSettingsPage;
