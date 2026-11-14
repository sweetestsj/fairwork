const { query } = require('../config/database');

describe('Database Connection', () => {
  it('should be able to connect to the database', async () => {
    try {
      const result = await query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    } catch (error) {
      fail('Database connection failed: ' + error.message);
    }
  });
});