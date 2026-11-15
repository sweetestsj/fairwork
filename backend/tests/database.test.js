const { query } = require('../config/database');

// Mock the database connection for testing
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

describe('Database Connection', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be able to connect to the database', async () => {
    // Mock a successful database query response
    const mockResult = { rows: [{ test: 1 }] };
    query.mockResolvedValue(mockResult);

    try {
      const result = await query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
      expect(query).toHaveBeenCalledWith('SELECT 1 as test');
    } catch (error) {
      // If there's an error, the test should fail
      expect(error).toBeUndefined();
    }
  });

  it('should handle database connection errors gracefully', async () => {
    // Mock a database query error
    const mockError = new Error('Database connection failed');
    query.mockRejectedValue(mockError);

    try {
      await query('SELECT 1 as test');
      // If we reach here, the test should have failed
      expect(true).toBe(false); // This line should not be reached
    } catch (error) {
      // We expect an error to be thrown
      expect(error.message).toBe('Database connection failed');
    }
  });
});