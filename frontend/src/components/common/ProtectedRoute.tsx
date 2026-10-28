import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: 'doctor' | 'patient';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Verifying clinical credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (requiredRole === 'patient') {
      return <Navigate to="/patient/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/doctor/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // If a patient attempts to access doctor route, take them to patient portal
    if (role === 'patient') {
      return <Navigate to="/patient/portal" replace />;
    }
    // If a doctor attempts to access patient portal, take them to doctor dashboard
    if (role === 'doctor') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
