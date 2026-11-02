import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user) {
    const isAuthorized =
      roles.includes(user.role) ||
      (roles.includes('TRAVELER') && user.role === 'USER') ||
      (roles.includes('USER') && user.role === 'TRAVELER');

    if (!isAuthorized) {
      const dashboardPath =
        user.role === 'ADMIN'
          ? '/admin/dashboard'
          : user.role === 'EXPERT'
          ? '/expert/dashboard'
          : '/traveler/dashboard';
      return <Navigate to={dashboardPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
