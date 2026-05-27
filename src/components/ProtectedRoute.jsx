import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import AppLoader from './AppLoader';

const ProtectedRoute = ({ children }) => {
  const { initialize, authReady, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!authReady) {
    return <AppLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
