/**
 * TrialBanner — AccrediTex
 *
 * Dismissible warning banner displayed in the main app layout when:
 *  - The organization is in an active trial and ≤ 14 days remain, OR
 *  - The trial has expired.
 *
 * Colors:
 *  - amber/orange  : ≤ 14 days remaining
 *  - red           : expired (trial ended)
 *
 * Clicking "Upgrade Plan" navigates to the Settings → Plan & Subscription page.
 */

import {
  ExclamationTriangleIcon,
  SparklesIcon,
  XMarkIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { useTenantStore } from "@/stores/useTenantStore";
import type { NavigationState } from "@/types";
import React, { useMemo, useState } from "react";

interface TrialBannerProps {
  setNavigation: (state: NavigationState) => void;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const currentOrganization = useTenantStore((s) => s.currentOrganization);
  const [dismissed, setDismissed] = useState(false);

  const bannerInfo = useMemo(() => {
    if (!currentOrganization) return null;

    const { trialActive, trialEndsAt, subscriptionExpiresAt } =
      currentOrganization;

    // ── Trial expiry ─────────────────────────────────────
    if (trialActive && trialEndsAt) {
      const endDate = new Date(trialEndsAt);
      const now = new Date();
      const diffMs = endDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        // Trial expired
        return {
          type: "expired" as const,
          message:
            t("trialExpired") ||
            "Your free trial has ended. Upgrade to keep access.",
          urgent: true,
        };
      }

      if (daysLeft <= 14) {
        return {
          type: "expiring" as const,
          message:
            t("trialExpiringSoon", { days: daysLeft }) ||
            `Your free trial expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
          urgent: daysLeft <= 7,
        };
      }
    }

    // ── Subscription expiry ──────────────────────────────
    if (subscriptionExpiresAt) {
      const expDate = new Date(subscriptionExpiresAt);
      const now = new Date();
      const diffMs = expDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        return {
          type: "expired" as const,
          message:
            t("subscriptionExpired") ||
            "Your subscription has expired. Renew to restore full access.",
          urgent: true,
        };
      }

      if (daysLeft <= 14) {
        return {
          type: "expiring" as const,
          message:
            t("subscriptionExpiringSoon", { days: daysLeft }) ||
            `Your subscription expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
          urgent: daysLeft <= 7,
        };
      }
    }

    return null;
  }, [currentOrganization, t]);

  if (!bannerInfo || dismissed) return null;

  const isExpired = bannerInfo.type === "expired";
  const isUrgent = bannerInfo.urgent;

  const containerClass = isExpired
    ? "bg-red-600 text-white"
    : isUrgent
      ? "bg-amber-500 text-white"
      : "bg-amber-400 text-amber-900";

  return (
    <div
      className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-medium ${containerClass} z-40`}
      role="alert"
    >
      {/* Left: icon + message */}
      <div className="flex items-center gap-2">
        <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
        <span>{bannerInfo.message}</span>
      </div>

      {/* Right: CTA + dismiss */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() =>
            setNavigation({ view: "settings", section: "orgPlan" })
          }
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 ${
            isExpired || isUrgent
              ? "bg-white text-gray-900"
              : "bg-amber-900/20 text-amber-900"
          }`}
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          {t("upgradePlan") || "Upgrade Plan"}
        </button>

        <button
          onClick={() => setDismissed(true)}
          aria-label={t("dismiss") || "Dismiss"}
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TrialBanner;
