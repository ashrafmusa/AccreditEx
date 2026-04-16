/**
 * PricingPage — public-facing subscription plans page
 *
 * Shows 4 plan cards: Solo (free), Clinic ($49), Hospital ($199), Network (custom).
 * "Get Started" / "Upgrade" buttons redirect to Stripe Payment Links (no server).
 * "Contact Sales" for the Network (enterprise) tier opens a mailto link.
 */

import {
  planMeetsRequirement,
  PLANS,
  redirectToStripePaymentLink,
  type PlanInfo,
} from "@/services/subscriptionService";
import { useTenantStore } from "@/stores/useTenantStore";
import type { PlanTier } from "@/types/modules";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Check, Network, Star, Zap } from "lucide-react";
import React from "react";
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
}: {
  plan: PlanInfo;
  currentPlan: PlanTier;
  orgId: string | undefined;
}) {
  const isCurrent = currentPlan === plan.tier;
  const isOwned = planMeetsRequirement(currentPlan, plan.tier);
  const isEnterprise = plan.tier === "enterprise";

  function handleCTA() {
    if (isEnterprise) {
      window.location.href =
        "mailto:sales@accreditex.io?subject=Network%20Plan%20Inquiry";
      return;
    }
    if (plan.tier === "free" || isCurrent || isOwned) return;
    if (!orgId) return;
    redirectToStripePaymentLink(plan.tier, orgId);
  }

  let ctaLabel = "Get Started";
  if (plan.tier === "free") ctaLabel = "Current Plan";
  else if (isCurrent) ctaLabel = "Current Plan";
  else if (isOwned) ctaLabel = "Included";
  else if (isEnterprise) ctaLabel = "Contact Sales";
  else ctaLabel = "Upgrade Now";

  const ctaDisabled = plan.tier === "free" || isCurrent || isOwned;

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
            <Star className="w-3 h-3" /> Most Popular
          </span>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow">
            <Check className="w-3 h-3" /> Your Plan
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
            {plan.name}
          </h3>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {plan.tagline}
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
              /{plan.period}
            </span>
          </div>
        ) : (
          <div>
            <span className="text-2xl font-extrabold text-brand-text-primary dark:text-dark-brand-text-primary">
              Custom Pricing
            </span>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              Tailored to your network
            </p>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2 mb-6">
        {plan.highlights.map((item) => (
          <li
            key={item}
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
  const navigate = useNavigate();
  const currentOrg = useTenantStore((s) => s.currentOrganization);
  const currentPlan: PlanTier = (currentOrg?.plan as PlanTier) ?? "free";
  const orgId = currentOrg?.id;

  return (
    <div className="min-h-screen bg-brand-background dark:bg-dark-brand-background">
      {/* Back nav */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary dark:text-dark-brand-text-secondary dark:hover:text-dark-brand-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold text-brand-text-primary dark:text-dark-brand-text-primary mb-3"
        >
          Simple, Transparent Pricing
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="inline-flex items-center gap-2 bg-brand-success/10 text-brand-success border border-brand-success/30 rounded-full px-4 py-1.5 text-sm font-semibold mb-4"
        >
          ✓ 14-day free trial on Hospital plan — no credit card required
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-brand-text-secondary dark:text-dark-brand-text-secondary max-w-xl mx-auto"
        >
          Start free. Upgrade as your team grows. No hidden fees — only pay when
          you earn.
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
            />
          ))}
        </div>
      </div>

      {/* FAQ / note */}
      <div className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          All plans include a <strong>14-day free trial</strong> of the Hospital
          plan. Payments are processed securely by{" "}
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-primary underline"
          >
            Stripe
          </a>
          . Cancel anytime.
        </p>
      </div>
    </div>
  );
}
