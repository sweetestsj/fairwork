const { initializeDatabase } = require('./init');

// Mock database query function to test error handling
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

describe('Database Initialization', () => {
  const mockQuery = require('../config/database').query;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize database tables successfully', async () => {
    mockQuery.mockResolvedValueOnce(); // users table
    mockQuery.mockResolvedValueOnce(); // pros table
    mockQuery.mockResolvedValueOnce(); // homeowners table
    mockQuery.mockResolvedValueOnce(); // services table
    mockQuery.mockResolvedValueOnce(); // jobs table
    mockQuery.mockResolvedValueOnce(); // quotes table
    mockQuery.mockResolvedValueOnce(); // reviews table

    await expect(initializeDatabase()).resolves.not.toThrow();
  });

  it('should handle schema mismatch error by dropping and recreating pros table', async () => {
    // Mock the first call to succeed (users table)
    mockQuery.mockResolvedValueOnce();

    // Mock the pros table creation to fail with incompatible types error
    const schemaError = new Error('foreign key constraint cannot be implemented');
    schemaError.detail = 'Key columns "user_id" and "id" are of incompatible types: uuid and integer.';
    schemaError.code = '42804';

    mockQuery.mockRejectedValueOnce(schemaError);

    // Mock the subsequent calls to succeed (drop table, recreate table)
    mockQuery.mockResolvedValueOnce(); // DROP TABLE pros
    mockQuery.mockResolvedValueOnce(); // CREATE TABLE pros

    // Mock remaining tables to succeed
    mockQuery.mockResolvedValueOnce(); // homeowners table
    mockQuery.mockResolvedValueOnce(); // services table
    mockQuery.mockResolvedValueOnce(); // jobs table
    mockQuery.mockResolvedValueOnce(); // quotes table
    mockQuery.mockResolvedValueOnce(); // reviews table

    await expect(initializeDatabase()).resolves.not.toThrow();
  });

  it('should rethrow non-schema mismatch errors', async () => {
    const genericError = new Error('Database connection failed');
    genericError.code = 'ECONNREFUSED';

    mockQuery.mockRejectedValueOnce(genericError);

    await expect(initializeDatabase()).rejects.toThrow('Database connection failed');
  });
});