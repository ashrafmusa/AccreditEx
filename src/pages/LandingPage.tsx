import PublicPageHeader from "@/components/common/PublicPageHeader";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import Modal from "@/components/ui/Modal";
import { useTranslation } from "@/hooks/useTranslation";
import { submitDemoRequest } from "@/services/demoRequestService";
import React, { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface LandingPageProps {
  onLogin: () => void;
}

const inputClass =
  "w-full rounded-xl border border-brand-border bg-brand-background px-4 py-3 text-brand-text-primary outline-none focus:ring-2 focus:ring-brand-primary dark:border-dark-brand-border dark:bg-dark-brand-background dark:text-dark-brand-text-primary";
const primaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary";

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const { t, dir } = useTranslation();
  const [demoOpen, setDemoOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    message: "",
  });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const openDemo = (event: React.MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = event.currentTarget;
    setDemoOpen(true);
  };
  const closeDemo = useCallback(() => {
    if (submitting) return;
    setDemoOpen(false);
    setSubmitted(false);
    setError("");
    setForm({ name: "", email: "", organization: "", message: "" });
    triggerRef.current?.focus();
  }, [submitting]);

  const handleDemo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError(t("public_demo_required"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitDemoRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        organization: form.organization.trim(),
        message: form.message.trim(),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        t(
          err instanceof Error && err.message === "duplicate"
            ? "public_demo_duplicate"
            : "landing_demo_error",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const capabilities = [
    { key: "evidence", icon: DocumentTextIcon },
    { key: "audit", icon: ClipboardDocumentCheckIcon },
    { key: "risk", icon: ShieldCheckIcon },
    { key: "training", icon: AcademicCapIcon },
    { key: "operations", icon: ChartBarIcon },
    { key: "ai", icon: CheckCircleIcon },
  ];

  return (
    <div
      dir={dir}
      className="bg-brand-background text-brand-text-primary dark:bg-dark-brand-background dark:text-dark-brand-text-primary"
    >
      <PublicPageHeader landing />
      <main id="public-main" tabIndex={-1}>
        <section className="relative overflow-hidden border-b border-brand-border dark:border-dark-brand-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-24 top-0 h-96 w-96 rounded-full bg-brand-primary/10 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-brand-primary"
                />
                {t("public_hero_eyebrow")}
              </p>
              <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                {t("public_hero_title")}
                <br />
                <span className="text-brand-primary">
                  {t("landing_hero_headline3")}
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("public_hero_body")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={openDemo} className={primaryClass}>
                  {t("landing_demo_title")}
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="h-5 w-5 rtl:rotate-180"
                  />
                </button>
                <Link
                  to="/register"
                  className="rounded-xl border border-brand-border px-6 py-3 font-semibold hover:bg-brand-primary/10 dark:border-dark-brand-border"
                >
                  {t("public_trial")}
                </Link>
              </div>
              <p className="mt-4 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("public_trial_note")}
              </p>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm">
                {["bilingual", "roles", "connected"].map((key) => (
                  <li key={key} className="flex items-center gap-2">
                    <CheckCircleIcon
                      aria-hidden="true"
                      className="h-5 w-5 text-brand-primary"
                    />
                    {t(`public_trust_${key}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-brand-border bg-brand-surface p-5 shadow-xl shadow-brand-primary/5 dark:border-dark-brand-border dark:bg-dark-brand-surface sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-brand-border pb-5 dark:border-dark-brand-border">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                    {t("public_preview_label")}
                  </p>
                  <h2 className="mt-2 text-xl font-bold">
                    {t("public_preview_title")}
                  </h2>
                </div>
                <ClipboardDocumentCheckIcon
                  aria-hidden="true"
                  className="h-10 w-10 shrink-0 text-brand-primary"
                />
              </div>
              <div className="mt-5 space-y-3">
                {["requirements", "evidence", "review"].map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-4 rounded-2xl bg-brand-background p-4 dark:bg-dark-brand-background"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 font-bold text-brand-primary">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold">
                        {t(`public_preview_${step}`)}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        {t(`public_preview_${step}_body`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("public_preview_note")}
              </p>
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6"
          aria-label={t("public_facilities")}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {["hospitals", "clinics", "labs", "networks"].map((key) => (
              <span key={key}>{t(`public_facility_${key}`)}</span>
            ))}
          </div>
        </section>

        <section
          id="platform"
          className="scroll-mt-6 mx-auto max-w-7xl px-4 py-14 sm:px-6"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">
            {t("public_platform")}
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">
            {t("public_platform_title")}
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("public_platform_body")}
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ key, icon: Icon }) => (
              <article
                key={key}
                className="rounded-2xl border border-brand-border bg-brand-surface p-6 dark:border-dark-brand-border dark:bg-dark-brand-surface"
              >
                <div className="mb-5 inline-flex rounded-xl bg-brand-primary/10 p-3 text-brand-primary">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">{t(`public_cap_${key}`)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t(`public_cap_${key}_body`)}
                </p>
                <p className="mt-4 border-t border-brand-border pt-4 text-sm font-medium dark:border-dark-brand-border">
                  {t(`public_cap_${key}_value`)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          className="scroll-mt-6 border-y border-brand-border bg-brand-surface dark:border-dark-brand-border dark:bg-dark-brand-surface"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <h2 className="text-3xl font-bold">{t("public_workflow_title")}</h2>
            <p className="mt-4 max-w-2xl text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("public_workflow_body")}
            </p>
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {["plan", "do", "study", "act"].map((key, index) => (
                <li
                  key={key}
                  className="rounded-2xl bg-brand-background p-6 dark:bg-dark-brand-background"
                >
                  <span className="text-sm font-bold text-brand-primary">
                    0{index + 1}
                  </span>
                  <h3 className="mt-3 text-lg font-bold">
                    {t(`public_pdsa_${key}`)}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t(`public_pdsa_${key}_body`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="faq"
          className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2"
        >
          <div>
            <p className="text-sm font-semibold text-brand-primary">
              {t("public_faq")}
            </p>
            <h2 className="mt-3 text-3xl font-bold">{t("public_faq_title")}</h2>
            <p className="mt-4 leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("public_faq_intro")}
            </p>
            <button onClick={openDemo} className={`${primaryClass} mt-6`}>
              {t("landing_demo_title")}
            </button>
          </div>
          <div className="space-y-3">
            {["countries", "accreditation", "ai", "start"].map((key) => (
              <details
                key={key}
                className="group rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-dark-brand-border dark:bg-dark-brand-surface"
              >
                <summary className="cursor-pointer font-semibold focus-visible:outline-brand-primary">
                  {t(`public_faq_${key}`)}
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t(`public_faq_${key}_body`)}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="rounded-3xl border border-brand-primary/20 bg-brand-primary/10 px-6 py-12 text-center sm:px-12">
            <h2 className="text-3xl font-bold">{t("public_cta_title")}</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("public_cta_body")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={openDemo} className={primaryClass}>
                {t("landing_demo_title")}
              </button>
              <button
                onClick={onLogin}
                className="rounded-xl border border-brand-primary/30 px-6 py-3 font-semibold hover:bg-brand-primary/10"
              >
                {t("public_existing")}
              </button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-brand-border bg-brand-surface dark:border-dark-brand-border dark:bg-dark-brand-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-4 py-8 text-sm sm:px-6">
          <div>
            <p className="font-bold">AccreditEx</p>
            <p className="mt-2 text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("public_footer_note")}
            </p>
          </div>
          <nav aria-label={t("public_legal")} className="flex flex-wrap gap-5">
            <a
              href="/privacy-policy.html"
              className="underline underline-offset-4"
            >
              {t("landing_footer_privacy")}
            </a>
            <a
              href="/terms-of-service.html"
              className="underline underline-offset-4"
            >
              {t("landing_footer_terms")}
            </a>
            <Link to="/pitch" className="hover:text-brand-primary">
              {t("public_pitch")}
            </Link>
          </nav>
        </div>
      </footer>

      <div className="relative z-[10000]">
        <Modal
          isOpen={demoOpen}
          onClose={closeDemo}
          title={t(
            submitted ? "landing_demo_successTitle" : "landing_demo_title",
          )}
          size="lg"
          maxHeight="85vh"
        >
          {submitted ? (
            <div className="py-5 text-center" role="status">
              <CheckCircleIcon
                aria-hidden="true"
                className="mx-auto mb-4 h-12 w-12 text-brand-primary"
              />
              <p>{t("landing_demo_successBody")}</p>
              <button onClick={closeDemo} className={`${primaryClass} mt-6`}>
                {t("landing_demo_close")}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleDemo}
              className="space-y-4"
              aria-busy={submitting}
            >
              <p className="text-sm leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("landing_demo_subtitle")}
              </p>
              <fieldset disabled={submitting} className="space-y-4">
                {(["name", "email", "organization"] as const).map((key) => (
                  <div key={key}>
                    <label
                      htmlFor={`demo-${key}`}
                      className="mb-2 block text-sm font-medium"
                    >
                      {t(
                        `landing_demo_${key === "organization" ? "org" : key}`,
                      )}
                      {key !== "organization" && " *"}
                    </label>
                    <input
                      id={`demo-${key}`}
                      name={key}
                      type={key === "email" ? "email" : "text"}
                      required={key !== "organization"}
                      autoComplete={key === "email" ? "email" : key}
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                ))}
                <div>
                  <label
                    htmlFor="demo-message"
                    className="mb-2 block text-sm font-medium"
                  >
                    {t("landing_demo_message")}
                  </label>
                  <textarea
                    id="demo-message"
                    rows={3}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    placeholder={t("landing_demo_messagePlaceholder")}
                    className={inputClass}
                  />
                </div>
              </fieldset>
              <p className="text-xs leading-relaxed text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("public_demo_privacy")}{" "}
                <a
                  href="/privacy-policy.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {t("landing_footer_privacy")}
                </a>
              </p>
              {error && (
                <p
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className={`${primaryClass} w-full disabled:opacity-60`}
              >
                {t(
                  submitting
                    ? "landing_demo_submitting"
                    : "landing_demo_submit",
                )}
              </button>
            </form>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default LandingPage;
