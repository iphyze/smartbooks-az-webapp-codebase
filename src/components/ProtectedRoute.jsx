import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import useToastStore from "../stores/useToastStore";
import { isTokenExpired } from "../utils/jwtUtils";

const EXPIRY_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

/**
 * ProtectedRoute — only accessible when authenticated with a valid token.
 * Handles both the initial check and ongoing expiry detection while the tab is open.
 */
const ProtectedRoute = ({ children }) => {
  const { token, logout } = useAuthStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  useEffect(() => {
    const checkExpiry = () => {
      if (token && isTokenExpired(token)) {
        logout();
        showToast("Your session has expired. Please log in again.", "info");
        navigate("/login", { replace: true });
      }
    };

    // Run immediately on mount and on token change
    checkExpiry();

    // Then keep checking periodically while the tab is open
    intervalRef.current = setInterval(checkExpiry, EXPIRY_CHECK_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [token, logout, showToast, navigate]);

  // No token at all — send to login immediately
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token exists but is already expired — render nothing while the useEffect redirects
  if (isTokenExpired(token)) {
    return null;
  }

  return children;
};

export default ProtectedRoute;