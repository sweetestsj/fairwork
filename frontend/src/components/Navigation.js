import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/">FairWork</Link>
      </div>
      <ul className="nav-menu">
        <li className="nav-item">
          <Link to="/" className="nav-link">Home</Link>
        </li>
        <li className="nav-item">
          <Link to="/services" className="nav-link">Services</Link>
        </li>
        <li className="nav-item">
          <Link to="/jobs" className="nav-link">Jobs</Link>
        </li>
        <li className="nav-item">
          <Link to="/profile" className="nav-link">Profile</Link>
        </li>
        <li className="nav-item">
          <Link to="/login" className="nav-link">Login</Link>
        </li>
        <li className="nav-item">
          <Link to="/register" className="nav-link">Register</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;