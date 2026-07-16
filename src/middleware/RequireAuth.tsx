// ============================================================
// PULSEGRID — RequireAuth MIDDLEWARE
// ============================================================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '../constants/routes';

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Redirects unauthenticated users to /login.
 * Redirects pending-approval users to /pending-approval.
 * Shows nothing while auth state is loading.
 */
const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  redirectTo = ROUTES.LOGIN,
}) => {
  const { isAuthenticated, isLoading, userProfile } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-health-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading PulseGrid…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (userProfile?.status === 'PENDING') {
    return <Navigate to={ROUTES.PENDING_APPROVAL} replace />;
  }

  if (userProfile?.status === 'REJECTED') {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
