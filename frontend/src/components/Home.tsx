import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <header className="home-header">
        <h1>Welcome to FairWork Marketplace</h1>
        <p>Your platform for connecting service providers and customers</p>
      </header>

      <section className="home-features">
        <div className="feature-card">
          <h2>Find Services</h2>
          <p>Browse through a wide range of services provided by trusted vendors.</p>
        </div>
        <div className="feature-card">
          <h2>Post Jobs</h2>
          <p>List your job requirements and get matched with suitable service providers.</p>
        </div>
        <div className="feature-card">
          <h2>Connect</h2>
          <p>Build relationships with service providers and customers in our community.</p>
        </div>
      </section>

      <section className="home-call-to-action">
        <h2>Get Started Today</h2>
        <p>Join our marketplace to access all features and benefits.</p>
        <div className="cta-buttons">
          <Link to="/register" className="btn btn-primary">
            Sign Up
          </Link>
          <Link to="/services" className="btn btn-secondary">
            Learn More
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
