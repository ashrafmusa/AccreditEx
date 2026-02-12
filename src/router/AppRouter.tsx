/**
 * Router Configuration and Setup
 *
 * Provides React Router integration while maintaining backward compatibility
 * with the existing NavigationState system
 */

import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoadingScreen from "@/components/common/LoadingScreen";

interface AppRouterProps {
  children: React.ReactNode;
}

/**
 * AppRouter Component
 *
 * Wraps the application with BrowserRouter
 * All routes are handled by the MainRouter component via catch-all
 * This allows the existing NavigationState system to continue working
 */
export const AppRouter: React.FC<AppRouterProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Catch-all route - let MainRouter handle all routing */}
          <Route path="/*" element={children} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

/**
 * Protected Route Wrapper
 * Can be used for future route-level protection
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  isAllowed: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  isAllowed,
  redirectTo = "/dashboard",
}) => {
  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
