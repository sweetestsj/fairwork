// Mock database connection for tests

const mockQuery = jest.fn();

// Mock the entire module
module.exports = {
  query: mockQuery,
};