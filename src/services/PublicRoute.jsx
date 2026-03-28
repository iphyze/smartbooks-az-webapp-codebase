import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

// This component redirects to dashboard if user is already logged in
const PublicRoute = ({ children }) => {
  const { token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  return children;
};

export default PublicRoute;
