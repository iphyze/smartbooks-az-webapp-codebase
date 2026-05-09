import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isTokenExpired } from '../utils/jwtUtils';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      /**
       * Login action — calls /auth/login and stores token + user.
       * Returns { success: true } or { success: false, error: string }.
       */
      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });

          if (response.data.status === 'Success') {
            const { token, ...userData } = response.data.data;

            set({ token, user: userData });

            return { success: true };
          }

          return { success: false, error: 'Invalid credentials' };
        } catch (error) {
          console.error('Login error:', error);
          return {
            success: false,
            error: error.response?.data?.message || 'Login failed. Please try again.',
          };
        }
      },

      /**
       * Logout action — wipes state and persisted storage.
       */
      logout: () => {
        set({ token: null, user: null });
      },

      /**
       * init — validates the persisted token on app start.
       * Called once after the store is created.
       * If the token is expired it clears state; otherwise it's a no-op
       * because zustand/persist already rehydrated the values.
       */
      init: () => {
        const { token } = get();
        if (token && isTokenExpired(token)) {
          set({ token: null, user: null });
        }
      },

      /**
       * isAuthenticated helper — returns true when there is a valid, unexpired token.
       */
      isAuthenticated: () => {
        const { token } = get();
        return !!token && !isTokenExpired(token);
      },
    }),
    {
      name: 'auth-storage',
      // Persist only the minimal state needed; functions are re-created on hydration.
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

// Run token validation once after the store is created (e.g. on page load).
useAuthStore.getState().init();

export default useAuthStore;