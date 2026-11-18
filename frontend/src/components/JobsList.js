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
    datePosted: '',
    status: '',
    distance: '',
    title: ''
  });
  const [sortOption, setSortOption] = useState('date'); // default sort by date
  const [userLocation, setUserLocation] = useState(null);
  const [geolocationError, setGeolocationError] = useState(null);

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

  // Get user's geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setGeolocationError(null);
        },
        (error) => {
          console.error('Error getting geolocation:', error);
          setGeolocationError('Unable to get your location. Distance filtering will be disabled.');
        }
      );
    } else {
      setGeolocationError('Geolocation is not supported by this browser.');
    }
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  };

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

    // Filter by distance
    if (filters.distance && userLocation) {
      filtered = filtered.filter(job => {
        // Check if job has location data
        if (!job.latitude || !job.longitude) {
          return false; // Jobs without location data are excluded from distance filtering
        }

        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          job.latitude,
          job.longitude
        );
        return distance <= parseFloat(filters.distance);
      });
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
  }, [filters, jobs, sortOption, userLocation]);

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
      distance: '',
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

      {/* Geolocation error message */}
      {geolocationError && (
        <div className="geolocation-error">
          <p>{geolocationError}</p>
        </div>
      )}

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

        <div className="filter-group">
          <label htmlFor="distance">Within:</label>
          <div className="distance-filter-container">
            <input
              type="number"
              id="distance"
              name="distance"
              placeholder="Distance in miles"
              value={filters.distance}
              onChange={handleFilterChange}
              min="1"
            />
            <span className="miles-label">miles</span>
          </div>
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