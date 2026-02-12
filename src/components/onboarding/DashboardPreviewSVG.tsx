import React from 'react';

/**
 * Dashboard Preview SVG Component
 * Shows a simplified visual representation of the dashboard
 */
export const DashboardPreviewSVG: React.FC = () => {
  return (
    <svg
      viewBox="0 0 400 250"
      className="w-full max-w-md mx-auto my-6"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="400" height="250" fill="#f8fafc" className="dark:fill-slate-900" rx="8" />
      
      {/* Header Bar */}
      <rect x="10" y="10" width="380" height="30" fill="#0ea5e9" rx="4" />
      <circle cx="25" cy="25" r="8" fill="#fff" opacity="0.9" />
      <rect x="40" y="20" width="100" height="10" fill="#fff" opacity="0.7" rx="2" />
      
      {/* Stats Cards */}
      <rect x="10" y="50" width="115" height="80" fill="#0ea5e9" opacity="0.1" rx="6" />
      <rect x="20" y="60" width="40" height="8" fill="#0ea5e9" rx="2" />
      <rect x="20" y="75" width="80" height="20" fill="#0ea5e9" opacity="0.3" rx="2" />
      
      <rect x="140" y="50" width="115" height="80" fill="#06b6d4" opacity="0.1" rx="6" />
      <rect x="150" y="60" width="40" height="8" fill="#06b6d4" rx="2" />
      <rect x="150" y="75" width="80" height="20" fill="#06b6d4" opacity="0.3" rx="2" />
      
      <rect x="270" y="50" width="120" height="80" fill="#14b8a6" opacity="0.1" rx="6" />
      <rect x="280" y="60" width="40" height="8" fill="#14b8a6" rx="2" />
      <rect x="280" y="75" width="80" height="20" fill="#14b8a6" opacity="0.3" rx="2" />
      
      {/* Chart Area */}
      <rect x="10" y="145" width="250" height="95" fill="#fff" className="dark:fill-slate-800" rx="6" stroke="#e2e8f0" strokeWidth="1" />
      <text x="20" y="165" fill="#64748b" fontSize="10" fontWeight="600">
        Project Progress
      </text>
      
      {/* Simple Bar Chart */}
      <rect x="30" y="210" width="30" height="20" fill="#0ea5e9" rx="2" />
      <rect x="70" y="195" width="30" height="35" fill="#06b6d4" rx="2" />
      <rect x="110" y="185" width="30" height="45" fill="#14b8a6" rx="2" />
      <rect x="150" y="200" width="30" height="30" fill="#0ea5e9" rx="2" />
      <rect x="190" y="190" width="30" height="40" fill="#06b6d4" rx="2" />
      
      {/* Activity List */}
      <rect x="275" y="145" width="115" height="95" fill="#fff" className="dark:fill-slate-800" rx="6" stroke="#e2e8f0" strokeWidth="1" />
      <text x="285" y="165" fill="#64748b" fontSize="10" fontWeight="600">
        Recent Activity
      </text>
      <circle cx="285" cy="185" r="4" fill="#0ea5e9" />
      <rect x="295" y="182" width="80" height="6" fill="#e2e8f0" rx="1" />
      <circle cx="285" cy="200" r="4" fill="#06b6d4" />
      <rect x="295" y="197" width="70" height="6" fill="#e2e8f0" rx="1" />
      <circle cx="285" cy="215" r="4" fill="#14b8a6" />
      <rect x="295" y="212" width="60" height="6" fill="#e2e8f0" rx="1" />
    </svg>
  );
};

export default DashboardPreviewSVG;
