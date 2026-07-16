import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import RequireAuth from '../middleware/RequireAuth';
import RequireRole from '../middleware/RequireRole';
import DashboardLayout from '../layouts/DashboardLayout';
import { ROUTES } from '../constants/routes';
import PlaceholderModule from '../components/ui/PlaceholderModule';

const PatientDashboard        = lazy(() => import('../dashboards/PatientDashboard'));
const PatientRecords          = lazy(() => import('../modules/medical/PatientRecords'));
const TelemedicineWorkspace   = lazy(() => import('../modules/medical/TelemedicineWorkspace'));
const AppointmentScheduler    = lazy(() => import('../modules/medical/AppointmentScheduler'));
const EmergencySOS            = lazy(() => import('../modules/emergency/EmergencySOS'));
const ProfilePage             = lazy(() => import('../pages/ProfilePage'));
const NutritionHub            = lazy(() => import('../modules/patient/NutritionHub'));

export const PatientRoutes = (
  <Route
    path="/patient"
    element={
      <RequireAuth>
        <RequireRole roles={['patient', 'familyMember']}>
          <DashboardLayout />
        </RequireRole>
      </RequireAuth>
    }
  >
    <Route index element={<Navigate to={ROUTES.PATIENT_DASHBOARD} replace />} />
    <Route path="dashboard"    element={<PatientDashboard />} />
    <Route path="records"      element={<PatientRecords />} />
    <Route path="telemedicine/:id" element={<TelemedicineWorkspace />} />
    <Route path="telemedicine" element={<TelemedicineWorkspace />} />
    <Route path="appointments" element={<AppointmentScheduler />} />
    <Route path="emergency"    element={<EmergencySOS />} />
    <Route path="profile"      element={<ProfilePage />} />
    <Route path="nutrition"    element={<NutritionHub />} />
    <Route path="billing"      element={<PlaceholderModule
      title="Payments & Subscriptions"
      description="Manage healthcare plans and pay invoices."
      icon=""
      features={['Invoice History', 'PulseGrid Premium', 'Insurance Claim Sync']}
    />} />
  </Route>
);
