import axios from 'axios';
import useAuthStore from '../stores/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost/smartbooks-server/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const csrfCookieName = import.meta.env.VITE_CSRF_COOKIE_NAME || 'smartbooks_csrf_token';
const unsafeMethods = new Set(['post', 'put', 'patch', 'delete']);
let csrfTokenInMemory = '';

const readCookie = (name) => {
  const prefix = `${encodeURIComponent(name)}=`;
  const value = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);

  return value ? decodeURIComponent(value) : '';
};

export const clearCsrfToken = () => {
  csrfTokenInMemory = '';
};

api.interceptors.request.use(
  (config) => {
    // Migration safety: older stores still pass Authorization headers. Never send
    // them now that the JWT is protected inside an HttpOnly cookie.
    if (typeof config.headers?.delete === 'function') {
      config.headers.delete('Authorization');
      config.headers.delete('authorization');
    } else if (config.headers) {
      delete config.headers.Authorization;
      delete config.headers.authorization;
    }

    const method = (config.method || 'get').toLowerCase();
    if (unsafeMethods.has(method)) {
      // For separate UI/API subdomains the UI cannot read an API-hosted cookie,
      // so /auth/csrf supplies this non-secret value in memory for the header.
      const csrfToken = csrfTokenInMemory || readCookie(csrfCookieName);
      if (csrfToken) {
        if (typeof config.headers?.set === 'function') {
          config.headers.set('X-CSRF-Token', csrfToken);
        } else {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const requestUrl = response.config?.url || '';
    if (requestUrl.includes('/auth/csrf') && response.data?.data?.csrfToken) {
      csrfTokenInMemory = response.data.data.csrfToken;
    }
    if (requestUrl.includes('/auth/logout')) {
      clearCsrfToken();
    }
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthProbe = requestUrl.includes('/auth/me') || requestUrl.includes('/auth/login');

    if (error.response?.status === 401 && !isAuthProbe) {
      clearCsrfToken();
      useAuthStore.getState().clearSession();
    }

    return Promise.reject(error);
  }
);

export default api;
