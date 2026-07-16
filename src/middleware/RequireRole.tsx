// ============================================================
// PULSEGRID — RequireRole MIDDLEWARE
// ============================================================
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { ROUTES } from '../constants/routes';
import type { RoleId } from '../types';

interface RequireRoleProps {
  roles: RoleId[];
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Allows access only if the current user has one of the specified roles.
 */
const RequireRole: React.FC<RequireRoleProps> = ({
  roles,
  children,
  redirectTo = ROUTES.UNAUTHORIZED,
}) => {
  const { hasRole } = usePermissions();

  if (!hasRole(...roles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RequireRole;
