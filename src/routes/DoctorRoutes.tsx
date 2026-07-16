import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import RequireAuth from '../middleware/RequireAuth';
import RequireRole from '../middleware/RequireRole';
import DashboardLayout from '../layouts/DashboardLayout';
import { ROUTES } from '../constants/routes';
import PlaceholderModule from '../components/ui/PlaceholderModule';

const DoctorDashboard         = lazy(() => import('../dashboards/DoctorDashboard'));
const PatientRecords          = lazy(() => import('../modules/medical/PatientRecords'));
const TelemedicineWorkspace   = lazy(() => import('../modules/medical/TelemedicineWorkspace'));
const EPrescriptionGenerator  = lazy(() => import('../modules/medical/EPrescriptionGenerator'));
const AppointmentScheduler    = lazy(() => import('../modules/medical/AppointmentScheduler'));
const EmergencyOperations     = lazy(() => import('../modules/emergency/EmergencyOperations'));
const DiagnosticIntegration   = lazy(() => import('../modules/medical/DiagnosticIntegration'));

export const DoctorRoutes = (
  <Route
    path="/doctor"
    element={
      <RequireAuth>
        <RequireRole roles={['doctor', 'nurse', 'ruralVolunteer']}>
          <DashboardLayout />
        </RequireRole>
      </RequireAuth>
    }
  >
    <Route index element={<Navigate to={ROUTES.DOCTOR_DASHBOARD} replace />} />
    <Route path="dashboard"     element={<DoctorDashboard />} />
    <Route path="patients"      element={<PatientRecords />} />
    <Route path="telemedicine/:id" element={<TelemedicineWorkspace />} />
    <Route path="telemedicine"  element={<TelemedicineWorkspace />} />
    <Route path="prescriptions" element={<EPrescriptionGenerator />} />
    <Route path="schedule"      element={<AppointmentScheduler />} />
    <Route path="diagnostics"   element={<DiagnosticIntegration />} />
    <Route path="emergency" element={<EmergencyOperations />} />
  </Route>
);
