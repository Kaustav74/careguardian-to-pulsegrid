// ============================================================
// PULSEGRID — usePermissions HOOK
// ============================================================
import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { roleHasPermission, getEffectivePermissions } from '../permissions/roles';
import type { PermissionKey, RoleId } from '../types';

export function usePermissions() {
  const { userProfile } = useAuthStore();
  const roleId = userProfile?.roleId as RoleId | undefined;

  const effectivePermissions = useMemo(
    () => (roleId ? getEffectivePermissions(roleId) : []),
    [roleId]
  );

  /**
   * Check if the current user has a specific permission.
   */
  const hasPermission = (permission: PermissionKey): boolean => {
    if (!roleId) return false;
    return roleHasPermission(roleId, permission);
  };

  /**
   * Check if the current user has ALL of the given permissions.
   */
  const hasAllPermissions = (...permissions: PermissionKey[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  };

  /**
   * Check if the current user has ANY of the given permissions.
   */
  const hasAnyPermission = (...permissions: PermissionKey[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  };

  /**
   * Check if the current user has one of the specified roles.
   */
  const hasRole = (...roles: RoleId[]): boolean => {
    return !!roleId && roles.includes(roleId);
  };

  return {
    roleId,
    effectivePermissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    isApproved: userProfile?.status === 'APPROVED',
    isActive:   userProfile?.status !== 'REJECTED' && userProfile?.status !== 'PENDING',
  };
}
