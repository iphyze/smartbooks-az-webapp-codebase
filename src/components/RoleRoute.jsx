import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import { defaultRouteForRole } from "../utils/permissions";
import AppLoader from "./AppLoader";

const RoleRoute = ({ allowedRoles, children }) => {
  const { user, authReady } = useAuthStore();

  if (!authReady) return <AppLoader />;

  if (!allowedRoles.includes(user?.integrity)) {
    return <Navigate to={defaultRouteForRole(user)} replace />;
  }

  return children;
};

export default RoleRoute;
