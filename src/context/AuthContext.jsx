import React from 'react';
import useAuthStore from '../stores/useAuthStore';

/**
 * Backward-compatible context exports without storing credentials in Web Storage.
 * Prefer importing useAuthStore directly in new components.
 */
export const useAuth = () => useAuthStore();

export const AuthProvider = ({ children }) => <>{children}</>;
