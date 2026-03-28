import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isTokenExpired } from '../utils/jwtUtils';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set) => ({
      // Initial state
      token: null,
      user: null,

      // Login action
      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          
          if (response.data.status === 'Success') {
            const { token, ...userData } = response.data.data;
            
            // Store token and user data in localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userData));
            
            // Update state
            set({ 
              token: token,
              user: userData
            });

            return { success: true };
          }
          return { success: false, error: 'Invalid credentials' };
        } catch (error) {
          console.error('Login error:', error);
          return { 
            success: false, 
            error: error.response?.data?.message || 'Login failed' 
          };
        }
      },

      // Logout action
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ token: null, user: null });
      },

      // Initialize state from localStorage with token validation
      init: () => {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        
        if (savedToken && !isTokenExpired(savedToken)) {
          set({ 
            token: savedToken,
            user: savedUser ? JSON.parse(savedUser) : null
          });
        } else if (savedToken) {
          // If token exists but is expired, clear everything
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          set({ token: null, user: null });
        }
      }
    }),
    {
      name: "auth-storage",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : { 
            state: { 
              token: null,
              user: null
            } 
          };
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

// Initialize the auth state when the store is created
useAuthStore.getState().init();

export default useAuthStore;