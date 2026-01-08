import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add the token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('padz_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor to handle common errors (like 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login if unauthorized
            localStorage.removeItem('padz_token');
            localStorage.removeItem('padz_user');
            // window.location.href = '/login'; // Let the context handle this instead
        }
        return Promise.reject(error);
    }
);

export default api;
