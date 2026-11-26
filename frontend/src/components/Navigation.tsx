import { Link } from 'react-router-dom';
import './Navigation.css';

interface NavigationProps {
  isLoggedIn: boolean;
  userName?: string;
  onLogout: () => void;
}

const Navigation = ({ isLoggedIn, userName, onLogout }: NavigationProps) => {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          FairWork
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/services" className="nav-link">
              Services
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/jobs" className="nav-link">
              Jobs
            </Link>
          </li>
          {isLoggedIn ? (
            <>
              <li className="nav-item">
                <Link to="/profile" className="nav-link">
                  {userName ? `Profile (${userName})` : 'Profile'}
                </Link>
              </li>
              <li className="nav-item">
                <button className="nav-button" type="button" onClick={onLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link">
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link">
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
