import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <header className="home-header">
        <h1>Welcome to FairWork</h1>
        <p>Your marketplace for services and jobs</p>
      </header>

      <section className="home-features">
        <div className="feature-card">
          <h2>Find Services</h2>
          <p>Browse through a wide range of services offered by professionals.</p>
        </div>
        <div className="feature-card">
          <h2>Post Jobs</h2>
          <p>Post your job requirements and get matched with the right professionals.</p>
        </div>
        <div className="feature-card">
          <h2>Connect</h2>
          <p>Connect with service providers and clients in one place.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;