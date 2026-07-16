import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import RequireAuth from '../middleware/RequireAuth';
import RequireRole from '../middleware/RequireRole';
import DashboardLayout from '../layouts/DashboardLayout';
import { ROUTES } from '../constants/routes';
import PlaceholderModule from '../components/ui/PlaceholderModule';

const HospitalAdminDashboard = lazy(() => import('../dashboards/HospitalAdminDashboard'));
const PatientRecords         = lazy(() => import('../modules/medical/PatientRecords'));
const AppointmentScheduler   = lazy(() => import('../modules/medical/AppointmentScheduler'));
const StaffManagement       = lazy(() => import('../modules/hospital/StaffManagement'));
const HospitalAnalytics     = lazy(() => import('../modules/hospital/HospitalAnalytics'));
const HospitalSettings      = lazy(() => import('../modules/hospital/HospitalSettings'));
const EmergencyOperations     = lazy(() => import('../modules/emergency/EmergencyOperations'));

export const HospitalRoutes = (
  <Route
    path="/hospital"
    element={
      <RequireAuth>
        <RequireRole roles={['hospitalAdmin', 'receptionist', 'nurse']}>
          <DashboardLayout />
        </RequireRole>
      </RequireAuth>
    }
  >
    <Route index element={<Navigate to={ROUTES.HOSPITAL_DASHBOARD} replace />} />
    <Route path="dashboard"  element={<HospitalAdminDashboard />} />
    <Route path="patients"   element={<PatientRecords />} />
    <Route path="schedule"   element={<AppointmentScheduler />} />
    <Route path="staff"      element={<StaffManagement />} />
    <Route path="emergency" element={<EmergencyOperations />} />
    <Route path="analytics"  element={<HospitalAnalytics />} />
    <Route path="settings"   element={<HospitalSettings />} />
  </Route>
);
