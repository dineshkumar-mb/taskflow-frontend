import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Mutex and queue for handling concurrent token refreshes
 */
let isRefreshing = false;
let failedQueue = [];

// Callback for logout on persistent 401s (set in store.js or App.jsx)
let onUnauthorized = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
};

export const setUnauthorizedCallback = (cb) => {
    onUnauthorized = cb;
};

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.organizationId) {
                    config.headers['x-organization-id'] = user.organizationId;
                }
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {

            if (originalRequest.url.includes('/auth/refresh') ||
                originalRequest.url.includes('/auth/login') ||
                originalRequest.url.includes('/auth/logout')) {

                if (!originalRequest.url.includes('/auth/logout')) {
                    onUnauthorized();
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    originalRequest._retry = true;
                    return axiosInstance(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.get(`${API_URL}/auth/refresh`, { withCredentials: true });
                isRefreshing = false;
                processQueue(null);
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                processQueue(refreshError);
                onUnauthorized();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
