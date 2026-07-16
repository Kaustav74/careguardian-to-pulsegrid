import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import RequireAuth from '../middleware/RequireAuth';
import RequireRole from '../middleware/RequireRole';
import DashboardLayout from '../layouts/DashboardLayout';
import { ROUTES } from '../constants/routes';
import PlaceholderModule from '../components/ui/PlaceholderModule';

const SuperAdminDashboard = lazy(() => import('../dashboards/SuperAdminDashboard'));
const UserManagement      = lazy(() => import('../modules/admin/UserManagement'));
const HospitalManagement  = lazy(() => import('../modules/admin/HospitalManagement'));
const RoleManagement      = lazy(() => import('../modules/admin/RoleManagement'));
const AuditLogManagement  = lazy(() => import('../modules/admin/AuditLogManagement'));
const NationalAnalytics   = lazy(() => import('../modules/admin/NationalAnalytics'));
const DisasterCommandCenter = lazy(() => import('../modules/admin/DisasterCommandCenter'));
const SystemSettings       = lazy(() => import('../modules/admin/SystemSettings'));

export const AdminRoutes = (
  <Route
    path="/admin"
    element={
      <RequireAuth>
        <RequireRole roles={['superAdmin', 'networkAdmin']}>
          <DashboardLayout />
        </RequireRole>
      </RequireAuth>
    }
  >
    <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
    <Route path="dashboard"    element={<SuperAdminDashboard />} />
    <Route path="users"        element={<UserManagement />} />

    <Route path="hospitals" element={<HospitalManagement />} />
    <Route path="roles" element={<RoleManagement />} />
    <Route path="audit-logs" element={<AuditLogManagement />} />
    <Route path="analytics" element={<NationalAnalytics />} />
    <Route path="notifications" element={<DisasterCommandCenter />} />
    <Route path="settings" element={<SystemSettings />} />
  </Route>
);
