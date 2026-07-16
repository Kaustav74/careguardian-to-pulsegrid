// ============================================================
// PULSEGRID — 404 NOT FOUND PAGE
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { ROUTES } from '../constants/routes';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md text-center animate-slide-in-up">
        <h1 className="text-8xl font-black bg-gradient-to-r from-health-blue to-calm-green bg-clip-text text-transparent mb-4">
          404
        </h1>
        <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate(-1)}>← Go Back</Button>
          <Button variant="primary" onClick={() => navigate(ROUTES.HOME)}>Home</Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
