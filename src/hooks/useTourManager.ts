/**
 * Tour Manager Hook
 *
 * Handles tour state, completion tracking, and auto-triggering.
 * State is stored in useTourStore (Zustand) so ALL components that
 * call useTourManager() share the same active tour — this is what
 * allows TourMenu to start a tour and TourController to render it.
 */

import { useTourStore } from '@/stores/useTourStore';
import { useUserStore } from '@/stores/useUserStore';
import {
    AccreditationProgram,
    getApplicableTours,
    getTourById,
} from '@/utils/tourRegistry';
import { useCallback, useEffect } from 'react';

const TOUR_STORAGE_PREFIX = 'accreditex_tour_completed_';
const ACTIVE_TOUR_STORAGE_KEY = 'accreditex_active_tour';

const normalizeProgram = (program?: string): AccreditationProgram | undefined => {
    if (program === 'cbahi' || program === 'ashk' || program === 'jci' || program === 'other') {
        return program;
    }
    return undefined;
};

export const useTourManager = () => {
    const currentUser = useUserStore((state) => state.currentUser);

    // ── Zustand store (shared across ALL components) ──────────────
    const activeTourId = useTourStore((state) => state.activeTourId);
    const completedTourIds = useTourStore((state) => state.completedTourIds);
    const currentTour = useTourStore((state) => state.currentTour);
    const showConfetti = useTourStore((state) => state.showConfetti);
    const setActiveTour = useTourStore((state) => state.setActiveTour);
    const setCompletedTours = useTourStore((state) => state.setCompletedTours);
    const addCompletedTour = useTourStore((state) => state.addCompletedTour);
    const setShowConfetti = useTourStore((state) => state.setShowConfetti);

    // Load completed tours from localStorage when user changes
    useEffect(() => {
        if (!currentUser?.id) return;

        const userTourPrefix = `${TOUR_STORAGE_PREFIX}${currentUser.id}_`;
        const completed: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(userTourPrefix)) {
                completed.push(key.replace(userTourPrefix, ''));
            }
        }

        setCompletedTours(completed);
    }, [currentUser?.id, setCompletedTours]);

    // Start a specific tour
    const startTour = useCallback(
        (tourId: string) => {
            const tour = getTourById(tourId);
            if (!tour) return;
            setActiveTour(tourId, tour);
            localStorage.setItem(ACTIVE_TOUR_STORAGE_KEY, tourId);
        },
        [setActiveTour],
    );

    // Stop current tour without marking it completed
    const stopTour = useCallback(() => {
        setActiveTour(null, null);
        localStorage.removeItem(ACTIVE_TOUR_STORAGE_KEY);
    }, [setActiveTour]);

    // Mark tour as completed and persist to localStorage
    const completeTour = useCallback(
        (tourId: string) => {
            if (!currentUser?.id) return;
            const key = `${TOUR_STORAGE_PREFIX}${currentUser.id}_${tourId}`;
            localStorage.setItem(key, 'true');
            addCompletedTour(tourId); // also sets showConfetti: true in store
            setTimeout(() => setShowConfetti(false), 2500);
        },
        [currentUser?.id, addCompletedTour, setShowConfetti],
    );

    // Auto-trigger applicable tours on first login
    // NOTE: intentionally disabled — tours are user-controlled via the Tours button.
    // To enable auto-start for new users, uncomment the startTour call below.
    useEffect(() => {
        if (!currentUser?.id || !currentUser.role || activeTourId) return;

        const applicableTours = getApplicableTours({
            role: currentUser.role,
            program: normalizeProgram(currentUser.profile?.accreditationProgram),
            trigger: 'first-login',
            excludeCompleted: true,
            completedTours: completedTourIds,
        });

        if (applicableTours.length > 0) {
            // startTour(applicableTours[0].id); // uncomment to enable auto-start
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.id, currentUser?.role]);

    // Auto-start welcome tour triggered by post-onboarding flag
    // Guard: only consume the flag if no tour is already running
    useEffect(() => {
        if (!currentUser?.id || activeTourId) return;
        const pending = localStorage.getItem('accreditex_start_welcome_tour');
        if (pending === 'true') {
            localStorage.removeItem('accreditex_start_welcome_tour');
            const timer = setTimeout(() => startTour('new-user-main'), 1500);
            return () => clearTimeout(timer);
        }
    }, [currentUser?.id, activeTourId, startTour]);

    // Check if a specific tour is completed
    const isTourCompleted = useCallback(
        (tourId: string) => completedTourIds.includes(tourId),
        [completedTourIds],
    );

    // Get all tours available to this user (for TourMenu display)
    const getAvailableTours = useCallback(() => {
        if (!currentUser?.id || !currentUser.role) return [];
        return getApplicableTours({
            role: currentUser.role,
            program: normalizeProgram(currentUser.profile?.accreditationProgram),
        });
    }, [currentUser]);

    // Get tours the user hasn't completed yet
    const getUncompletedTours = useCallback(() => {
        return getAvailableTours().filter((t) => !isTourCompleted(t.id));
    }, [getAvailableTours, isTourCompleted]);

    return {
        // State
        activeTourId,
        currentTour,
        completedTourIds,
        showConfetti,

        // Actions
        startTour,
        stopTour,
        completeTour,
        isTourCompleted,
        getAvailableTours,
        getUncompletedTours,
    };
};

export default useTourManager;
