import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import JobsList from '../components/JobsList';
import LoginForm from '../components/LoginForm';
import Profile from '../components/Profile';
import RegisterForm from '../components/RegisterForm';
import ServicesList from '../components/ServicesList';
import { authService, jobService, serviceService, userService } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    defaults: { baseURL: 'http://localhost:3000/api' },
  },
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
  userService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
  serviceService: {
    getServices: vi.fn(),
    getServiceById: vi.fn(),
  },
  jobService: {
    getJobs: vi.fn(),
    getJobById: vi.fn(),
    getJobsByCategory: vi.fn(),
  },
}));

const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true };

describe('FairWork Frontend (Vite + React 18 + TypeScript)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the home page and navigation links', () => {
    render(<App />);

    expect(screen.getByText('Welcome to FairWork Marketplace')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/services');
    expect(screen.getByRole('link', { name: 'Jobs' })).toHaveAttribute('href', '/jobs');
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
  });

  it('renders canonical service fields from the backend API', async () => {
    vi.mocked(serviceService.getServices).mockResolvedValueOnce({
      success: true,
      count: 1,
      data: [
        {
          id: 'svc-1',
          name: 'Pressure Washing',
          description: 'Driveway and patio wash',
          category: 'Exterior Cleaning',
          estimated_duration: 120,
        },
      ],
    });

    render(<ServicesList />);

    await waitFor(() => {
      expect(screen.getByText('Pressure Washing')).toBeInTheDocument();
    });
    expect(screen.getByText('Driveway and patio wash')).toBeInTheDocument();
    expect(screen.getByText('Category: Exterior Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Est. Duration: 120 mins')).toBeInTheDocument();
  });

  it('filters jobs and resets all filters including status', async () => {
    vi.mocked(jobService.getJobs).mockResolvedValueOnce({
      success: true,
      count: 2,
      data: [
        {
          id: 'job-1',
          title: 'Clean front gutters',
          description: 'Two-story home',
          category: 'Exterior Cleaning',
          budget: 180,
          status: 'open',
          created_at: '2026-11-20T12:00:00.000Z',
        },
        {
          id: 'job-2',
          title: 'Patch garage drywall',
          description: 'Small hole repair',
          category: 'Interior Repair',
          budget: 250,
          status: 'completed',
          created_at: '2026-11-21T12:00:00.000Z',
        },
      ],
    });

    render(<JobsList />);

    await waitFor(() => {
      expect(screen.getByText('Clean front gutters')).toBeInTheDocument();
    });
    expect(screen.getByText('Patch garage drywall')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Status:'), { target: { value: 'open' } });
    expect(screen.getByText('Clean front gutters')).toBeInTheDocument();
    expect(screen.queryByText('Patch garage drywall')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));
    expect(screen.getByText('Patch garage drywall')).toBeInTheDocument();
  });

  it('submits selected role during registration', async () => {
    const onRegister = vi.fn();
    vi.mocked(authService.register).mockResolvedValueOnce({
      message: 'User registered successfully',
      token: 'jwt-token',
      user: {
        id: 'user-1',
        name: 'Jane Pro',
        email: 'jane@example.com',
        role: 'pro',
      },
    });

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <RegisterForm onRegister={onRegister} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Jane Pro' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText('Account Type'), { target: { value: 'pro' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        name: 'Jane Pro',
        email: 'jane@example.com',
        password: 'password123',
        role: 'pro',
      });
    });
    expect(onRegister).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', role: 'pro' })
    );
  });

  it('logs in user and stores auth token', async () => {
    const onLogin = vi.fn();
    vi.mocked(authService.login).mockResolvedValueOnce({
      message: 'Login successful',
      token: 'login-jwt-token',
      user: {
        id: 'user-2',
        name: 'Denton Homeowner',
        email: 'homeowner@example.com',
        role: 'homeowner',
      },
    });

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <LoginForm onLogin={onLogin} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'homeowner@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-2', name: 'Denton Homeowner' })
      );
    });
    expect(localStorage.getItem('token')).toBe('login-jwt-token');
  });

  it('loads and displays authenticated user profile', async () => {
    localStorage.setItem('token', 'valid-token');
    vi.mocked(userService.getProfile).mockResolvedValueOnce({
      message: 'Profile retrieved successfully',
      user: {
        id: 'user-2',
        name: 'Denton Homeowner',
        email: 'homeowner@example.com',
        role: 'homeowner',
      },
    });

    render(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('Denton Homeowner')).toBeInTheDocument();
    });
    expect(screen.getByText('homeowner@example.com')).toBeInTheDocument();
    expect(screen.getByText('homeowner')).toBeInTheDocument();
  });
});
