import { useEffect, useState } from 'react';
import { serviceService } from '../services/api';
import type { Service } from '../types/api';
import './ServicesList.css';

const ServicesList = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await serviceService.getServices();
        const data = Array.isArray(response) ? response : response?.data || [];
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
            <h2>{service.name}</h2>
            <p className="service-description">{service.description}</p>
            <p className="service-category">Category: {service.category}</p>
            {service.estimated_duration !== undefined && (
              <p className="service-duration">
                Est. Duration: {service.estimated_duration} mins
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesList;
