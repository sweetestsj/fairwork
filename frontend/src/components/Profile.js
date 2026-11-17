import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
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

        // In a real app, you would typically get user info from the backend
        // For now, we'll just display what's in local storage or mock data
        const userData = JSON.parse(localStorage.getItem('user')) || null;
        setUser(userData);
      } catch (err) {
        setError('Failed to fetch profile information');
        console.error('Error fetching profile:', err);
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