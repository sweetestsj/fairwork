import React, { useState, useEffect } from 'react';
import { jobService } from '../services/api';
import './JobsList.css';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    datePosted: ''
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await jobService.getJobs();
        // Extract the data array from API response structure
        const data = Array.isArray(response) ? response : (response?.data || []);
        setJobs(data);
        setFilteredJobs(data);
      } catch (err) {
        setError('Failed to fetch jobs');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = jobs;

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(job =>
        job.category && job.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    // Filter by price range
    if (filters.minPrice) {
      filtered = filtered.filter(job => job.budget >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(job => job.budget <= parseFloat(filters.maxPrice));
    }

    // Filter by date posted
    if (filters.datePosted) {
      const selectedDate = new Date(filters.datePosted);
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.created_at);
        return jobDate.toDateString() === selectedDate.toDateString();
      });
    }

    setFilteredJobs(filtered);
  }, [filters, jobs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      datePosted: ''
    });
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

      {/* Filter Controls */}
      <div className="job-filters">
        <div className="filter-group">
          <label htmlFor="category">Category:</label>
          <input
            type="text"
            id="category"
            name="category"
            placeholder="Filter by category"
            value={filters.category}
            onChange={handleFilterChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="minPrice">Min Price:</label>
          <input
            type="number"
            id="minPrice"
            name="minPrice"
            placeholder="Min budget"
            value={filters.minPrice}
            onChange={handleFilterChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="maxPrice">Max Price:</label>
          <input
            type="number"
            id="maxPrice"
            name="maxPrice"
            placeholder="Max budget"
            value={filters.maxPrice}
            onChange={handleFilterChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="datePosted">Date Posted:</label>
          <input
            type="date"
            id="datePosted"
            name="datePosted"
            value={filters.datePosted}
            onChange={handleFilterChange}
          />
        </div>

        <button onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>
      </div>

      {/* Jobs Grid */}
      <div className="jobs-grid">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div key={job.id} className="job-card">
              <h2>{job.title}</h2>
              <p className="job-description">{job.description}</p>
              <p className="job-budget">Budget: ${job.budget}</p>
              <p className="job-posted">Posted: {new Date(job.created_at).toLocaleDateString()}</p>
              <p className="job-category">Category: {job.category}</p>
            </div>
          ))
        ) : (
          <p className="no-jobs-found">No jobs found matching your criteria.</p>
        )}
      </div>
    </div>
  );
};

export default JobsList;