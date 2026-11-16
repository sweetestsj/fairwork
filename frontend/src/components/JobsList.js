import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './JobsList.css';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get('/api/jobs');
        setJobs(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) return <div className="loading">Loading jobs...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="jobs-list">
      <h2>Available Jobs</h2>
      {jobs.length > 0 ? (
        <ul className="jobs-grid">
          {jobs.map(job => (
            <li key={job.id} className="job-card">
              <h3>{job.title}</h3>
              <p>{job.description}</p>
              <p><strong>Salary:</strong> ${job.salary}</p>
              <p><strong>Location:</strong> {job.location}</p>
              <p><strong>Status:</strong> {job.status}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No jobs available.</p>
      )}
    </div>
  );
};

export default JobsList;