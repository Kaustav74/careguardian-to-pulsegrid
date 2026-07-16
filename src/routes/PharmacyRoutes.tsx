import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import RequireAuth from '../middleware/RequireAuth';
import RequireRole from '../middleware/RequireRole';
import DashboardLayout from '../layouts/DashboardLayout';
import { ROUTES } from '../constants/routes';

const PharmacistDashboard = lazy(() => import('../dashboards/PharmacistDashboard'));
const PharmacyInventoryPage = lazy(() => import('../modules/pharmacy/PharmacyInventoryPage'));
const PharmacyPrescriptionsPage = lazy(() => import('../modules/pharmacy/PharmacyPrescriptionsPage'));

export const PharmacyRoutes = (
  <Route
    path="/pharmacy"
    element={
      <RequireAuth>
        <RequireRole roles={['pharmacist']}>
          <DashboardLayout />
        </RequireRole>
      </RequireAuth>
    }
  >
    <Route index element={<Navigate to={ROUTES.PHARMACY_DASHBOARD} replace />} />
    <Route path="dashboard"     element={<PharmacistDashboard />} />
    <Route path="prescriptions" element={<PharmacyPrescriptionsPage />} />
    <Route path="inventory"     element={<PharmacyInventoryPage />} />
  </Route>
);


