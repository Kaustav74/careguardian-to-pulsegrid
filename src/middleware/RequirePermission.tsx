// ============================================================
// PULSEGRID — RequirePermission MIDDLEWARE
// ============================================================
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { ROUTES } from '../constants/routes';
import type { PermissionKey } from '../types';

interface RequirePermissionProps {
  permission: PermissionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Renders children only if the current user has the required permission.
 * Optionally renders a fallback element or redirects to /unauthorized.
 */
const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  children,
  fallback,
  redirectTo = ROUTES.UNAUTHORIZED,
}) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    if (fallback !== undefined) return <>{fallback}</>;
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RequirePermission;
