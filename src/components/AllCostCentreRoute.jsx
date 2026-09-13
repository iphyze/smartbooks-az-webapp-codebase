import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import AppLoader from "./AppLoader";
import { defaultRouteForRole } from "../utils/permissions";

const AllCostCentreRoute = ({ children }) => {
  const { user, authReady } = useAuthStore();

  if (!authReady) return <AppLoader />;

  const accessMode = String(user?.cost_center_access_mode || "all").toLowerCase();
  if (accessMode === "restricted") {
    return <Navigate to={defaultRouteForRole(user)} replace />;
  }

  return children;
};

export default AllCostCentreRoute;
