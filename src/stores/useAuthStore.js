import { create } from 'zustand';
import api from '../services/api';

const removeLegacyBrowserTokens = () => {
  localStorage.removeItem('auth-storage');
  localStorage.removeItem('token');
};

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    must_change_password: Boolean(
      user.must_change_password === true
      || user.must_change_password === 1
      || user.must_change_password === '1'
    ),
  };
};

/**
 * Authentication state contains no JWT.
 * The API issues the JWT only as an HttpOnly cookie; JavaScript retains user UI state only.
 */
const useAuthStore = create((set, get) => ({
  token: null, // Legacy compatibility only. A JWT is never stored here.
  user: null,
  isAuthenticated: false,
  authReady: false,
  isInitializing: false,

  initialize: async () => {
    removeLegacyBrowserTokens();
    const { authReady, isInitializing } = get();
    if (authReady || isInitializing) return;

    set({ isInitializing: true });

    try {
      // One request establishes the CSRF companion token and restores a valid
      // HttpOnly-cookie session. This avoids two serial production requests.
      const response = await api.get('/auth/bootstrap');
      const payload = response.data?.data || {};
      const user = normalizeUser(payload.user);
      const isAuthenticated = Boolean(payload.authenticated && user);

      set({
        user: isAuthenticated ? user : null,
        isAuthenticated,
        authReady: true,
        isInitializing: false,
        token: null,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        authReady: true,
        isInitializing: false,
        token: null,
      });
    }
  },

  login: async (email, password) => {
    removeLegacyBrowserTokens();
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.status === 'Success') {
        set({
          user: normalizeUser(response.data.data),
          isAuthenticated: true,
          authReady: true,
          token: null,
        });
        return { success: true, user: normalizeUser(response.data.data) };
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please try again.',
      };
    }
  },

  logout: async () => {
    removeLegacyBrowserTokens();
    try {
      await api.post('/auth/logout');
    } catch {
      // The local authenticated UI state must still be cleared if the server cookie expired.
    } finally {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        authReady: true,
      });
    }
  },

  clearSession: () => {
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      authReady: true,
    });
  },
}));

export default useAuthStore;
