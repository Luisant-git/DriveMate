import axios from 'axios';
import { API_BASE_URL } from './config.js';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL + '/api',
  withCredentials: true,
});

// Add request interceptor to include JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLead = !!localStorage.getItem('leadToken');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('leadToken');
      localStorage.removeItem('leadData');
      
      if (isLead) {
        window.location.href = '/lead/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;