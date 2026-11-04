import axios from 'axios';

// Communicate with deployed Render backend via VITE_API_BASE_URL
// Defaults to '/api' for local Vite dev proxy and Vercel same-origin rewrites
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const baseURL = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wayrivo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wayrivo_token');
      localStorage.removeItem('wayrivo_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
