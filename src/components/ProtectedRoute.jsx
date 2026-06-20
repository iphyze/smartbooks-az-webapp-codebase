import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import { defaultRouteForRole } from '../utils/permissions';
import AppLoader from './AppLoader';

const ProtectedRoute = ({ children, passwordChangeOnly = false }) => {
  const { initialize, authReady, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!authReady) {
    return <AppLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const mustChangePassword = Boolean(user?.must_change_password);

  if (mustChangePassword && !passwordChangeOnly) {
    return <Navigate to="/change-password" replace />;
  }

  if (!mustChangePassword && passwordChangeOnly) {
    return <Navigate to={defaultRouteForRole(user)} replace />;
  }

  return children;
};

export default ProtectedRoute;
