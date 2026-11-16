import React, { useState, useEffect } from 'react';

function App() {
  const [services, setServices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch services
        const servicesResponse = await fetch('/api/services');
        if (!servicesResponse.ok) {
          throw new Error(`Failed to fetch services: ${servicesResponse.status}`);
        }
        const servicesData = await servicesResponse.json();
        setServices(servicesData);

        // Fetch jobs
        const jobsResponse = await fetch('/api/jobs');
        if (!jobsResponse.ok) {
          throw new Error(`Failed to fetch jobs: ${jobsResponse.status}`);
        }
        const jobsData = await jobsResponse.json();
        setJobs(jobsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>FairWork</h1>
      <h2>Services</h2>
      <ul>
        {services.map(service => (
          <li key={service.id}>{service.name}</li>
        ))}
      </ul>

      <h2>Jobs</h2>
      <ul>
        {jobs.map(job => (
          <li key={job.id}>{job.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;