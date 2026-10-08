import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8012/api/v1',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('cpns-auth-store');

  if (raw) {
    try {
      const authState = JSON.parse(raw);
      const token = authState?.state?.token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to read auth token from localStorage', error);
    }
  }

  return config;
});

export default api;
