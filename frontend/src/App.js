import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [services, setServices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch services
        const servicesResponse = await axios.get('/api/services');
        setServices(servicesResponse.data);

        // Fetch jobs
        const jobsResponse = await axios.get('/api/jobs');
        setJobs(jobsResponse.data);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="App">
      <h1>FairWork</h1>

      <section>
        <h2>Services</h2>
        {services.length > 0 ? (
          <ul>
            {services.map(service => (
              <li key={service.id}>{service.title}</li>
            ))}
          </ul>
        ) : (
          <p>No services available.</p>
        )}
      </section>

      <section>
        <h2>Jobs</h2>
        {jobs.length > 0 ? (
          <ul>
            {jobs.map(job => (
              <li key={job.id}>{job.title}</li>
            ))}
          </ul>
        ) : (
          <p>No jobs available.</p>
        )}
      </section>
    </div>
  );
}

export default App;