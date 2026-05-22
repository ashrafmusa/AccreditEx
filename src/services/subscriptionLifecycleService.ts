import { db } from '@/firebase/firebaseConfig';
import type { Organization } from '@/types';
import type { PlanTier } from '@/types/modules';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const TIER_ORDER: Record<PlanTier, number> = {
    free: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
};

export interface PlanTransitionDecision {
    allowed: boolean;
    direction: 'upgrade' | 'downgrade' | 'none';
    applyAt: 'immediate' | 'period_end' | 'none';
    reason: string;
    effectivePlan: PlanTier;
    scheduledAt?: string;
}

export interface BillingLifecycleState {
    trialExpired: boolean;
    subscriptionExpired: boolean;
    shouldDowngradeToFree: boolean;
}

export function isTrialEligible(org: Organization | null | undefined): boolean {
    if (!org) return false;
    return (org.plan ?? 'free') === 'free' && !org.trialActive && !org.trialEndsAt;
}

export function evaluateBillingLifecycle(
    org: Pick<Organization, 'plan' | 'trialActive' | 'trialEndsAt' | 'subscriptionExpiresAt'>,
    now: Date = new Date(),
): BillingLifecycleState {
    const nowMs = now.getTime();
    const trialEndMs = org.trialEndsAt ? new Date(org.trialEndsAt).getTime() : NaN;
    const subscriptionEndMs = org.subscriptionExpiresAt
        ? new Date(org.subscriptionExpiresAt).getTime()
        : NaN;

    const trialExpired = !!org.trialActive && !Number.isNaN(trialEndMs) && trialEndMs <= nowMs;
    const subscriptionExpired =
        !Number.isNaN(subscriptionEndMs) && subscriptionEndMs <= nowMs && (org.plan ?? 'free') !== 'free';

    return {
        trialExpired,
        subscriptionExpired,
        shouldDowngradeToFree: trialExpired || subscriptionExpired,
    };
}

export function getPlanTransitionDecision(
    currentPlan: PlanTier,
    targetPlan: PlanTier,
    subscriptionExpiresAt?: string,
    now: Date = new Date(),
): PlanTransitionDecision {
    if (currentPlan === targetPlan) {
        return {
            allowed: false,
            direction: 'none',
            applyAt: 'none',
            reason: 'Current plan and target plan are identical.',
            effectivePlan: currentPlan,
        };
    }

    const upgrading = TIER_ORDER[targetPlan] > TIER_ORDER[currentPlan];
    if (upgrading) {
        return {
            allowed: true,
            direction: 'upgrade',
            applyAt: 'immediate',
            reason: 'Upgrades are applied immediately.',
            effectivePlan: targetPlan,
        };
    }

    if (!subscriptionExpiresAt) {
        return {
            allowed: true,
            direction: 'downgrade',
            applyAt: 'immediate',
            reason: 'No active paid period found; downgrade can be applied immediately.',
            effectivePlan: targetPlan,
        };
    }

    const expiryDate = new Date(subscriptionExpiresAt);
    if (expiryDate.getTime() <= now.getTime()) {
        return {
            allowed: true,
            direction: 'downgrade',
            applyAt: 'immediate',
            reason: 'Paid period already expired; downgrade can be applied immediately.',
            effectivePlan: targetPlan,
        };
    }

    return {
        allowed: true,
        direction: 'downgrade',
        applyAt: 'period_end',
        reason: 'Active paid period detected; downgrade should take effect at period end.',
        effectivePlan: currentPlan,
        scheduledAt: expiryDate.toISOString(),
    };
}

export async function reconcileOrganizationBilling(orgId: string): Promise<void> {
    const orgRef = doc(db, 'organizations', orgId);
    const snapshot = await getDoc(orgRef);
    if (!snapshot.exists()) return;

    const org = snapshot.data() as Organization;
    const lifecycle = evaluateBillingLifecycle(org);
    if (!lifecycle.shouldDowngradeToFree) return;

    await updateDoc(orgRef, {
        plan: 'free' as PlanTier,
        trialActive: false,
        updatedAt: new Date().toISOString(),
    });
}

export async function startFreeTrial(orgId: string): Promise<void> {
    const orgRef = doc(db, 'organizations', orgId);
    const currentOrg = await getDoc(orgRef);
    if (!currentOrg.exists()) {
        throw new Error('Organization not found.');
    }

    const org = { id: currentOrg.id, ...currentOrg.data() } as Organization;
    if (!isTrialEligible(org)) {
        throw new Error('Organization is not eligible for a new free trial.');
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await updateDoc(orgRef, {
        trialActive: true,
        trialEndsAt: trialEndsAt.toISOString(),
        plan: 'professional' as PlanTier,
        updatedAt: new Date().toISOString(),
    });
}
