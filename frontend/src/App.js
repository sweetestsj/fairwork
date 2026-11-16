import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [services, setServices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newJobForm, setNewJobForm] = useState({
    title: '',
    description: '',
    serviceId: '',
    homeownerId: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch services
        const servicesResponse = await fetch('/api/services');
        if (!servicesResponse.ok) {
          throw new Error(`Failed to fetch services: ${servicesResponse.status}`);
        }
        const servicesData = await servicesResponse.json();
        setServices(servicesData.data || servicesData);

        // Fetch jobs
        const jobsResponse = await fetch('/api/jobs');
        if (!jobsResponse.ok) {
          throw new Error(`Failed to fetch jobs: ${jobsResponse.status}`);
        }
        const jobsData = await jobsResponse.json();
        setJobs(jobsData.data || jobsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter jobs by category
  const filteredJobs = selectedCategory === 'all'
    ? jobs
    : jobs.filter(job => {
        const service = services.find(s => s.id === job.service_id);
        return service && service.category === selectedCategory;
      });

  // Get unique categories from services
  const categories = ['all', ...new Set(services.map(service => service.category))];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewJobForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit new job form
  const handleSubmitJob = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newJobForm.title,
          description: newJobForm.description,
          serviceId: parseInt(newJobForm.serviceId),
          homeownerId: parseInt(newJobForm.homeownerId)
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create job: ${response.status}`);
      }

      const newJob = await response.json();

      // Add the new job to the list
      setJobs(prev => [newJob.data || newJob, ...prev]);
      setShowCreateForm(false);
      setNewJobForm({
        title: '',
        description: '',
        serviceId: '',
        homeownerId: ''
      });
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="app">
      <header className="app-header">
        <h1>FairWork</h1>
        <p>A local-first home-services marketplace for Denton County homeowners and DFW Pros</p>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'jobs' ? 'active' : ''}
          onClick={() => setActiveTab('jobs')}
        >
          Jobs
        </button>
        <button
          className={activeTab === 'services' ? 'active' : ''}
          onClick={() => setActiveTab('services')}
        >
          Services
        </button>
      </nav>

      {activeTab === 'jobs' && (
        <div className="jobs-section">
          <h2>Available Jobs</h2>

          <div className="jobs-controls">
            <button
              className="create-job-btn"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'Cancel' : 'Post a New Job'}
            </button>
          </div>

          {showCreateForm && (
            <div className="create-job-form">
              <h3>Create New Job</h3>
              <form onSubmit={handleSubmitJob}>
                <input
                  type="text"
                  name="title"
                  placeholder="Job Title"
                  value={newJobForm.title}
                  onChange={handleInputChange}
                  required
                />
                <textarea
                  name="description"
                  placeholder="Job Description"
                  value={newJobForm.description}
                  onChange={handleInputChange}
                  required
                />
                <select
                  name="serviceId"
                  value={newJobForm.serviceId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  name="homeownerId"
                  placeholder="Homeowner ID"
                  value={newJobForm.homeownerId}
                  onChange={handleInputChange}
                  required
                />
                <button type="submit">Submit Job</button>
              </form>
            </div>
          )}

          {/* Category filter */}
          <div className="category-filter">
            <label htmlFor="category-select">Filter by category:</label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {filteredJobs.length === 0 ? (
            <p className="no-jobs">No jobs available at the moment.</p>
          ) : (
            <div className="jobs-list">
              {filteredJobs.map(job => {
                const service = services.find(s => s.id === job.service_id);
                return (
                  <div key={job.id} className="job-card">
                    <h3>{job.title}</h3>
                    <p className="job-description">{job.description}</p>
                    <div className="job-details">
                      <span className="job-service">Service: {service ? service.name : 'Unknown'}</span>
                      <span className="job-status">Status: {job.status}</span>
                    </div>
                    <p className="job-location">Location: {job.location}</p>
                    <p className="job-date">Posted: {new Date(job.created_at).toLocaleDateString()}</p>
                    <div className="job-budget">
                      Budget: ${job.budget_min?.toFixed(2) || '0.00'} - ${job.budget_max?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'services' && (
        <div className="services-section">
          <h2>Our Services</h2>
          {services.length === 0 ? (
            <p>No services available at the moment.</p>
          ) : (
            <div className="services-grid">
              {services.map(service => (
                <div key={service.id} className="service-card">
                  <h3>{service.name}</h3>
                  <p className="service-description">{service.description}</p>
                  <div className="service-details">
                    <span className="service-category">Category: {service.category}</span>
                    <span className="service-status">Status: {service.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;