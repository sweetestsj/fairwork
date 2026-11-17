import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ServicesList.css';

const ServicesList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get('/api/services');
        setServices(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) return <div className="loading">Loading services...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="services-list">
      <h2>Available Services</h2>
      {services.length > 0 ? (
        <ul className="services-grid">
          {services.map(service => (
            <li key={service.id} className="service-card">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <p><strong>Price:</strong> ${service.price}</p>
              <p><strong>Category:</strong> {service.category}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No services available.</p>
      )}
    </div>
  );
};

export default ServicesList;