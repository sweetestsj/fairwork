import axios from 'axios';
import { useEffect, useState } from 'react';
import { userService } from '../services/api';
import type { User } from '../types/api';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const userData = await userService.getProfile();
        setUser(userData.user);
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          setError('Failed to fetch profile information');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return <div className="profile loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="profile error">{error}</div>;
  }

  if (!user) {
    return <div className="profile">No user data available</div>;
  }

  return (
    <div className="profile">
      <h1>User Profile</h1>
      <div className="profile-info">
        <div className="profile-field">
          <label>Name:</label>
          <span>{user.name || 'N/A'}</span>
        </div>
        <div className="profile-field">
          <label>Email:</label>
          <span>{user.email || 'N/A'}</span>
        </div>
        <div className="profile-field">
          <label>Role:</label>
          <span>{user.role || 'User'}</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;