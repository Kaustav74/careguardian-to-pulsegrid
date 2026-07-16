// ============================================================
// PULSEGRID — LOGIN PAGE
// ============================================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { ROLES } from '../permissions/roles';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { ROUTES } from '../constants/routes';

const LoginPage: React.FC = () => {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [formError, setFormError] = useState('');
  const { login, isLoading, error } = useAuthContext();
  const navigate = useNavigate();

  const getDashboardPath = (roleId: string) =>
    ROLES[roleId as keyof typeof ROLES]?.dashboardPath ?? ROUTES.PATIENT_DASHBOARD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) { setFormError('Please fill in all fields.'); return; }
    try {
      const { profile } = await login(email, password);
      if (profile.roleId) {
        navigate(getDashboardPath(profile.roleId));
      } else {
        navigate(ROUTES.HOME);
      }
    } catch {
      // error shown from store
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-in-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-health-blue to-calm-green flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            CG
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to PulseGrid</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {(error || formError) && (
            <Alert variant="error" message={formError || error || 'Authentication failed.'} dismissible />
          )}


          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.com"
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-medium text-gray-400">Password</label>
                <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-health-blue hover:text-blue-400">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" fullWidth isLoading={isLoading}>
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to={ROUTES.REGISTER} className="text-health-blue hover:text-blue-400 font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
