import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import RequireAuth from '../middleware/RequireAuth';
import RequireRole from '../middleware/RequireRole';
import DashboardLayout from '../layouts/DashboardLayout';
import { ROUTES } from '../constants/routes';

const NurseDashboard = lazy(() => import('../dashboards/NurseDashboard'));

export const NurseRoutes = (
  <Route
    path="/nurse"
    element={
      <RequireAuth>
        <RequireRole roles={['nurse']}>
          <DashboardLayout />
        </RequireRole>
      </RequireAuth>
    }
  >
    <Route index element={<Navigate to={ROUTES.NURSE_DASHBOARD} replace />} />
    <Route path="dashboard" element={<NurseDashboard />} />
  </Route>
);
