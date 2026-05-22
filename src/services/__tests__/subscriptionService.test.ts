import {
    evaluateBillingLifecycle,
    getPlanTransitionDecision,
    isTrialEligible,
    reconcileOrganizationBilling,
    startFreeTrial,
} from '../subscriptionLifecycleService';

const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
    doc: (...args: unknown[]) => mockDoc(...args),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));

jest.mock('../../firebase/firebaseConfig', () => ({
    db: 'mocked-db',
}));

describe('subscriptionService lifecycle', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDoc.mockImplementation((_db: unknown, collectionName: string, id: string) => ({
            path: `${collectionName}/${id}`,
        }));
    });

    describe('isTrialEligible', () => {
        it('returns true only for free org with no prior trial', () => {
            expect(
                isTrialEligible({
                    id: 'org-1',
                    name: 'Org',
                    type: 'hospital',
                    isActive: true,
                    createdAt: '2026-01-01',
                    plan: 'free',
                }),
            ).toBe(true);

            expect(
                isTrialEligible({
                    id: 'org-2',
                    name: 'Org',
                    type: 'hospital',
                    isActive: true,
                    createdAt: '2026-01-01',
                    plan: 'professional',
                }),
            ).toBe(false);

            expect(
                isTrialEligible({
                    id: 'org-3',
                    name: 'Org',
                    type: 'hospital',
                    isActive: true,
                    createdAt: '2026-01-01',
                    plan: 'free',
                    trialEndsAt: '2026-01-20T00:00:00.000Z',
                }),
            ).toBe(false);
        });
    });

    describe('evaluateBillingLifecycle', () => {
        it('flags expired trial for downgrade', () => {
            const state = evaluateBillingLifecycle(
                {
                    plan: 'professional',
                    trialActive: true,
                    trialEndsAt: '2026-01-01T00:00:00.000Z',
                },
                new Date('2026-01-15T00:00:00.000Z'),
            );

            expect(state.trialExpired).toBe(true);
            expect(state.shouldDowngradeToFree).toBe(true);
        });

        it('flags expired paid subscription for downgrade', () => {
            const state = evaluateBillingLifecycle(
                {
                    plan: 'starter',
                    trialActive: false,
                    subscriptionExpiresAt: '2026-01-01T00:00:00.000Z',
                },
                new Date('2026-01-15T00:00:00.000Z'),
            );

            expect(state.subscriptionExpired).toBe(true);
            expect(state.shouldDowngradeToFree).toBe(true);
        });

        it('does not downgrade active paid subscription', () => {
            const state = evaluateBillingLifecycle(
                {
                    plan: 'professional',
                    trialActive: false,
                    subscriptionExpiresAt: '2026-02-01T00:00:00.000Z',
                },
                new Date('2026-01-15T00:00:00.000Z'),
            );

            expect(state.shouldDowngradeToFree).toBe(false);
        });
    });

    describe('getPlanTransitionDecision', () => {
        it('applies upgrades immediately', () => {
            const decision = getPlanTransitionDecision('starter', 'professional');
            expect(decision.allowed).toBe(true);
            expect(decision.direction).toBe('upgrade');
            expect(decision.applyAt).toBe('immediate');
            expect(decision.effectivePlan).toBe('professional');
        });

        it('schedules downgrade to period end when paid period is active', () => {
            const decision = getPlanTransitionDecision(
                'professional',
                'starter',
                '2026-02-01T00:00:00.000Z',
                new Date('2026-01-15T00:00:00.000Z'),
            );
            expect(decision.allowed).toBe(true);
            expect(decision.direction).toBe('downgrade');
            expect(decision.applyAt).toBe('period_end');
            expect(decision.effectivePlan).toBe('professional');
            expect(decision.scheduledAt).toBe('2026-02-01T00:00:00.000Z');
        });

        it('applies downgrade immediately after expiry', () => {
            const decision = getPlanTransitionDecision(
                'professional',
                'starter',
                '2026-01-01T00:00:00.000Z',
                new Date('2026-01-15T00:00:00.000Z'),
            );
            expect(decision.applyAt).toBe('immediate');
            expect(decision.effectivePlan).toBe('starter');
        });
    });

    describe('startFreeTrial', () => {
        it('updates organization with trial fields for eligible org', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'org-1',
                data: () => ({
                    plan: 'free',
                    trialActive: false,
                }),
            });

            await startFreeTrial('org-1');

            expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
            expect(mockUpdateDoc).toHaveBeenCalledWith(
                { path: 'organizations/org-1' },
                expect.objectContaining({
                    trialActive: true,
                    plan: 'professional',
                }),
            );
        });

        it('throws for non-eligible org', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                id: 'org-1',
                data: () => ({
                    plan: 'professional',
                    trialActive: false,
                }),
            });

            await expect(startFreeTrial('org-1')).rejects.toThrow(
                'Organization is not eligible for a new free trial.',
            );
            expect(mockUpdateDoc).not.toHaveBeenCalled();
        });
    });

    describe('reconcileOrganizationBilling', () => {
        it('downgrades expired trial org to free', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    plan: 'professional',
                    trialActive: true,
                    trialEndsAt: '2026-01-01T00:00:00.000Z',
                }),
            });

            await reconcileOrganizationBilling('org-1');

            expect(mockUpdateDoc).toHaveBeenCalledWith(
                { path: 'organizations/org-1' },
                expect.objectContaining({
                    plan: 'free',
                    trialActive: false,
                }),
            );
        });

        it('does not update when billing is still active', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({
                    plan: 'professional',
                    trialActive: false,
                    subscriptionExpiresAt: '2099-01-01T00:00:00.000Z',
                }),
            });

            await reconcileOrganizationBilling('org-1');

            expect(mockUpdateDoc).not.toHaveBeenCalled();
        });
    });
});
