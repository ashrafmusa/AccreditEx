/**
 * TOUR SYSTEM INTEGRATION GUIDE
 * 
 * AccrediTex Enhanced Tour System - Complete Implementation
 * 
 * ========================================================================
 * QUICK START
 * ========================================================================
 * 
 * 1. Add TourController to App.tsx:
 *    ```tsx
 *    import TourController from '@/components/onboarding/TourController';
 *    
 *    function App() {
 *      return (
 *        <>
 *          <TourController />
 *          {/* rest of app */}
 * </>
    *      );
 *    }
 * ```
 * 
 * 2. Add TourLauncher to your navigation:
 *    ```tsx
    *    import TourLauncher from '@/components/onboarding/TourLauncher';
 *    
 * function NavigationBar() {
 *      return (
 * <nav>
 * <TourLauncher variant= "icon" />
 * </nav>
            *      );
 *    }
    * ```
 * 
 * ========================================================================
 * FILES CREATED
 * ========================================================================
 * 
 * src/utils/tourRegistry.ts (350+ lines)
 * ├─ TourConfig interface
 * ├─ TOUR_REGISTRY object (8 pre-configured tours)
 * └─ Helper functions:
 *    ├─ getToursByCategory()
 *    ├─ getToursByTrigger()
 *    ├─ getToursByRole()
 *    ├─ getToursByProgram()
 *    ├─ getTourById()
 *    └─ getApplicableTours()
 * 
 * src/hooks/useTourManager.ts
 * ├─ Tour state management (activeId, completedIds, currentTour)
 * ├─ localStorage persistence
 * └─ Methods:
 *    ├─ startTour(tourId)
 *    ├─ stopTour()
 *    ├─ completeTour(tourId)
 *    ├─ isTourCompleted(tourId)
 *    ├─ getAvailableTours()
 *    └─ getUncompletedTours()
 * 
 * src/components/onboarding/Confetti.tsx
 * ├─ Celebratory confetti animation on tour completion
 * └─ 50 particles, 2-second duration, smooth fade-out
 * 
 * src/components/onboarding/TourMenu.tsx
 * ├─ Display available tours organized by category
 * ├─ Show completion status (✓ badge)
 * ├─ Display estimated duration
 * └─ One-click launch
 * 
 * src/components/onboarding/TourLauncher.tsx
 * ├─ Compact button for quick tour access
 * ├─ Icon or text variant
 * ├─ Uncompleted tour counter badge
 * └─ Dropdown menu with TourMenu
 * 
 * src/components/onboarding/TourController.tsx
 * ├─ App-level tour display controller
 * ├─ Integrates useTourManager with GuidedTour
 * └─ Handles completion flow
 * 
 * src/components/onboarding/GuidedTour.tsx (ENHANCED)
 * ├─ Added Confetti animation prop
 * ├─ Added completionBadge display
 * ├─ Added hideIfCompleted option
 * └─ Integration with TourController
 * 
 * ========================================================================
 * PRE-CONFIGURED TOURS (8 total)
 * ========================================================================
 * 
 * ONBOARDING CATEGORY:
 * ├─ new-user-main
 * │  ├─ Trigger: first-login
 * │  ├─ Roles: all
 * │  ├─ Programs: all
 * │  ├─ Steps: 7 (Dashboard, Projects, Accreditation, Documents, Training, Analytics, Settings)
 * │  └─ Duration: 2 minutes
 * │
 * ROLE-SPECIFIC CATEGORY:
 * ├─ quality-manager
 * │  ├─ Trigger: first-login
 * │  ├─ Roles: quality_manager, auditor
 * │  ├─ Badge: quality-manager-trained
 * │  ├─ Steps: 4 (Audit Hub, Risk Hub, Data Hub, Knowledge Base)
 * │  └─ Duration: 1.5 minutes
 * │
 * PROGRAM-SPECIFIC CATEGORY:
 * ├─ cbahi-intro
 * │  ├─ Trigger: program-selected
 * │  ├─ Program: cbahi
 * │  ├─ Badge: cbahi-certified
 * │  └─ Duration: 2.5 minutes
 * ├─ ashk-intro
 * │  ├─ Trigger: program-selected
 * │  ├─ Program: ashk
 * │  ├─ Badge: ashk-certified
 * │  └─ Duration: 2.5 minutes
 * ├─ jci-intro
 * │  ├─ Trigger: program-selected
 * │  ├─ Program: jci
 * │  ├─ Badge: jci-certified
 * │  └─ Duration: 2.5 minutes
 * │
 * FEATURE-SPECIFIC CATEGORY:
 * ├─ ai-briefing
 * │  ├─ Trigger: manual
 * │  └─ Duration: 45 seconds
 * ├─ document-editor
 * │  ├─ Trigger: manual
 * │  └─ Duration: 60 seconds
 * 
 * ========================================================================
 * HOW TO ADD NEW TOURS
 * ========================================================================
 * 
 * 1. Edit src/utils/tourRegistry.ts
 * 2. Add entry to TOUR_REGISTRY:
 * 
 *    'my-feature-tour': {
 *      id: 'my-feature-tour',
 *      name: 'My Feature Tour',
 *      category: 'feature',  // or 'onboarding', 'role-specific', 'program-specific'
 *      trigger: 'manual',    // or 'first-login', 'program-selected', 'always'
 *      description: 'Learn about my feature',
 *      estimatedDuration: 90,
 *      roles: ['admin'],     // optional: restrict by role
 *      programs: ['cbahi'],  // optional: restrict by program
 *      completionBadge: 'my-feature-expert',  // optional
 *      steps: [
 *        {
 *          target: '#my-feature-button',
 *          titleKey: 'tourMyFeatureTitle',
 *          descriptionKey: 'tourMyFeatureDesc',
 *          placement: 'right',
 *        },
 *        // ... more steps
 *      ],
 *    },
 * 
 * 3. Add i18n keys to src/data/locales/en/onboarding.ts:
 *    tourMyFeatureTitle: 'My Feature',
 *    tourMyFeatureDesc: 'Description of my feature...',
 * 
 * 4. Add to Arabic file src/data/locales/ar/onboarding.ts:
 *    tourMyFeatureTitle: 'ميزتي',
 *    tourMyFeatureDesc: 'وصف ميزتي...',
 * 
 * ========================================================================
 * HOW TO TRIGGER TOURS PROGRAMMATICALLY
 * ========================================================================
 * 
 * In any component:
 * 
 *    import { useTourManager } from '@/hooks/useTourManager';
 *    
 *    function MyComponent() {
 *      const tourManager = useTourManager();
 *      
 *      return (
 *        <button onClick={() => tourManager.startTour('my-feature-tour')}>
 *          Start Tour
 *        </button>
 *      );
 *    }
 * 
 * ========================================================================
 * STORAGE & PERSISTENCE
 * ========================================================================
 * 
 * Tours are tracked in localStorage with this key format:
 *   accreditex_tour_completed_{userId}_{tourId}
 * 
 * Example: accreditex_tour_completed_user123_new-user-main
 * 
 * To clear a user's tour history:
 *   localStorage.removeItem('accreditex_tour_completed_user123_new-user-main');
 * 
 * To clear all tours for a user:
 *   Object.keys(localStorage)
 *     .filter(k => k.startsWith('accreditex_tour_completed_user123_'))
 *     .forEach(k => localStorage.removeItem(k));
 * 
 * ========================================================================
 * COMPLETION BADGES & GAMIFICATION
 * ========================================================================
 * 
 * Tours support optional completion badges:
 *   - quality-manager-trained
 *   - cbahi-certified
 *   - ashk-certified
 *   - jci-certified
 *   - my-feature-expert (custom)
 * 
 * When a tour with completionBadge is finished:
 * 1. Confetti animation plays (2 seconds)
 * 2. Badge appears in tooltip (last step)
 * 3. Badge ID is stored locally
 * 4. (TODO) Award badge in gamification system
 * 
 * ========================================================================
 * CATEGORY ORGANIZATION
 * ========================================================================
 * 
 * Tours are organized into 4 categories for the menu:
 * 
 * 🚀 ONBOARDING
 * ├─ For new users getting started
 * └─ Usually first-login trigger
 * 
 * 👤 ROLE-SPECIFIC
 * ├─ For users with specific roles
 * └─ e.g., quality_manager, auditor
 * 
 * 📋 PROGRAM-SPECIFIC
 * ├─ For users with specific accreditation program
 * └─ e.g., CBAHI, ASHK, JCI
 * 
 * ✨ FEATURES
 * ├─ For learning specific features
 * └─ Usually manual trigger (on request)
 * 
 * ========================================================================
 * TOUR TRIGGERING RULES
 * ========================================================================
 * 
 * 'first-login'
 * - Auto-triggers once when user completes onboarding
 * - Role & program filtered
 * - Marked complete in localStorage
 * - Can be replayed from TourLauncher menu
 * 
 * 'program-selected'
 * - Auto-triggers when user selects an accreditation program
 * - Program-specific tours only
 * - Marked complete in localStorage
 * - Can be replayed from TourLauncher menu
 * 
 * 'manual'
 * - Only triggers on user request (click TourLauncher button)
 * - Feature-specific tours usually use this
 * - Can be launched anytime from menu
 * 
 * 'always'
 * - Available for replay at any time
 * - Not auto-triggered
 * - Always appears in TourLauncher menu
 * 
 * ========================================================================
 * API REFERENCE
 * ========================================================================
 * 
 * TOUR REGISTRY FUNCTIONS:
 * 
 * getToursByCategory(category: TourCategory): TourConfig[]
 *   Returns all tours in a category
 * 
 * getToursByTrigger(trigger: TourTrigger): TourConfig[]
 *   Returns all tours with a specific trigger
 * 
 * getToursByRole(role: string): TourConfig[]
 *   Returns tours applicable to a role (empty roles = all)
 * 
 * getToursByProgram(program: AccreditationProgram): TourConfig[]
 *   Returns tours for a specific program (empty programs = all)
 * 
 * getTourById(id: string): TourConfig | undefined
 *   Returns a specific tour by ID
 * 
 * getApplicableTours(options: {
 *   role?: string;
 *   program?: AccreditationProgram;
 *   trigger?: TourTrigger;
 *   excludeCompleted?: boolean;
 *   completedTours?: string[];
 * }): TourConfig[]
 *   Complex filter combining multiple criteria
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * useTourManager() Hook:
 * 
 * activeTourId: string | null
 *   Currently active tour ID
 * 
 * currentTour: TourConfig | null
 *   Currently active tour config
 * 
 * completedTourIds: string[]
 *   Array of completed tour IDs
 * 
 * showConfetti: boolean
 *   Whether to show confetti animation
 * 
 * startTour(tourId: string): void
 *   Start a specific tour
 * 
 * stopTour(): void
 *   Stop current tour
 * 
 * completeTour(tourId: string): void
 *   Mark tour as completed and show confetti
 * 
 * isTourCompleted(tourId: string): boolean
 *   Check if a tour is completed
 * 
 * getAvailableTours(): TourConfig[]
 *   Get tours applicable to current user
 * 
 * getUncompletedTours(): TourConfig[]
 *   Get uncompleted tours for current user
 * 
 * ========================================================================
 * STYLING & CUSTOMIZATION
 * ========================================================================
 * 
 * Tours use AccrediTex brand tokens:
 * - bg-brand-primary / dark:bg-dark-brand-primary
 * - text-brand-text-primary / dark:text-dark-brand-text-primary
 * - Brand-consistent styling in TailwindCSS v4
 * 
 * To customize:
 * 1. Confetti colors: Edit COLORS array in Confetti.tsx
 * 2. Tooltip styling: Edit className in GuidedTour.tsx
 * 3. Menu styling: Edit className in TourMenu.tsx
 * 4. Button styling: Edit className in TourLauncher.tsx
 * 
 * ========================================================================
 * NEXT STEPS
 * ========================================================================
 * 
 * 1. ✅ Tour Registry created with 8 pre-configured tours
 * 2. ✅ Tour Manager hook created for state management
 * 3. ✅ Confetti animation component created
 * 4. ✅ Tour Menu & Launcher UI components created
 * 5. ✅ GuidedTour enhanced with confetti & badges
 * 6. ✅ i18n translations added (EN & AR)
 * 
 * STILL TODO:
 * 7. Add TourController to App.tsx
 * 8. Add TourLauncher to DashboardHeader navigation
 * 9. Test all tours in browser
 * 10. Wire program-selected trigger on wizard completion
 * 11. Integrate tour completion with gamification system (Step 4 feature)
 * 12. Add tour analytics tracking
 * 
 * ========================================================================
 */

// This file is for documentation only. No code export needed.
export const TOUR_SYSTEM_GUIDE = 'See comments above for full integration guide.';
