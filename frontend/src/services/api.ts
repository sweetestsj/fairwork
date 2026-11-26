import axios from 'axios';
import type {
  ApiItemResponse,
  ApiListResponse,
  AuthResponse,
  Job,
  LoginCredentials,
  ProfileResponse,
  RegisterPayload,
  Service,
  UpdateProfilePayload,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl: string = error.config?.url || '';
    if (error.response?.status === 401 && !requestUrl.includes('/auth/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/logout');
    return response.data;
  },
};

export const userService = {
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get<ProfileResponse>('/auth/profile');
    return response.data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<AuthResponse> => {
    const response = await api.put<AuthResponse>('/auth/profile', payload);
    return response.data;
  },
};

export const serviceService = {
  getServices: async (): Promise<ApiListResponse<Service>> => {
    const response = await api.get<ApiListResponse<Service>>('/services');
    return response.data;
  },

  getServiceById: async (id: string): Promise<ApiItemResponse<Service>> => {
    const response = await api.get<ApiItemResponse<Service>>(`/services/${id}`);
    return response.data;
  },
};

export const jobService = {
  getJobs: async (): Promise<ApiListResponse<Job>> => {
    const response = await api.get<ApiListResponse<Job>>('/jobs');
    return response.data;
  },

  getJobById: async (id: string): Promise<ApiItemResponse<Job>> => {
    const response = await api.get<ApiItemResponse<Job>>(`/jobs/${id}`);
    return response.data;
  },

  getJobsByCategory: async (category: string): Promise<ApiListResponse<Job>> => {
    const response = await api.get<ApiListResponse<Job>>(
      `/jobs/category/${encodeURIComponent(category)}`
    );
    return response.data;
  },
};
