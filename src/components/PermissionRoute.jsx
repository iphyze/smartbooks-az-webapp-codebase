import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import { defaultRouteForRole, hasAllPermissions, hasAnyPermission, hasPermission } from "../utils/permissions";
import AppLoader from "./AppLoader";

const PermissionRoute = ({ permission, anyOf = [], allOf = [], children }) => {
  const { user, authReady } = useAuthStore();

  if (!authReady) return <AppLoader />;

  let allowed = true;
  if (permission) allowed = hasPermission(user, permission);
  if (allowed && anyOf.length > 0) allowed = hasAnyPermission(user, anyOf);
  if (allowed && allOf.length > 0) allowed = hasAllPermissions(user, allOf);

  if (!allowed) {
    return <Navigate to={defaultRouteForRole(user)} replace />;
  }

  return children;
};

export default PermissionRoute;
