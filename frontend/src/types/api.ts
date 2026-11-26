export type UserRole = 'homeowner' | 'pro';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ProfileResponse {
  message: string;
  user: User;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  estimated_duration: number;
  created_at?: string;
}

export type JobStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'closed';

export interface Job {
  id: string;
  title: string;
  description: string;
  category?: string;
  budget?: number | string | null;
  status: JobStatus;
  provider_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

export interface ApiItemResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
}
