import axios from 'axios';

// Create a central Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Intercept requests to add the Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shop_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept responses to handle 401 Unauthorized
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    // Clear token and trigger a custom event that App.tsx can listen to
    localStorage.removeItem('shop_admin_token');
    window.dispatchEvent(new Event('auth_unauthorized'));
  }
  return Promise.reject(error);
});

export default api;
