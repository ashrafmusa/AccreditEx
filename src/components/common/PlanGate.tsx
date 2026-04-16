/**
 * PlanGate — inline feature gating component
 *
 * Wraps any JSX and hides it (with an optional lock overlay) if the
 * organization's current plan is below the required tier.
 *
 * Usage:
 *   <PlanGate requiredPlan="professional" feature="Analytics Hub">
 *     <AnalyticsDashboard />
 *   </PlanGate>
 *
 * For full-page module gating use the existing <UpgradePrompt /> instead.
 */

import {
  getPlanInfo,
  planMeetsRequirement,
} from "@/services/subscriptionService";
import { useTenantStore } from "@/stores/useTenantStore";
import type { PlanTier } from "@/types/modules";
import { Lock } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

interface PlanGateProps {
  /** Minimum plan tier needed to access this feature */
  requiredPlan: PlanTier;
  /** Human-readable feature name shown in the lock overlay */
  feature?: string;
  /** Content to render when plan is sufficient */
  children: React.ReactNode;
  /**
   * 'overlay'  — children are rendered but blurred + locked (default)
   * 'hide'     — children are completely hidden (no lock shown)
   * 'disabled' — children rendered as disabled (grayscale, no lock overlay)
   */
  mode?: "overlay" | "hide" | "disabled";
}

export function PlanGate({
  requiredPlan,
  feature,
  children,
  mode = "overlay",
}: PlanGateProps) {
  const navigate = useNavigate();
  const currentOrg = useTenantStore((s) => s.currentOrganization);
  const currentPlan: PlanTier = (currentOrg?.plan as PlanTier) ?? "free";

  const hasAccess = planMeetsRequirement(currentPlan, requiredPlan);

  if (hasAccess) return <>{children}</>;

  const requiredPlanInfo = getPlanInfo(requiredPlan);

  if (mode === "hide") return null;

  if (mode === "disabled") {
    return (
      <div className="relative opacity-50 grayscale pointer-events-none select-none">
        {children}
      </div>
    );
  }

  // mode === 'overlay' (default)
  return (
    <div className="relative">
      {/* Blurred children */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="bg-brand-background dark:bg-dark-brand-background border border-brand-border dark:border-dark-brand-border rounded-xl shadow-lg px-6 py-5 flex flex-col items-center gap-3 text-center max-w-xs">
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-brand-primary" />
          </div>
          {feature && (
            <p className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {feature}
            </p>
          )}
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Available on the{" "}
            <span className="font-medium text-brand-primary">
              {requiredPlanInfo.name}
            </span>{" "}
            plan and above
          </p>
          <button
            onClick={() => navigate("/pricing")}
            className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlanGate;
