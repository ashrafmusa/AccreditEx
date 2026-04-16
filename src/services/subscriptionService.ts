/**
 * subscriptionService — Stripe Payment Link redirects + plan helpers
 *
 * Architecture (zero-cost):
 *   1. Payment Links are created once in the Stripe Dashboard (free).
 *   2. We redirect the user to the link URL — no server call needed.
 *   3. After payment Stripe POSTs to our Render webhook which updates Firestore.
 *   4. useTenantStore reads the updated plan from Firestore automatically.
 *
 * No Firebase Functions required → stays on Spark (free) plan.
 */

import type { PlanTier } from '@/types/modules';

// ── Plan metadata (display-only, maps internal tier → marketing info) ──────

export interface PlanInfo {
    /** Internal tier string used in Firestore and type system */
    tier: PlanTier;
    /** Marketing name shown in UI */
    name: string;
    /** Short tagline */
    tagline: string;
    /** Price shown (null = custom / contact sales) */
    price: string | null;
    /** Billing period label */
    period: string;
    /** Key features for the pricing card */
    highlights: string[];
    /** Whether this is the recommended plan */
    recommended?: boolean;
}

export const PLANS: PlanInfo[] = [
    {
        tier: 'free',
        name: 'Solo',
        tagline: 'For individual quality officers',
        price: '$0',
        period: 'forever',
        highlights: [
            'Up to 3 projects',
            'Basic accreditation tracking',
            'Standards library (read-only)',
            'Email support',
        ],
    },
    {
        tier: 'starter',
        name: 'Clinic',
        tagline: 'For small clinics and polyclinics',
        price: '$49',
        period: 'per month',
        highlights: [
            'Up to 20 projects',
            'Document control module',
            'Risk management module',
            'Training hub + competencies',
            'Internal messaging',
            'Knowledge base',
            'Priority email support',
        ],
    },
    {
        tier: 'professional',
        name: 'Hospital',
        tagline: 'For hospitals and large facilities',
        price: '$199',
        period: 'per month',
        recommended: true,
        highlights: [
            'Unlimited projects',
            'All Clinic features',
            'Analytics hub + report builder',
            'Audit hub',
            'Workflow automation',
            'Lab operations module',
            'AI assistant',
            'White-label customization',
            'Dedicated support',
        ],
    },
    {
        tier: 'enterprise',
        name: 'Network',
        tagline: 'For hospital networks & health systems',
        price: null,
        period: 'custom pricing',
        highlights: [
            'All Hospital features',
            'Multi-branch management',
            'HIS / LIMS deep integration',
            'Custom SLA',
            'On-premise deployment option',
            'Dedicated account manager',
        ],
    },
];

// ── Stripe Payment Link URLs (set in .env) ────────────────────────────────

const PAYMENT_LINKS: Partial<Record<PlanTier, string>> = {
    starter: import.meta.env.VITE_STRIPE_LINK_CLINIC ?? '',
    professional: import.meta.env.VITE_STRIPE_LINK_HOSPITAL ?? '',
    enterprise: import.meta.env.VITE_STRIPE_LINK_NETWORK ?? '',
};

/**
 * Redirect to the Stripe Payment Link for the given plan.
 * Appends `?client_reference_id={orgId}` so Stripe passes it through
 * to the webhook metadata for Firestore plan updates.
 */
export function redirectToStripePaymentLink(tier: PlanTier, orgId: string): void {
    const base = PAYMENT_LINKS[tier];
    if (!base) {
        // No link configured — open Stripe dashboard contact page as fallback
        window.open('https://stripe.com', '_blank', 'noopener,noreferrer');
        return;
    }
    const url = new URL(base);
    url.searchParams.set('client_reference_id', orgId);
    window.location.href = url.toString();
}

// ── Plan comparison helpers ───────────────────────────────────────────────

const TIER_ORDER: Record<PlanTier, number> = {
    free: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
};

/** Returns true if `current` meets or exceeds `required`. */
export function planMeetsRequirement(current: PlanTier, required: PlanTier): boolean {
    return TIER_ORDER[current] >= TIER_ORDER[required];
}

/** Returns the PlanInfo for a given tier. */
export function getPlanInfo(tier: PlanTier): PlanInfo {
    return PLANS.find((p) => p.tier === tier) ?? PLANS[0];
}
