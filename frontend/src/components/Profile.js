import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [servicePreferences, setServicePreferences] = useState([]);
  const [credentials, setCredentials] = useState(null);

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

        // Fetch service preferences for homeowners
        if (userData.user.role === 'homeowner') {
          try {
            const prefs = await userService.getServicePreferences();
            setServicePreferences(prefs.preferences || []);
          } catch (prefsError) {
            console.error('Error fetching service preferences:', prefsError);
          }
        }

        // Fetch credentials for pros
        if (userData.user.role === 'pro') {
          try {
            const credData = await userService.getCredentials();
            setCredentials(credData.credentials || null);
          } catch (credError) {
            console.error('Error fetching credentials:', credError);
          }
        }
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

  const handleEditClick = () => {
    if (user) {
      setEditData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    try {
      const updatedUser = await userService.updateProfile(editData);
      setUser(updatedUser.user);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile information');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
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
        <div className="profile-edit-form">
          <div className="profile-field">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleInputChange}
              className="profile-input"
            />
          </div>
          <div className="profile-field">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={editData.email}
              onChange={handleInputChange}
              className="profile-input"
            />
          </div>
          <div className="profile-field">
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={editData.phone}
              onChange={handleInputChange}
              className="profile-input"
            />
          </div>
          <div className="profile-field">
            <label>Address:</label>
            <input
              type="text"
              name="address"
              value={editData.address}
              onChange={handleInputChange}
              className="profile-input"
            />
          </div>

          <div className="profile-actions">
            <button onClick={handleSaveEdit} className="save-btn">Save Changes</button>
            <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
          </div>
        </div>
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
          {user.phone && (
            <div className="profile-field">
              <label>Phone:</label>
              <span>{user.phone}</span>
            </div>
          )}
          {user.address && (
            <div className="profile-field">
              <label>Address:</label>
              <span>{user.address}</span>
            </div>
          )}

          {/* Display additional info for pros */}
          {user.role === 'pro' && credentials && (
            <>
              <div className="profile-field">
                <label>Business Name:</label>
                <span>{credentials.business_name || 'N/A'}</span>
              </div>
              <div className="profile-field">
                <label>License Number:</label>
                <span>{credentials.license_number || 'N/A'}</span>
              </div>
            </>
          )}

          {/* Display service preferences for homeowners */}
          {user.role === 'homeowner' && servicePreferences.length > 0 && (
            <div className="profile-field">
              <label>Service Preferences:</label>
              <span>{servicePreferences.map(p => p.name).join(', ')}</span>
            </div>
          )}

          <div className="profile-actions">
            <button onClick={handleEditClick} className="edit-btn">Edit Profile</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;