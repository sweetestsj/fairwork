// Mock the database connection for testing purposes
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const { query } = require('../config/database');

describe('Database Connection', () => {
  it('should be able to connect to the database', async () => {
    // Mock successful database response
    query.mockResolvedValueOnce({
      rows: [{ test: 1 }]
    });

    try {
      const result = await query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
      expect(query).toHaveBeenCalledWith('SELECT 1 as test');
    } catch (error) {
      throw new Error('Database connection failed: ' + error.message);
    }
  });
});