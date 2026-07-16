import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import RequireAuth from '../middleware/RequireAuth';
import RequireRole from '../middleware/RequireRole';
import DashboardLayout from '../layouts/DashboardLayout';
import { ROUTES } from '../constants/routes';

const FamilyMemberDashboard = lazy(() => import('../dashboards/FamilyMemberDashboard'));

export const FamilyMemberRoutes = (
  <Route
    path="/family"
    element={
      <RequireAuth>
        <RequireRole roles={['familyMember']}>
          <DashboardLayout />
        </RequireRole>
      </RequireAuth>
    }
  >
    <Route index element={<Navigate to={ROUTES.FAMILY_MEMBER_DASHBOARD} replace />} />
    <Route path="dashboard" element={<FamilyMemberDashboard />} />
  </Route>
);
