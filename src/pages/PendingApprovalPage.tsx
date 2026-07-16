// ============================================================
// PULSEGRID — PENDING APPROVAL PAGE
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuthContext } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';

const PendingApprovalPage: React.FC = () => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md text-center animate-slide-in-up">
        <div className="w-20 h-20 rounded-3xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-4xl mx-auto mb-6">
          ⏳
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Pending Approval</h1>
        <p className="text-gray-400 mb-2 leading-relaxed">
          Your account has been registered successfully. An administrator will review and approve your access shortly.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          You'll receive a notification once your account is activated.
        </p>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-sm text-yellow-400 font-medium">Awaiting admin review</span>
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout} fullWidth>
          Sign Out & Return Later
        </Button>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
