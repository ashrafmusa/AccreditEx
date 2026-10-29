/**
 * PricingPage — public-facing subscription plans page
 *
 * Shows 4 plan cards: Solo (free), Clinic ($49), Hospital ($199), Network (custom).
 * "Get Started" / "Upgrade" buttons redirect to Stripe Payment Links (no server).
 * "Contact Sales" for the Network (enterprise) tier opens a mailto link.
 */

import { useToast } from "@/hooks/useToast";
import {
  hasStripePaymentLink,
  planMeetsRequirement,
  PLANS,
  printProformaQuote,
  redirectToStripePaymentLink,
  startFreeTrial,
  submitPlanUpgradeRequest,
  type PlanInfo,
} from "@/services/subscriptionService";
import { useTenantStore } from "@/stores/useTenantStore";
import { useUserStore } from "@/stores/useUserStore";
import { useTranslation } from "@/hooks/useTranslation";
import type { PlanTier } from "@/types/modules";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Check,
  FileText,
  Loader2,
  Network,
  Printer,
  Send,
  Star,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const PLAN_ICONS: Record<PlanTier, React.ReactNode> = {
  free: <Zap className="w-6 h-6" />,
  starter: <Building2 className="w-6 h-6" />,
  professional: <Star className="w-6 h-6" />,
  enterprise: <Network className="w-6 h-6" />,
};

function PlanCard({
  plan,
  currentPlan,
  orgId,
  trialEligible,
  onStartTrial,
  onSelectUpgrade,
  trialLoading,
}: {
  plan: PlanInfo;
  currentPlan: PlanTier;
  orgId: string | undefined;
  trialEligible: boolean;
  onStartTrial: () => void;
  onSelectUpgrade: (plan: PlanInfo) => void;
  trialLoading: boolean;
}) {
  const { t } = useTranslation();
  const isCurrent = currentPlan === plan.tier;
  const isOwned = planMeetsRequirement(currentPlan, plan.tier);
  const isEnterprise = plan.tier === "enterprise";
  const isTrialTarget = plan.tier === "professional" && trialEligible;
  const translationPrefix = `pricingPlan${plan.tier[0].toUpperCase()}${plan.tier.slice(1)}`;
  const planNameKey = `${translationPrefix}Name`;
  const planTaglineKey = `${translationPrefix}Tagline`;
  const localizedPlanName = t(planNameKey);
  const localizedPlanTagline = t(planTaglineKey);
  const localizedHighlights = plan.highlights.map((highlight, index) => {
    const key = `${translationPrefix}Feature${index + 1}`;
    const translated = t(key);
    return translated === key ? highlight : translated;
  });

  function handleCTA() {
    if (isTrialTarget) {
      onStartTrial();
      return;
    }
    if (plan.tier === "free" || isCurrent || isOwned) return;
    if (orgId && hasStripePaymentLink(plan.tier)) {
      redirectToStripePaymentLink(plan.tier, orgId);
      return;
    }
    onSelectUpgrade(plan);
  }

  let ctaLabel: React.ReactNode = t("pricingGetStarted");
  if (plan.tier === "free") ctaLabel = t("pricingCurrentPlan");
  else if (isCurrent) ctaLabel = t("pricingCurrentPlan");
  else if (isOwned) ctaLabel = t("pricingIncluded");
  else if (isEnterprise) ctaLabel = t("pricingContactSales");
  else if (isTrialTarget)
    ctaLabel = trialLoading ? (
      <span className="flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> {t("pricingActivating")}
      </span>
    ) : (
      t("pricingStartTrial")
    );
  else ctaLabel = t("pricingUpgradeNow");

  const ctaDisabled =
    plan.tier === "free" ||
    isCurrent ||
    isOwned ||
    (isTrialTarget && trialLoading);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={[
        "relative flex flex-col rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md",
        plan.recommended
          ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10"
          : "border-brand-border dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background",
      ].join(" ")}
    >
      {plan.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white shadow">
            <Star className="w-3 h-3" />             {t("pricingMostPopular")}
          </span>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow">
            <Check className="w-3 h-3" />             {t("pricingYourPlan")}
          </span>
        </div>
      )}

      {/* Plan icon + name */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={[
            "w-10 h-10 rounded-xl flex items-center justify-center",
            plan.recommended
              ? "bg-brand-primary text-white"
              : "bg-brand-primary/10 text-brand-primary",
          ].join(" ")}
        >
          {PLAN_ICONS[plan.tier]}
        </div>
        <div>
          <h3 className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {localizedPlanName === planNameKey ? plan.name : localizedPlanName}
          </h3>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {localizedPlanTagline === planTaglineKey
              ? plan.tagline
              : localizedPlanTagline}
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        {plan.price !== null ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-brand-text-primary dark:text-dark-brand-text-primary">
              {plan.price}
            </span>
            <span className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              /{t(`${translationPrefix}Period`) === `${translationPrefix}Period`
                ? plan.period
                : t(`${translationPrefix}Period`)}
            </span>
          </div>
        ) : (
          <div>
            <span className="text-2xl font-extrabold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("pricingCustom")}
            </span>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("pricingTailored")}
            </p>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2 mb-6">
        {localizedHighlights.map((item, index) => (
          <li
            key={`${plan.tier}-${index}`}
            className="flex items-start gap-2 text-sm text-brand-text-primary dark:text-dark-brand-text-primary"
          >
            <Check className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <button
        onClick={handleCTA}
        disabled={ctaDisabled}
        className={[
          "w-full py-3 rounded-xl text-sm font-semibold transition-all",
          ctaDisabled
            ? "bg-brand-text-secondary/10 text-brand-text-secondary cursor-default dark:bg-dark-brand-text-secondary/10"
            : plan.recommended
              ? "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-md hover:shadow-lg"
              : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20",
        ].join(" ")}
      >
        {ctaLabel}
      </button>
    </motion.div>
  );
}

export default function PricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentOrg = useTenantStore((s) => s.currentOrganization);
  const setOrganization = useTenantStore((s) => s.setOrganization);
  const loadOrganization = useTenantStore((s) => s.loadOrganization);
  const currentUser = useUserStore((s) => s.currentUser);
  const currentPlan: PlanTier = (currentOrg?.plan as PlanTier) ?? "free";
  const orgId = currentOrg?.id;

  // Eligible if on free plan and has never started a trial (trialEndsAt not set)
  const trialEligible =
    currentPlan === "free" &&
    !currentOrg?.trialActive &&
    !currentOrg?.trialEndsAt;

  const [trialLoading, setTrialLoading] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] =
    useState<PlanInfo | null>(null);
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">(
    "annual",
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "invoice_po" | "bank_transfer"
  >("invoice_po");
  const [contactName, setContactName] = useState(currentUser?.name || "");
  const [contactEmail, setContactEmail] = useState(currentUser?.email || "");
  const [orgName, setOrgName] = useState(currentOrg?.name || "");
  const [poNotes, setPoNotes] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (currentUser?.name && !contactName) setContactName(currentUser.name);
    if (currentUser?.email && !contactEmail) setContactEmail(currentUser.email);
    if (currentOrg?.name && !orgName) setOrgName(currentOrg.name);
  }, [currentUser, currentOrg, contactName, contactEmail, orgName]);

  // Fallback for browsers without <dialog closedby="any"> support
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      const handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      };
      dialog.addEventListener("click", handleBackdropClick);
      return () => dialog.removeEventListener("click", handleBackdropClick);
    }
  }, [selectedUpgradePlan]);

  function openUpgradeDialog(plan: PlanInfo) {
    setSelectedUpgradePlan(plan);
    requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    });
  }

  function closeUpgradeDialog() {
    const dialog = dialogRef.current;
    if (dialog && dialog.open) {
      dialog.close();
    }
    setSelectedUpgradePlan(null);
  }

  async function handleStartTrial() {
    if (!orgId) return;
    setTrialLoading(true);
    try {
      await startFreeTrial(orgId);
      await loadOrganization(orgId);
      toast.success(
        t("pricingTrialSuccess"),
      );
      navigate(-1);
    } catch {
      // Fallback: activate 14-day trial in workspace session if token claim is pending
      if (currentOrg) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        setOrganization({
          ...currentOrg,
          plan: "professional",
          trialActive: true,
          trialEndsAt: trialEndsAt.toISOString(),
        });
        toast.success(
          t("pricingTrialSuccess") ||
            "14-Day Hospital Professional Trial activated!",
        );
        navigate(-1);
      } else {
        toast.error(t("pricingTrialFailed"));
      }
    } finally {
      setTrialLoading(false);
    }
  }

  async function handleSubmitUpgradeRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUpgradePlan) return;
    setSubmittingRequest(true);
    try {
      await submitPlanUpgradeRequest({
        name: contactName || currentUser?.name || "Facility Admin",
        email: contactEmail || currentUser?.email || "admin@facility.org",
        organizationName: orgName || currentOrg?.name || "Healthcare Facility",
        organizationId: orgId,
        targetTier: selectedUpgradePlan.tier,
        billingCycle,
        paymentMethod,
        notes: poNotes,
      });
      // Immediately unlock plan preview in active workspace session for Admin evaluation
      if (currentOrg) {
        setOrganization({
          ...currentOrg,
          plan: selectedUpgradePlan.tier,
        });
      }
      toast.success(
        `Upgrade request for ${selectedUpgradePlan.name} submitted! Plan features unlocked for evaluation.`,
      );
      closeUpgradeDialog();
    } catch {
      toast.error(
        "Could not submit request. You can still print your Official Proforma Quote below.",
      );
    } finally {
      setSubmittingRequest(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-background dark:bg-dark-brand-background">
      {/* Back nav */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary dark:text-dark-brand-text-secondary dark:hover:text-dark-brand-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </button>
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold text-brand-text-primary dark:text-dark-brand-text-primary mb-3"
        >
          {t("pricingTitle")}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="inline-flex items-center gap-2 bg-brand-success/10 text-brand-success border border-brand-success/30 rounded-full px-4 py-1.5 text-sm font-semibold mb-4"
        >
          {t("pricingTrialBanner")}
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-brand-text-secondary dark:text-dark-brand-text-secondary max-w-xl mx-auto"
        >
          {t("pricingDescription")}
        </motion.p>
      </div>

      {/* Plan cards */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.tier}
              plan={plan}
              currentPlan={currentPlan}
              orgId={orgId}
              trialEligible={trialEligible}
              onStartTrial={handleStartTrial}
              onSelectUpgrade={openUpgradeDialog}
              trialLoading={trialLoading}
            />
          ))}
        </div>
      </div>

      {/* FAQ / note */}
      <div className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("pricingFooterBefore")} <strong>{t("pricingFourteenDayTrial")}</strong>{" "}
          · Official Proforma Invoice, Purchase Order (PO), & Bank Wire supported for all Healthcare Institutions.{" "}
          {t("pricingCancelAnytime")}
        </p>
      </div>

      {/* Native <dialog closedby="any"> for Zero-Cost Proforma Quote & Plan Upgrade Request */}
      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby="upgradeDialogTitle"
        onClose={() => setSelectedUpgradePlan(null)}
        className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0 text-gray-900 dark:text-white shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-xs"
      >
        {selectedUpgradePlan && (
          <form onSubmit={handleSubmitUpgradeRequest} className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-primary">
                  <FileText className="w-3.5 h-3.5" />
                  Official Healthcare Plan Upgrade & Quotation
                </span>
                <h2
                  id="upgradeDialogTitle"
                  className="text-xl font-bold text-gray-900 dark:text-white mt-1"
                >
                  Upgrade to {selectedUpgradePlan.name} Plan (
                  {selectedUpgradePlan.tier.toUpperCase()})
                </h2>
              </div>
              <button
                type="button"
                onClick={closeUpgradeDialog}
                aria-label="Close upgrade dialog"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  billingCycle === "annual"
                    ? "bg-white dark:bg-gray-900 text-brand-primary shadow-xs"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Annual Billing (Save 20%)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white dark:bg-gray-900 text-brand-primary shadow-xs"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Monthly Billing
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Healthcare Facility Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Al-Noor Medical Center"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Quality Director / Admin"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="director@hospital.org"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Procurement Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as "invoice_po" | "bank_transfer",
                    )
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <option value="invoice_po">
                    Official Proforma Invoice / PO
                  </option>
                  <option value="bank_transfer">Direct Bank Wire</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Purchase Order (PO) Number or Notes (Optional)
              </label>
              <input
                type="text"
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                placeholder="e.g. PO-2026-104 or special SLA / branch requirements"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() =>
                  printProformaQuote({
                    organizationName:
                      orgName || currentOrg?.name || "Healthcare Facility",
                    organizationId: orgId,
                    contactName:
                      contactName || currentUser?.name || "Quality Director",
                    contactEmail:
                      contactEmail ||
                      currentUser?.email ||
                      "admin@facility.org",
                    targetTier: selectedUpgradePlan.tier,
                    billingCycle,
                    poNumber: poNotes,
                  })
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-primary text-brand-primary hover:bg-brand-primary/10 text-xs font-semibold transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Official Proforma Quote (PDF)
              </button>

              <button
                type="submit"
                disabled={submittingRequest}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold transition-colors disabled:opacity-60"
              >
                {submittingRequest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Request & Unlock Evaluation
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
