import React, { useState, useEffect } from 'react';
import { jobService } from '../services/api';
import './JobsList.css';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('date'); // default sorting by date

  useEffect(() => {
    const fetchJobs = async (sort = 'date') => {
      try {
        const response = await jobService.getJobs(sort);
        // Extract the data array from API response structure
        const data = Array.isArray(response) ? response : (response?.data || []);
        setJobs(data);
      } catch (err) {
        setError('Failed to fetch jobs');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs(sortOption);
  }, [sortOption]);

  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  if (loading) {
    return <div className="jobs-list loading">Loading jobs...</div>;
  }

  if (error) {
    return <div className="jobs-list error">{error}</div>;
  }

  return (
    <div className="jobs-list">
      <h1>Available Jobs</h1>

      {/* Sorting controls */}
      <div className="sort-controls">
        <label htmlFor="sort-options">Sort by: </label>
        <select id="sort-options" value={sortOption} onChange={handleSortChange}>
          <option value="date">Date Posted (Newest First)</option>
          <option value="budget">Budget (Highest First)</option>
          <option value="category">Category</option>
        </select>
      </div>

      <div className="jobs-grid">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <h2>{job.title}</h2>
            <p className="job-description">{job.description}</p>
            <p className="job-budget">Budget: ${job.budget}</p>
            <p className="job-posted">Posted: {new Date(job.postedAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobsList;