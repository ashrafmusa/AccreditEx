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

import { db } from '@/firebase/firebaseConfig';
import type { PlanTier } from '@/types/modules';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
export { getEffectivePlan } from '@/services/moduleService';
export {
    evaluateBillingLifecycle,
    getPlanTransitionDecision,
    isTrialEligible,
    reconcileOrganizationBilling,
    startFreeTrial
} from '@/services/subscriptionLifecycleService';

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

/** Returns true if a Stripe Payment Link is configured in environment variables for this tier. */
export function hasStripePaymentLink(tier: PlanTier): boolean {
    return Boolean(PAYMENT_LINKS[tier]?.trim());
}

/**
 * Redirect to the Stripe Payment Link for the given plan.
 * Appends `?client_reference_id={orgId}` so Stripe passes it through
 * to the webhook metadata for Firestore plan updates.
 */
export function redirectToStripePaymentLink(tier: PlanTier, orgId: string): boolean {
    const base = PAYMENT_LINKS[tier];
    if (!base) {
        return false;
    }
    const url = new URL(base);
    url.searchParams.set('client_reference_id', orgId);
    window.location.href = url.toString();
    return true;
}

export interface PlanUpgradeRequestInput {
    name: string;
    email: string;
    organizationName: string;
    organizationId?: string;
    targetTier: PlanTier;
    billingCycle: 'monthly' | 'annual';
    paymentMethod: 'invoice_po' | 'bank_transfer' | 'card_link';
    notes?: string;
}

/**
 * Submits a zero-cost Plan Upgrade / Proforma Invoice / PO request to Firestore (`demoRequests`),
 * matching the validated schema in firestore.rules so both authenticated and public users can submit.
 */
export async function submitPlanUpgradeRequest(input: PlanUpgradeRequestInput): Promise<void> {
    const planInfo = getPlanInfo(input.targetTier);
    const structuredMessage = [
        `[PLAN UPGRADE / PROFORMA REQUEST]`,
        `Target Tier: ${planInfo.name} (${input.targetTier.toUpperCase()})`,
        `Billing Cycle: ${input.billingCycle === 'annual' ? 'Annual (20% Discount)' : 'Monthly'}`,
        `Payment Method: ${input.paymentMethod === 'invoice_po' ? 'Official Invoice / Purchase Order (PO)' : input.paymentMethod === 'bank_transfer' ? 'Bank Wire Transfer' : 'Online Payment Link'}`,
        input.organizationId ? `Organization ID: ${input.organizationId}` : '',
        input.notes?.trim() ? `Procurement Notes: ${input.notes.trim()}` : '',
    ]
        .filter(Boolean)
        .join(' | ')
        .slice(0, 1950);

    await addDoc(collection(db, 'demoRequests'), {
        name: input.name.trim().slice(0, 120) || 'Facility Administrator',
        email: input.email.trim().slice(0, 160) || 'admin@facility.org',
        organization: input.organizationName.trim().slice(0, 160) || 'Healthcare Facility',
        message: structuredMessage,
        createdAt: serverTimestamp(),
        status: 'new',
    });
}

/**
 * Generates and opens a print-ready Official Proforma Invoice / Subscription Quotation (PDF)
 * for hospital/clinic procurement and finance approval ($0 cost, zero external dependencies).
 */
export function printProformaQuote(input: {
    organizationName: string;
    organizationId?: string;
    contactName: string;
    contactEmail: string;
    targetTier: PlanTier;
    billingCycle: 'monthly' | 'annual';
    poNumber?: string;
}): void {
    const plan = getPlanInfo(input.targetTier);
    const monthlyBase =
        input.targetTier === 'starter'
            ? 49
            : input.targetTier === 'professional'
              ? 199
              : input.targetTier === 'enterprise'
                ? 499
                : 0;
    const unitPrice =
        input.billingCycle === 'annual' ? Math.round(monthlyBase * 0.8) : monthlyBase;
    const totalAmount =
        input.billingCycle === 'annual' ? unitPrice * 12 : unitPrice;
    const quoteNumber = `QT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const issueDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    });
    const validUntil = new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AccreditEx Official Proforma Invoice — ${quoteNumber}</title>
  <style>
    * { box-sizing: border-box; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
    body { margin: 0; padding: 32px; color: #0f172a; background: #fff; }
    .sheet { max-width: 820px; margin: 0 auto; border: 2px solid #0f172a; padding: 28px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { font-size: 24px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
    .sub { font-size: 12px; color: #475569; margin-top: 4px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; background: #f8fafc; font-size: 13px; }
    .box h4 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; color: #1e293b; }
    .total-row td { font-weight: 800; font-size: 15px; background: #f0f9ff; }
    .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #94a3b8; font-size: 12px; }
    .sig-line { margin-top: 38px; border-top: 1px solid #334155; padding-top: 6px; font-weight: 600; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:820px;margin:0 auto 16px auto;text-align:right;">
    <button onclick="window.print()" style="background:#0284c7;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;">Print / Save as PDF</button>
  </div>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="brand">AccreditEx Healthcare Quality & Accreditation Platform</div>
        <div class="sub">Enterprise Healthcare SaaS · CBAHI · JCI · CAP · ISO 15189 · CLIA Compliance</div>
      </div>
      <div style="text-align:right;">
        <span class="badge">Official Proforma Invoice / Quote</span>
        <div style="font-size:13px;font-weight:700;margin-top:6px;">Ref: ${quoteNumber}</div>
        <div class="sub">Issued: ${issueDate} · Valid Until: ${validUntil}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <h4>Prepared For (Healthcare Institution)</h4>
        <div><strong>${input.organizationName || 'Healthcare Facility'}</strong></div>
        <div>Attn: ${input.contactName || 'Quality & Accreditation Director'}</div>
        <div>Email: ${input.contactEmail || '—'}</div>
        ${input.organizationId ? `<div>Tenant ID: <code>${input.organizationId}</code></div>` : ''}
        ${input.poNumber ? `<div>Client PO / Ref: <strong>${input.poNumber}</strong></div>` : ''}
      </div>
      <div class="box">
        <h4>Vendor & Remittance Details</h4>
        <div><strong>AccreditEx Cloud Platform (Excellence Quest Consultancy)</strong></div>
        <div>Support & Billing: excellencequestconsultancy@gmail.com</div>
        <div>Payment Terms: Net 14 Days / Purchase Order (PO) / Bank Wire</div>
        <div>Activation: Immediate upon PO or remittance confirmation</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Subscription Tier & Included Healthcare Modules</th>
          <th>Billing Cycle</th>
          <th>Unit Rate</th>
          <th>Total (USD)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>AccreditEx ${plan.name} Plan (${input.targetTier.toUpperCase()} Tier)</strong>
            <ul style="margin:6px 0 0 18px;padding:0;color:#334155;">
              ${plan.highlights.map((h) => `<li>${h}</li>`).join('')}
            </ul>
          </td>
          <td>${input.billingCycle === 'annual' ? 'Annual Subscription (12 Months — 20% Healthcare Discount)' : 'Monthly Subscription'}</td>
          <td>$${unitPrice} / mo</td>
          <td><strong>$${totalAmount.toLocaleString()} USD</strong></td>
        </tr>
        <tr class="total-row">
          <td colspan="3" style="text-align:right;">Total Amount Due (Tax-Exempt / SaaS License):</td>
          <td>$${totalAmount.toLocaleString()} USD</td>
        </tr>
      </tbody>
    </table>

    <div class="footer-grid">
      <div>
        <strong>Procurement & Activation Instructions:</strong>
        <ol style="margin:6px 0 0 16px;padding:0;line-height:1.5;">
          <li>Attach this Proforma Quote to your internal Purchase Order (PO) or payment voucher.</li>
          <li>Send the approved PO or transfer receipt to <strong>excellencequestconsultancy@gmail.com</strong> referencing <strong>${quoteNumber}</strong>.</li>
          <li>Your Tenant ID is upgraded automatically with zero downtime.</li>
        </ol>
      </div>
      <div>
        <div class="sig-line">Authorized Facility Procurement / Quality Approval</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px;">Date & Institutional Stamp</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=920,height=800');
    if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        setTimeout(() => {
            try {
                win.focus();
                win.print();
            } catch {
                // Ignore print errors in headless environments
            }
        }, 250);
    }
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

// Free-trial lifecycle operations are exported from subscriptionLifecycleService.
