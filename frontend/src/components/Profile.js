import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        // Fetch user profile from backend API
        const userData = await userService.getProfile();
        setUser(userData.user);
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (err.response?.status === 401) {
          // Token is invalid, redirect to login
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