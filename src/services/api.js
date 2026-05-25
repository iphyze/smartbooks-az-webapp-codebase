import axios from 'axios';
import useAuthStore from '../stores/useAuthStore';

const api = axios.create({
    // baseURL: 'https://api.a-zconsultancyltd.com/smartbooks-server/api',
    baseURL: 'http://localhost/smartbooks-server/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Read the token from the zustand store, not directly from localStorage.
// This ensures the interceptor always uses the same source of truth as the rest of the app.
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
 
// Handle 401 responses globally — token rejected by the server
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
      // Let the ProtectedRoute / page handle the redirect naturally
    }
    return Promise.reject(error);
  }
);
 
export default api;