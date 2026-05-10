/**
 * Tour Controller Component
 *
 * Manages tour display and integration with the app
 * - Displays current active tour using GuidedTour component
 * - Handles tour completion and confetti animation
 * - Integrates with useTourManager hook
 * - Can be placed at app root level
 */

import { useTourManager } from "@/hooks/useTourManager";
import React from "react";
import GuidedTour from "./GuidedTour";

interface TourControllerProps {
  /** Optional: disable auto-triggering */
  disableAutoTrigger?: boolean;
}

export const TourController: React.FC<TourControllerProps> = ({
  disableAutoTrigger = false,
}) => {
  const tourManager = useTourManager();

  if (!tourManager.currentTour || !tourManager.activeTourId) {
    return null;
  }

  return (
    <GuidedTour
      tourId={tourManager.activeTourId}
      steps={tourManager.currentTour.steps}
      isActive={!!tourManager.activeTourId}
      forceShow={true}
      onComplete={() => {
        const activeTourId = tourManager.activeTourId;
        if (!activeTourId) {
          return;
        }
        tourManager.completeTour(activeTourId);
      }}
      completionBadge={tourManager.currentTour.completionBadge}
      hideIfCompleted={false}
    />
  );
};

export default TourController;
