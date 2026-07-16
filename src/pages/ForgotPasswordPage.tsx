// ============================================================
// PULSEGRID — FORGOT PASSWORD PAGE
// ============================================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { ROUTES } from '../constants/routes';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [formError, setFormError] = useState('');
  const { isLoading } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!email) { setFormError('Please enter your email.'); return; }
    try {
      // Mock API call for local environment
      await new Promise(r => setTimeout(r, 1000));
      setSent(true);
    } catch (err: unknown) {
      setFormError('Failed to send reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-in-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-health-blue to-calm-green flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">CG</div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-gray-400 text-sm mt-1">We'll email you a reset link</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {sent ? (
            <>
              <Alert variant="success" title="Email sent!" message={`A password reset link has been sent to ${email}.`} />
              <Link to={ROUTES.LOGIN}>
                <Button variant="secondary" fullWidth>Back to Login</Button>
              </Link>
            </>
          ) : (
            <>
              {formError && <Alert variant="error" message={formError} dismissible />}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@hospital.com"
                    className="input"
                  />
                </div>
                <Button type="submit" fullWidth isLoading={isLoading}>
                  Send Reset Link
                </Button>
              </form>
              <div className="text-center">
                <Link to={ROUTES.LOGIN} className="text-sm text-gray-400 hover:text-white transition-colors">
                  ← Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
