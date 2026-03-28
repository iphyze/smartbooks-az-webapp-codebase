import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import useToastStore from "../stores/useToastStore";
import { isTokenExpired } from "../utils/jwtUtils";


const ProtectedRoute = ({ children }) => {
  const { token, logout } = useAuthStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check token expiration
    if (token && isTokenExpired(token)) {
      // Token is expired, log the user out
      logout();
      showToast("Your session has expired. Please log in again.", "info");
      navigate("/login");
    }
  }, [token, logout, showToast, navigate]);

  // If no token exists, redirect to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // If token exists and is not expired, render the protected content
  return children;
};

export default ProtectedRoute;