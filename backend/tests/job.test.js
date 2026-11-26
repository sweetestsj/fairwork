// Simple test for job functionality - focusing on basic structure and route precedence
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const request = require('supertest');
const express = require('express');
const db = require('../config/database');

describe('Jobs API', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  // This test just verifies that the files exist and have correct structure
  it('should have all required job-related files', () => {
    const fs = require('fs');
    const path = require('path');

    // Check if required files exist
    const requiredFiles = [
      'models/job.js',
      'controllers/jobController.js',
      'routes/jobs.js'
    ];

    requiredFiles.forEach(filePath => {
      const fullPath = path.join(__dirname, '../', filePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });

  it('should have correct job model structure', () => {
    const Job = require('../models/job');
    expect(typeof Job).toBe('function');
  });

  it('should have correct job controller structure', () => {
    const JobController = require('../controllers/jobController');
    expect(typeof JobController).toBe('function');
  });

  it('should have correct routes structure', () => {
    const jobsRouter = require('../routes/jobs');
    // Check that it's a router function with expected methods
    expect(jobsRouter).toBeDefined();
    expect(typeof jobsRouter).toBe('function');
    // The routes file exports an express router which is a function with get, post, etc.
    expect(jobsRouter.get).toBeDefined();
    expect(jobsRouter.post).toBeDefined();
    expect(jobsRouter.put).toBeDefined();
    expect(jobsRouter.delete).toBeDefined();
  });

  it('should route GET /api/jobs/category/:category without shadowing GET /api/jobs/:id', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/jobs', require('../routes/jobs'));

    // Category lookup hits getJobsByCategory (ILIKE category query)
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'job-1', title: 'Driveway wash', category: 'Exterior Cleaning' }]
    });

    const catRes = await request(app)
      .get('/api/jobs/category/Exterior')
      .expect(200);

    expect(catRes.body).toEqual({
      success: true,
      count: 1,
      data: [{ id: 'job-1', title: 'Driveway wash', category: 'Exterior Cleaning' }]
    });
    expect(db.query.mock.calls[0][0]).toMatch(/s\.category ILIKE \$1/i);

    // ID lookup hits getJobById (WHERE j.id = $1)
    const jobId = '12345678-1234-1234-1234-123456789012';
    db.query.mockResolvedValueOnce({
      rows: [{ id: jobId, title: 'Driveway wash', status: 'open' }]
    });

    const idRes = await request(app)
      .get(`/api/jobs/${jobId}`)
      .expect(200);

    expect(idRes.body).toEqual({
      success: true,
      data: { id: jobId, title: 'Driveway wash', status: 'open' }
    });
    expect(db.query.mock.calls[1][0]).toMatch(/WHERE j\.id = \$1/i);
    expect(db.query.mock.calls[1][1]).toEqual([jobId]);
  });
});