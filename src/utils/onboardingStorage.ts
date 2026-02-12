/**
 * Onboarding localStorage Utilities
 * Manages onboarding progress, preferences, and completion status
 */

export interface OnboardingProgress {
  completedSteps: number[];
  currentStep: number;
  preferences: {
    language?: 'en' | 'ar';
    selectedStandard?: string;
  };
  isComplete: boolean;
  lastUpdated: string;
}

const ONBOARDING_KEY = 'accreditex_onboarding';

/**
 * Get onboarding progress from localStorage
 */
export const getOnboardingProgress = (): OnboardingProgress | null => {
  try {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as OnboardingProgress;
  } catch (error) {
    console.error('Error reading onboarding progress:', error);
    return null;
  }
};

/**
 * Save onboarding progress to localStorage
 */
export const saveOnboardingProgress = (progress: OnboardingProgress): void => {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving onboarding progress:', error);
  }
};

/**
 * Mark a step as completed
 */
export const markStepComplete = (stepIndex: number): void => {
  const progress = getOnboardingProgress() || {
    completedSteps: [],
    currentStep: 0,
    preferences: {},
    isComplete: false,
    lastUpdated: new Date().toISOString(),
  };

  if (!progress.completedSteps.includes(stepIndex)) {
    progress.completedSteps.push(stepIndex);
  }
  progress.lastUpdated = new Date().toISOString();
  saveOnboardingProgress(progress);
};

/**
 * Update current step
 */
export const updateCurrentStep = (stepIndex: number): void => {
  const progress = getOnboardingProgress() || {
    completedSteps: [],
    currentStep: 0,
    preferences: {},
    isComplete: false,
    lastUpdated: new Date().toISOString(),
  };

  progress.currentStep = stepIndex;
  progress.lastUpdated = new Date().toISOString();
  saveOnboardingProgress(progress);
};

/**
 * Save user preferences
 */
export const saveOnboardingPreferences = (
  preferences: Partial<OnboardingProgress['preferences']>
): void => {
  const progress = getOnboardingProgress() || {
    completedSteps: [],
    currentStep: 0,
    preferences: {},
    isComplete: false,
    lastUpdated: new Date().toISOString(),
  };

  progress.preferences = { ...progress.preferences, ...preferences };
  progress.lastUpdated = new Date().toISOString();
  saveOnboardingProgress(progress);
};

/**
 * Mark onboarding as complete
 */
export const completeOnboarding = (): void => {
  const progress = getOnboardingProgress() || {
    completedSteps: [],
    currentStep: 0,
    preferences: {},
    isComplete: false,
    lastUpdated: new Date().toISOString(),
  };

  progress.isComplete = true;
  progress.lastUpdated = new Date().toISOString();
  saveOnboardingProgress(progress);
};

/**
 * Reset onboarding progress (for restart)
 */
export const resetOnboarding = (): void => {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
};

/**
 * Check if onboarding is complete
 */
export const isOnboardingComplete = (): boolean => {
  const progress = getOnboardingProgress();
  return progress?.isComplete || false;
};

/**
 * Check if a step is completed
 */
export const isStepComplete = (stepIndex: number): boolean => {
  const progress = getOnboardingProgress();
  return progress?.completedSteps.includes(stepIndex) || false;
};
