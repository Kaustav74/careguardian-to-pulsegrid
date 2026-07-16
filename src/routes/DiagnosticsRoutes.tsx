import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import RequireAuth from '../middleware/RequireAuth';
import RequireRole from '../middleware/RequireRole';
import DashboardLayout from '../layouts/DashboardLayout';
import { ROUTES } from '../constants/routes';
import PlaceholderModule from '../components/ui/PlaceholderModule';

export const DiagnosticsRoutes = (
  <Route
    path="/diagnostics"
    element={
      <RequireAuth>
        <RequireRole roles={['diagnosticStaff']}>
          <DashboardLayout />
        </RequireRole>
      </RequireAuth>
    }
  >
    <Route index element={<Navigate to={ROUTES.DIAGNOSTICS_DASHBOARD} replace />} />
    
    <Route path="dashboard" element={<PlaceholderModule 
      title="Diagnostics Center" 
      description="Daily summary of incoming test requisitions." 
      icon="" 
      features={['Daily Test Volume', 'Pending Reports', 'Urgent Test Alerts']} 
    />} />
    
    <Route path="orders" element={<PlaceholderModule 
      title="Test Requisitions" 
      description="Manage incoming lab test requests from doctors." 
      icon="" 
      features={['Sample Tracking', 'Patient Queue', 'Barcode Generation']} 
    />} />
    
    <Route path="results" element={<PlaceholderModule 
      title="Result Uploads" 
      description="Upload and dispatch test results to EHRs." 
      icon="" 
      features={['Secure PDF Upload', 'Critical Value Escalation', 'Direct Doctor Sync']} 
    />} />
  </Route>
);
