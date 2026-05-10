/**
 * Tour Store — Zustand state for the guided tour system
 *
 * Previously, tour state lived in useTourManager (local useState).
 * This caused a critical bug: each component calling useTourManager()
 * got its own independent state — so TourController never saw tours
 * started from TourMenu/TourLauncher.
 *
 * Moving to Zustand ensures ALL components share the same active tour state.
 */

import { TourConfig } from '@/utils/tourRegistry';
import { create } from 'zustand';

interface TourStoreState {
    /** ID of the currently active/playing tour, or null */
    activeTourId: string | null;
    /** IDs of tours the current user has completed (loaded from localStorage) */
    completedTourIds: string[];
    /** Config of the currently active tour, or null */
    currentTour: TourConfig | null;
    /** Whether to show confetti animation */
    showConfetti: boolean;

    // Actions
    setActiveTour: (tourId: string | null, tour: TourConfig | null) => void;
    setCompletedTours: (ids: string[]) => void;
    addCompletedTour: (tourId: string) => void;
    setShowConfetti: (show: boolean) => void;
}

export const useTourStore = create<TourStoreState>((set) => ({
    activeTourId: null,
    completedTourIds: [],
    currentTour: null,
    showConfetti: false,

    setActiveTour: (tourId, tour) =>
        set({ activeTourId: tourId, currentTour: tour }),

    setCompletedTours: (ids) =>
        set({ completedTourIds: ids }),

    addCompletedTour: (tourId) =>
        set((state) => ({
            completedTourIds: [...state.completedTourIds, tourId],
            activeTourId: null,
            currentTour: null,
            showConfetti: true,
        })),

    setShowConfetti: (show) =>
        set({ showConfetti: show }),
}));
