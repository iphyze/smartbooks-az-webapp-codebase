import axios from 'axios';

const api = axios.create({
    baseURL: 'https://api.a-zconsultancyltd.com/smartbooks-server/api',
    // baseURL: 'http://localhost/smartbooks-server/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;