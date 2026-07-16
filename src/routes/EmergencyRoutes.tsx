import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import RequireAuth from '../middleware/RequireAuth';
import RequireRole from '../middleware/RequireRole';
import DashboardLayout from '../layouts/DashboardLayout';
import { ROUTES } from '../constants/routes';
import PlaceholderModule from '../components/ui/PlaceholderModule';

const AmbulanceDashboard = lazy(() => import('../dashboards/AmbulanceDashboard'));
const EmergencyOperatorDashboard = lazy(() => import('../dashboards/EmergencyOperatorDashboard'));
const AmbulanceRequests  = lazy(() => import('../modules/emergency/AmbulanceRequests'));
const AmbulanceRouteNav  = lazy(() => import('../modules/emergency/AmbulanceRouteNav'));
const EmergencySOS       = lazy(() => import('../modules/emergency/EmergencySOS'));

export const EmergencyRoutes = (
  <Route
    path="/ambulance"
    element={
      <RequireAuth>
        <RequireRole roles={['ambulanceDriver', 'emergencyOperator']}>
          <DashboardLayout />
        </RequireRole>
      </RequireAuth>
    }
  >
    <Route index element={<Navigate to={ROUTES.AMBULANCE_DASHBOARD} replace />} />
    <Route path="dashboard" element={
      <RequireRole roles={['ambulanceDriver']}>
        <AmbulanceDashboard />
      </RequireRole>
    } />
    <Route path="operator" element={
      <RequireRole roles={['emergencyOperator']}>
        <EmergencyOperatorDashboard />
      </RequireRole>
    } />
    <Route path="requests"  element={<AmbulanceRequests />} />
    <Route path="map"       element={<AmbulanceRouteNav />} />
    <Route path="status"    element={<PlaceholderModule
      title="Fleet Status"
      description="Manage your availability and vehicle status."
      icon=""
      features={['Duty Status Toggle', 'Vehicle Condition Logging', 'End of Shift Reports']}
    />} />
  </Route>
);
