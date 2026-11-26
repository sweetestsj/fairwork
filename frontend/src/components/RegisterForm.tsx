import axios from 'axios';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import type { ApiErrorResponse, User, UserRole } from '../types/api';
import './RegisterForm.css';

interface RegisterFormProps {
  onRegister: (user: User) => void;
}

interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

const RegisterForm = ({ onRegister }: RegisterFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'homeowner',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      localStorage.setItem('token', response.token);
      onRegister(response.user);
      navigate('/profile');
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        setError(
          err.response.data.message ||
            err.response.data.error ||
            'Registration failed. Please try again.'
        );
      } else if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during registration');
      }
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-form">
      <h1>Register</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">Account Type</label>
          <select id="role" name="role" value={formData.role} onChange={handleChange}>
            <option value="homeowner">Homeowner</option>
            <option value="pro">Service Pro</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
