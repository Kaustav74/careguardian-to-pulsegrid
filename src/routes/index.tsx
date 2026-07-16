// ============================================================
// PULSEGRID — MODULAR ROUTING INDEX
// ============================================================
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

// ---- Public pages -------------------------
import LandingPage        from '../pages/LandingPage';
import LoginPage          from '../pages/LoginPage';
import RegisterPage       from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import UnauthorizedPage   from '../pages/UnauthorizedPage';
import PendingApprovalPage from '../pages/PendingApprovalPage';
import NotFoundPage       from '../pages/NotFoundPage';
import ProfilePage        from '../pages/ProfilePage';
import RequireAuth        from '../middleware/RequireAuth';
import DashboardLayout      from '../layouts/DashboardLayout';

// ---- Modular Route Definitions ------------
import { AdminRoutes }       from './AdminRoutes';
import { HospitalRoutes }    from './HospitalRoutes';
import { DoctorRoutes }      from './DoctorRoutes';
import { PatientRoutes }     from './PatientRoutes';
import { EmergencyRoutes }   from './EmergencyRoutes';
import { PharmacyRoutes }    from './PharmacyRoutes';
import { DiagnosticsRoutes } from './DiagnosticsRoutes';
import { FamilyMemberRoutes } from './FamilyMemberRoutes';
import { NurseRoutes }        from './NurseRoutes';

// ---- Loading fallback --------------------------------------
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-health-blue border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 font-medium">Loading Module...</p>
    </div>
  </div>
);

// ---- Router ------------------------------------------------
const AppRouter: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ===== PUBLIC ===== */}
      <Route path={ROUTES.HOME}            element={<LandingPage />} />
      <Route path={ROUTES.LOGIN}           element={<LoginPage />} />
      <Route path={ROUTES.REGISTER}        element={<RegisterPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.UNAUTHORIZED}    element={<UnauthorizedPage />} />
      <Route path={ROUTES.PENDING_APPROVAL}element={<PendingApprovalPage />} />
      
      {/* Protected Global Routes */}
      <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* ===== ENTERPRISE MODULES ===== */}
      {AdminRoutes}
      {HospitalRoutes}
      {DoctorRoutes}
      {PatientRoutes}
      {EmergencyRoutes}
      {PharmacyRoutes}
      {DiagnosticsRoutes}
      {FamilyMemberRoutes}
      {NurseRoutes}

      {/* ===== CATCH-ALL ===== */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default AppRouter;
