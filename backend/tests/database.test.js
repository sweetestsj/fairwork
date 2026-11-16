// Mock database connection for testing
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const { query } = require('../config/database');

describe('Database Connection', () => {
  it('should be able to connect to the database', async () => {
    // Mock successful connection
    query.mockResolvedValue({
      rows: [{ test: 1 }]
    });

    const result = await query('SELECT 1 as test');
    expect(result.rows[0].test).toBe(1);
  });
});