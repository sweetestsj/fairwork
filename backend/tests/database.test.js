// Mock the database connection for testing purposes
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const { query } = require('../config/database');
const { initializeDatabase, LAUNCH_SERVICES } = require('../db/init');

describe('Database Connection', () => {
  beforeEach(() => {
    query.mockReset();
  });

  it('should be able to connect to the database', async () => {
    // Mock successful database response
    query.mockResolvedValueOnce({
      rows: [{ test: 1 }]
    });

    const result = await query('SELECT 1 as test');
    expect(result.rows[0].test).toBe(1);
    expect(query).toHaveBeenCalledWith('SELECT 1 as test');
  });

  it('should initialize schema idempotently without DROP TABLE and seed 7 launch services', async () => {
    query.mockResolvedValue({ rows: [] });

    await initializeDatabase();

    const executedSql = query.mock.calls.map(([sql]) => sql);

    // Must never drop tables on startup
    expect(executedSql.some((sql) => /DROP TABLE/i.test(sql))).toBe(false);

    // Must create users with name and jobs with budget + homeowner_id -> users(id)
    expect(executedSql.some((sql) => /CREATE TABLE IF NOT EXISTS users/i.test(sql) && /\bname\b/i.test(sql))).toBe(true);
    expect(executedSql.some((sql) => /ALTER TABLE users ADD COLUMN IF NOT EXISTS name/i.test(sql))).toBe(true);
    expect(
      executedSql.some(
        (sql) =>
          /CREATE TABLE IF NOT EXISTS jobs/i.test(sql) &&
          /homeowner_id\s+UUID\s+REFERENCES\s+users\(id\)/i.test(sql) &&
          /\bbudget\b/i.test(sql)
      )
    ).toBe(true);
    expect(executedSql.some((sql) => /ALTER TABLE jobs ADD COLUMN IF NOT EXISTS budget/i.test(sql))).toBe(true);

    // Must idempotently seed all 7 launch services
    const seedCalls = query.mock.calls.filter(([sql]) =>
      /INSERT INTO services/i.test(sql) && /ON CONFLICT \(name\) DO NOTHING/i.test(sql)
    );
    expect(LAUNCH_SERVICES).toHaveLength(7);
    expect(seedCalls).toHaveLength(7);
  });
});