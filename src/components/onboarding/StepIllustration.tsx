import React from 'react';

interface StepIllustrationProps {
  step: number;
  className?: string;
}

/**
 * Step Illustration Component
 * Displays branded SVG illustrations for each onboarding step
 */
export const StepIllustration: React.FC<StepIllustrationProps> = ({ step, className = '' }) => {
  const illustrations = {
    0: ( // Welcome
      <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="#0ea5e9" opacity="0.1" />
        <circle cx="100" cy="100" r="60" fill="#06b6d4" opacity="0.2" />
        <path
          d="M70 110 Q100 80 130 110"
          stroke="#0ea5e9"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="85" cy="90" r="8" fill="#0ea5e9" />
        <circle cx="115" cy="90" r="8" fill="#0ea5e9" />
        <path
          d="M60 60 L80 40 L80 70 Z"
          fill="#14b8a6"
        />
        <path
          d="M140 60 L120 40 L120 70 Z"
          fill="#14b8a6"
        />
      </svg>
    ),
    1: ( // Dashboard
      <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="40" width="140" height="120" rx="8" fill="#f1f5f9" />
        <rect x="40" y="50" width="50" height="30" rx="4" fill="#0ea5e9" opacity="0.3" />
        <rect x="100" y="50" width="60" height="30" rx="4" fill="#06b6d4" opacity="0.3" />
        <rect x="40" y="90" width="120" height="60" rx="4" fill="#14b8a6" opacity="0.2" />
        <path d="M50 130 L70 120 L90 125 L110 115 L130 120 L150 110" stroke="#0ea5e9" strokeWidth="3" fill="none" />
      </svg>
    ),
    2: ( // Projects
      <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect x="50" y="40" width="100" height="120" rx="6" fill="#f1f5f9" />
        <rect x="60" y="50" width="80" height="10" rx="2" fill="#0ea5e9" opacity="0.5" />
        <circle cx="70" cy="80" r="6" fill="#06b6d4" />
        <rect x="80" y="76" width="60" height="8" rx="2" fill="#e2e8f0" />
        <circle cx="70" cy="105" r="6" fill="#14b8a6" />
        <rect x="80" y="101" width="50" height="8" rx="2" fill="#e2e8f0" />
        <circle cx="70" cy="130" r="6" fill="#0ea5e9" />
        <rect x="80" y="126" width="55" height="8" rx="2" fill="#e2e8f0" />
      </svg>
    ),
    3: ( // Accreditation
      <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="70" fill="#0ea5e9" opacity="0.1" />
        <path
          d="M100 50 L120 90 L165 95 L130 125 L140 170 L100 145 L60 170 L70 125 L35 95 L80 90 Z"
          fill="#0ea5e9"
        />
        <path
          d="M85 100 L95 110 L115 85"
          stroke="#fff"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    4: ( // Users
      <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="80" cy="80" r="25" fill="#0ea5e9" opacity="0.3" />
        <path d="M55 130 Q80 110 105 130" fill="#0ea5e9" />
        <circle cx="120" cy="90" r="20" fill="#06b6d4" opacity="0.3" />
        <path d="M100 125 Q120 110 140 125" fill="#06b6d4" />
        <circle cx="140" cy="70" r="18" fill="#14b8a6" opacity="0.3" />
        <path d="M125 105 Q140 95 155 105" fill="#14b8a6" />
      </svg>
    ),
    5: ( // AI
      <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="60" fill="#0ea5e9" opacity="0.1" />
        <circle cx="100" cy="100" r="8" fill="#0ea5e9" />
        <circle cx="70" cy="80" r="8" fill="#06b6d4" />
        <circle cx="130" cy="80" r="8" fill="#14b8a6" />
        <circle cx="70" cy="120" r="8" fill="#14b8a6" />
        <circle cx="130" cy="120" r="8" fill="#06b6d4" />
        <line x1="100" y1="100" x2="70" y2="80" stroke="#0ea5e9" strokeWidth="2" />
        <line x1="100" y1="100" x2="130" y2="80" stroke="#0ea5e9" strokeWidth="2" />
        <line x1="100" y1="100" x2="70" y2="120" stroke="#0ea5e9" strokeWidth="2" />
        <line x1="100" y1="100" x2="130" y2="120" stroke="#0ea5e9" strokeWidth="2" />
      </svg>
    ),
  };

  return illustrations[step as keyof typeof illustrations] || illustrations[0];
};

export default StepIllustration;
