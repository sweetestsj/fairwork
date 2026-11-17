import React, { useState, useEffect } from 'react';
import { serviceService } from '../services/api';
import './ServicesList.css';

const ServicesList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await serviceService.getServices();
        setServices(data);
      } catch (err) {
        setError('Failed to fetch services');
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return <div className="services-list loading">Loading services...</div>;
  }

  if (error) {
    return <div className="services-list error">{error}</div>;
  }

  return (
    <div className="services-list">
      <h1>Available Services</h1>
      <div className="services-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <h2>{service.title}</h2>
            <p className="service-description">{service.description}</p>
            <p className="service-price">Price: ${service.price}</p>
            <p className="service-provider">Provider: {service.providerName}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesList;