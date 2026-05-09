import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import { isTokenExpired } from "../utils/jwtUtils";

/**
 * PublicRoute — only accessible when NOT authenticated.
 * If the user has a valid, unexpired token they are redirected to the dashboard.
 */
const PublicRoute = ({ children }) => {
  const { token } = useAuthStore();

  // Treat an expired token the same as no token — let them stay on the public page
  if (token && !isTokenExpired(token)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;