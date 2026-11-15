describe('Database Connection', () => {
  // Skip database test in this environment as we don't have proper Docker setup
  // The actual connection is tested by the server startup and integration tests

  test('should be able to import database config', async () => {
    const db = require('../config/database');
    expect(db).toBeDefined();
  });

  test('should be able to import controllers and routes', async () => {
    // Test that all required modules can be imported
    const usersController = require('../controllers/users.controller');
    const servicesController = require('../controllers/services.controller');
    const jobsController = require('../controllers/jobs.controller');
    const quotesController = require('../controllers/quotes.controller');
    const reviewsController = require('../controllers/reviews.controller');
    const prosController = require('../controllers/pros.controller');

    expect(usersController).toBeDefined();
    expect(servicesController).toBeDefined();
    expect(jobsController).toBeDefined();
    expect(quotesController).toBeDefined();
    expect(reviewsController).toBeDefined();
    expect(prosController).toBeDefined();
  });
});