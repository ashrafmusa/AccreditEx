import PublicPageHeader from "@/components/common/PublicPageHeader";
import { CheckCircleIcon } from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import {
  selfRegister,
  type SelfRegistrationData,
} from "@/services/registrationService";
import { useTenantStore } from "@/stores/useTenantStore";
import { useUserStore } from "@/stores/useUserStore";
import type { Organization, User } from "@/types";
import { UserRole } from "@/types";
import React, { useState } from "react";
import { Link } from "react-router-dom";

const organizationTypes: Organization["type"][] = [
  "hospital",
  "clinic",
  "laboratory",
  "group",
  "other",
];
const inputClass =
  "w-full rounded-xl border border-brand-border bg-brand-background px-4 py-3 text-sm text-brand-text-primary outline-none focus:ring-2 focus:ring-brand-primary dark:border-dark-brand-border dark:bg-dark-brand-background dark:text-dark-brand-text-primary";

const RegistrationPage: React.FC = () => {
  const { t, dir } = useTranslation();
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const [form, setForm] = useState<SelfRegistrationData>({
    fullName: "",
    email: "",
    password: "",
    organizationName: "",
    organizationType: "hospital",
    country: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const update = (field: keyof SelfRegistrationData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): string | null => {
    if (!form.fullName.trim()) return t("public_register_nameError");
    if (
      !form.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    )
      return t("public_register_emailError");
    if (form.password.length < 8) return t("public_register_passwordError");
    if (form.password !== confirmPassword) return t("public_register_mismatch");
    if (!form.organizationName.trim()) return t("public_register_orgError");
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = {
        ...form,
        fullName: form.fullName.trim(),
        email: form.email.toLowerCase().trim(),
        organizationName: form.organizationName.trim(),
        country: form.country?.trim(),
      };
      const result = await selfRegister(data);
      // Hydrate tenant store FIRST so organizationId and module gating are active before user effects fire
      useTenantStore.getState().setOrganization(result.organization);
      // Auth fires before profile creation; hydrate only after registration writes succeed.
      const userProfile: User = {
        id: result.userId,
        name: data.fullName,
        email: data.email,
        role: UserRole.Admin,
        organizationId: result.orgId,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(userProfile);
      void useTenantStore.getState().loadOrganizationForUser(result.orgId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        t(
          msg.includes("email-already-in-use")
            ? "public_register_exists"
            : msg.includes("weak-password")
              ? "public_register_weak"
              : msg.includes("permission-denied")
                ? "public_register_denied"
                : "public_register_error",
        ),
      );
      setLoading(false);
    }
  };

  return (
    <div
      dir={dir}
      className="min-h-screen bg-brand-background text-brand-text-primary dark:bg-dark-brand-background dark:text-dark-brand-text-primary"
    >
      <PublicPageHeader />
      <main
        id="public-main"
        tabIndex={-1}
        className="mx-auto grid max-w-7xl items-start gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-16"
      >
        <section className="lg:sticky lg:top-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">
            {t("public_register_badge")}
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">
            {t("public_register_title")}
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("public_register_body")}
          </p>
          <h2 className="mt-8 text-lg font-semibold">
            {t("public_register_included")}
          </h2>
          <ul className="mt-5 space-y-4">
            {["evidence", "audit", "risk", "training"].map((key) => (
              <li key={key} className="flex items-center gap-3">
                <CheckCircleIcon
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-brand-primary"
                />
                {t(`public_cap_${key}`)}
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-lg rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-5 text-sm leading-relaxed">
            {t("public_register_guidance")}
          </p>
          <p className="mt-6 text-sm">
            {t("public_register_existing")}{" "}
            <Link
              to="/login"
              className="font-semibold text-brand-primary underline underline-offset-4"
            >
              {t("landing_nav_login")}
            </Link>
          </p>
        </section>
        <section
          aria-label={t("public_register_form")}
          className="rounded-3xl border border-brand-border bg-brand-surface p-6 shadow-xl shadow-brand-primary/5 dark:border-dark-brand-border dark:bg-dark-brand-surface sm:p-8"
        >
          <h2 className="text-2xl font-bold">{t("public_register_form")}</h2>
          <p className="mt-2 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("public_trial_note")}
          </p>
          <form
            onSubmit={handleSubmit}
            noValidate
            aria-busy={loading}
            aria-describedby={error ? "registration-error" : undefined}
            className="mt-6 space-y-5"
          >
            {error && (
              <p
                id="registration-error"
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
              >
                {error}
              </p>
            )}
            <fieldset disabled={loading} className="space-y-5">
              {(["fullName", "email"] as const).map((field) => (
                <div key={field}>
                  <label
                    htmlFor={`register-${field}`}
                    className="mb-2 block text-sm font-medium"
                  >
                    {t(
                      field === "fullName"
                        ? "landing_demo_name"
                        : "landing_demo_email",
                    )}{" "}
                    *
                  </label>
                  <input
                    id={`register-${field}`}
                    name={field}
                    type={field === "email" ? "email" : "text"}
                    autoComplete={field === "email" ? "email" : "name"}
                    value={form[field]}
                    onChange={(e) => update(field, e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              ))}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="register-password"
                    className="mb-2 block text-sm font-medium"
                  >
                    {t("password")} *
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                    aria-describedby="password-guidance"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="register-confirm"
                    className="mb-2 block text-sm font-medium"
                  >
                    {t("public_register_confirm")} *
                  </label>
                  <input
                    id="register-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
              <p
                id="password-guidance"
                className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary"
              >
                {t("public_register_passwordHelp")}
              </p>
              <div>
                <label
                  htmlFor="register-org"
                  className="mb-2 block text-sm font-medium"
                >
                  {t("public_register_org")} *
                </label>
                <input
                  id="register-org"
                  autoComplete="organization"
                  value={form.organizationName}
                  onChange={(e) => update("organizationName", e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="register-type"
                    className="mb-2 block text-sm font-medium"
                  >
                    {t("public_register_type")}
                  </label>
                  <select
                    id="register-type"
                    value={form.organizationType}
                    onChange={(e) => update("organizationType", e.target.value)}
                    className={inputClass}
                  >
                    {organizationTypes.map((type) => (
                      <option key={type} value={type}>
                        {t(`public_org_${type}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="register-country"
                    className="mb-2 block text-sm font-medium"
                  >
                    {t("public_register_country")}
                  </label>
                  <input
                    id="register-country"
                    autoComplete="country-name"
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </fieldset>
            <p className="text-xs leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("public_register_legal")}{" "}
              <a
                href="/terms-of-service.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {t("landing_footer_terms")}
              </a>{" "}
              {t("public_and")}{" "}
              <a
                href="/privacy-policy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {t("landing_footer_privacy")}
              </a>
              .
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-primary px-6 py-3 font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60"
            >
              {t(
                loading ? "public_register_creating" : "public_register_submit",
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default RegistrationPage;
