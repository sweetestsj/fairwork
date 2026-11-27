import axios from 'axios';
import { useEffect, useState } from 'react';
import { userService } from '../services/api';
import type { User, UpdateProfilePayload } from '../types/api';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<UpdateProfilePayload>({
    name: '',
    email: '',
  });

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
        setFormData({
          name: userData.user.name || '',
          email: userData.user.email || '',
        });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!user) return;

      // Update the profile
      await userService.updateProfile(formData);

      // Update local state with new data
      setUser(prev => prev ? { ...prev, name: formData.name, email: formData.email } : null);

      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        setError('Failed to update profile information');
      }
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
    setIsEditing(false);
  };

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

      {isEditing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-field">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="profile-field">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="profile-actions">
            <button type="submit">Save Changes</button>
            <button type="button" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      ) : (
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
          <button onClick={() => setIsEditing(true)} className="edit-button">Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default Profile;
