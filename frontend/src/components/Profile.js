import React from 'react';
import './Profile.css';

const Profile = () => {
  return (
    <div className="profile">
      <h1>User Profile</h1>
      <div className="profile-info">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <p><strong>Name:</strong> John Doe</p>
          <p><strong>Email:</strong> john.doe@example.com</p>
          <p><strong>Member since:</strong> January 2024</p>
        </div>

        <div className="profile-section">
          <h2>Account Settings</h2>
          <p><strong>Notification Preferences:</strong> Email and SMS</p>
          <p><strong>Privacy Settings:</strong> Public profile</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;