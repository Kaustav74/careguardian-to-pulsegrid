// ============================================================
// PULSEGRID — UNAUTHORIZED PAGE
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { ROLES } from '../permissions/roles';
import type { RoleId } from '../types';

const UnauthorizedPage: React.FC = () => {
  const { userProfile } = useAuthStore();
  const navigate = useNavigate();
  const roleId = userProfile?.roleId as RoleId | undefined;
  const dashboardPath = roleId ? ROLES[roleId]?.dashboardPath : '/';

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md text-center animate-slide-in-up">
        <div className="text-7xl mb-6"></div>
        <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-gray-400 mb-8">
          You don't have permission to view this page. If you believe this is an error, contact your administrator.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate(-1)}>← Go Back</Button>
          <Button variant="primary" onClick={() => navigate(dashboardPath ?? '/')}>Dashboard</Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
