import { ChangeEvent, useEffect, useState } from 'react';
import { jobService } from '../services/api';
import type { Job } from '../types/api';
import './JobsList.css';

interface JobFilters {
  category: string;
  minPrice: string;
  maxPrice: string;
  datePosted: string;
  status: string;
  title: string;
}

type SortOption = 'date' | 'date_asc' | 'budget' | 'category' | 'title';

const INITIAL_FILTERS: JobFilters = {
  category: '',
  minPrice: '',
  maxPrice: '',
  datePosted: '',
  status: '',
  title: '',
};

const toNumericBudget = (budget: Job['budget']): number => {
  if (budget === null || budget === undefined || budget === '') {
    return 0;
  }
  const parsed = Number(budget);
  return Number.isFinite(parsed) ? parsed : 0;
};

const JobsList = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobFilters>(INITIAL_FILTERS);
  const [sortOption, setSortOption] = useState<SortOption>('date');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await jobService.getJobs();
        const data = Array.isArray(response) ? response : response?.data || [];
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

    if (filters.category) {
      filtered = filtered.filter(
        (job) =>
          job.category && job.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.title) {
      filtered = filtered.filter(
        (job) => job.title && job.title.toLowerCase().includes(filters.title.toLowerCase())
      );
    }

    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      filtered = filtered.filter((job) => toNumericBudget(job.budget) >= min);
    }

    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      filtered = filtered.filter((job) => toNumericBudget(job.budget) <= max);
    }

    if (filters.datePosted) {
      const selectedDate = new Date(filters.datePosted);
      filtered = filtered.filter((job) => {
        const jobDate = new Date(job.created_at);
        return jobDate.toDateString() === selectedDate.toDateString();
      });
    }

    if (filters.status) {
      filtered = filtered.filter((job) => job.status === filters.status);
    }

    const sortedJobs = [...filtered];
    switch (sortOption) {
      case 'date':
        sortedJobs.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'date_asc':
        sortedJobs.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'budget':
        sortedJobs.sort((a, b) => toNumericBudget(b.budget) - toNumericBudget(a.budget));
        break;
      case 'category':
        sortedJobs.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
      case 'title':
        sortedJobs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      default:
        sortedJobs.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    setFilteredJobs(sortedJobs);
  }, [filters, jobs, sortOption]);

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value as SortOption);
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
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
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

        <button type="button" onClick={clearFilters} className="clear-filters-btn">
          Clear Filters
        </button>
      </div>

      <div className="jobs-grid">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div key={job.id} className="job-card">
              <h2>{job.title}</h2>
              <p className="job-description">{job.description}</p>
              <p className="job-budget">
                Budget: {job.budget !== null && job.budget !== undefined ? `$${job.budget}` : 'TBD'}
              </p>
              <p className="job-posted">
                Posted: {new Date(job.created_at).toLocaleDateString()}
              </p>
              <p className="job-category">Category: {job.category || 'Uncategorized'}</p>
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
