// ============================================================
// PULSEGRID — UI: ROLE TAG COMPONENT
// ============================================================
import React from 'react';
import { ROLES } from '../../permissions/roles';
import type { RoleId } from '../../types';

interface RoleTagProps {
  roleId: RoleId;
  showIcon?: boolean;
}

const RoleTag: React.FC<RoleTagProps> = ({ roleId, showIcon = false }) => {
  const role = ROLES[roleId];
  if (!role) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border"
      style={{
        color: role.color,
        backgroundColor: role.color + '20',
        borderColor: role.color + '40',
      }}
    >
      {showIcon && <span className="text-base leading-none">●</span>}
      {role.label}
    </span>
  );
};

export default RoleTag;
