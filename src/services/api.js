import axios from 'axios';
import useAuthStore from '../stores/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost/smartbooks-server/api',
  withCredentials: true,
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
    // FormData must be sent without a pre-set Content-Type. The browser/axios
    // will add multipart/form-data together with the required boundary. Keeping
    // the instance-level application/json header causes File values to be
    // serialised as JSON objects, leaving PHP's $_FILES empty.
    const isFormDataRequest =
      typeof FormData !== 'undefined' && config.data instanceof FormData;

    if (isFormDataRequest && config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      } else {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }

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
    const responseCsrfToken = response.data?.data?.csrfToken || response.data?.csrfToken;
    if (responseCsrfToken) {
      csrfTokenInMemory = responseCsrfToken;
    }
    if (requestUrl.includes('/auth/logout')) {
      clearCsrfToken();
    }
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthProbe = requestUrl.includes('/auth/bootstrap') || requestUrl.includes('/auth/me') || requestUrl.includes('/auth/login');

    if (
      error.response?.status === 403
      && error.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED'
    ) {
      const { user } = useAuthStore.getState();
      useAuthStore.setState({
        user: user ? { ...user, must_change_password: true } : user,
      });

    }

    if (error.response?.status === 401 && !isAuthProbe) {
      clearCsrfToken();
      useAuthStore.getState().clearSession();
    }

    return Promise.reject(error);
  }
);

export default api;
