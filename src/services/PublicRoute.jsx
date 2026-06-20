import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import { defaultRouteForRole } from '../utils/permissions';
import AppLoader from '../components/AppLoader';

const PublicRoute = ({ children }) => {
  const { initialize, authReady, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!authReady) {
    return <AppLoader />;
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={user?.must_change_password ? '/change-password' : defaultRouteForRole(user)}
        replace
      />
    );
  }

  return children;
};

export default PublicRoute;
