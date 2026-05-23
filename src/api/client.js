import axios from 'axios';

// Create central Axios instance with direct /api routing (handled by Vite proxy in dev)
const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization tokens
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pinaka_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch central session timeouts or permission challenges
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const originalRequest = error.config;
    
    // Auto-logout user if JWT has expired or token is corrupt, unless skipAuthRedirect is set
    if (error.response && error.response.status === 401 && !originalRequest._retry && !originalRequest.skipAuthRedirect) {
      localStorage.removeItem('pinaka_auth_token');
      // If we are not in login page, reload to trigger route guards
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    const errMessage = error.response?.data?.message || error.message || 'API request failure';
    return Promise.reject(new Error(errMessage));
  }
);

export default client;
