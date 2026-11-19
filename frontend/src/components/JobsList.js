import React, { useState, useEffect } from 'react';
import { jobService } from '../services/api';
import './JobsList.css';

// Distance filter removed as per issue #92 - no longer needed for job listings
// Implementation completed in commit 3cddba2
// The distance filter functionality has been completely removed from:
// - State variables (userLocation, geolocationError)
// - Geolocation API calls
// - Filtering logic
// - UI components
const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    datePosted: '',
    status: '',
    title: ''
  });
  const [sortOption, setSortOption] = useState('date'); // default sort by date

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

  
  
  // Apply filters and sorting whenever they change
  useEffect(() => {
    let filtered = jobs;

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(job =>
        job.category && job.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    // Filter by title
    if (filters.title) {
      filtered = filtered.filter(job =>
        job.title && job.title.toLowerCase().includes(filters.title.toLowerCase())
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

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(job => job.status === filters.status);
    }


    // Apply sorting
    const sortedJobs = [...filtered];
    switch (sortOption) {
      case 'date':
        sortedJobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'date_asc':
        sortedJobs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'budget':
        sortedJobs.sort((a, b) => b.budget - a.budget);
        break;
      case 'category':
        sortedJobs.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
      case 'title':
        sortedJobs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      default:
        sortedJobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setFilteredJobs(sortedJobs);
  }, [filters, jobs, sortOption]);

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
      datePosted: '',
      title: ''
    });
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
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

      {/* Sort and Filter Controls */}
      <div className="job-filters">
        <div className="filter-group">
          <label htmlFor="sort">Sort by:</label>
          <select id="sort" value={sortOption} onChange={handleSortChange}>
            <option value="date">Date Posted (Newest First)</option>
            <option value="date_asc">Date Posted (Oldest First)</option>
            <option value="budget">Budget (Highest First)</option>
            <option value="category">Category</option>
            <option value="title">Title</option>
          </select>
        </div>

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

        <div className="filter-group">
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Search job title"
            value={filters.title}
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