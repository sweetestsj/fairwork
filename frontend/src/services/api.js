import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

export const userService = {
  getProfile: async () => {
    const response = await api.get('/api/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/api/profile', profileData);
    return response.data;
  },

  getServicePreferences: async () => {
    const response = await api.get('/api/profile/service-preferences');
    return response.data;
  },

  updateServicePreferences: async (serviceIds) => {
    const response = await api.put('/api/profile/service-preferences', { serviceIds });
    return response.data;
  },

  getCredentials: async () => {
    const response = await api.get('/api/profile/credentials');
    return response.data;
  },

  updateCredentials: async (credentialsData) => {
    const response = await api.put('/api/profile/credentials', credentialsData);
    return response.data;
  },
};

export const serviceService = {
  getServices: async () => {
    const response = await api.get('/services');
    return response.data;
  },

  getServiceById: async (id) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },
};

export const jobService = {
  getJobs: async () => {
    const response = await api.get('/jobs');
    return response.data;
  },

  getJobById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },
};