const request = require('supertest');
const app = require('../server');
const db = require('../config/database');

// Hermetic in-memory mock for database so tests run without external Postgres
jest.mock('../config/database', () => {
  const { randomUUID } = require('crypto');
  const users = [];

  const mockQuery = jest.fn(async (sql, params = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim();

    // INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING ...
    if (/^INSERT INTO users\b/i.test(normalized)) {
      const [name, email, password_hash, role] = params;
      if (users.some((u) => u.email === email)) {
        const err = new Error('duplicate key value violates unique constraint "users_email_key"');
        err.code = '23505';
        throw err;
      }

      const newUser = {
        id: randomUUID(),
        name,
        email,
        password_hash,
        role,
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      return {
        rows: [
          {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            created_at: newUser.created_at,
          },
        ],
      };
    }

    // SELECT ... FROM users WHERE email = $1
    if (/^SELECT\b.*\bFROM users WHERE email = \$1$/i.test(normalized)) {
      const [email] = params;
      const found = users.find((u) => u.email === email);
      return { rows: found ? [{ ...found }] : [] };
    }

    // SELECT ... FROM users WHERE id = $1
    if (/^SELECT\b.*\bFROM users WHERE id = \$1$/i.test(normalized)) {
      const [id] = params;
      const found = users.find((u) => u.id === id);
      if (!found) {
        return { rows: [] };
      }
      return {
        rows: [
          {
            id: found.id,
            name: found.name,
            email: found.email,
            role: found.role,
            created_at: found.created_at,
          },
        ],
      };
    }

    // UPDATE users SET ... WHERE id = $N RETURNING ...
    const updateMatch = normalized.match(/^UPDATE users SET (.+) WHERE id = \$(\d+)\b/i);
    if (updateMatch) {
      const setClause = updateMatch[1];
      const idParamIdx = parseInt(updateMatch[2], 10) - 1;
      const userId = params[idParamIdx];
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return { rows: [] };
      }

      const updates = {};
      for (const assignment of setClause.split(',')) {
        const match = assignment.trim().match(/^(\w+)\s*=\s*\$(\d+)$/);
        if (match) {
          updates[match[1]] = params[parseInt(match[2], 10) - 1];
        }
      }

      if (
        updates.email !== undefined &&
        users.some((u) => u.id !== userId && u.email === updates.email)
      ) {
        const err = new Error('duplicate key value violates unique constraint "users_email_key"');
        err.code = '23505';
        throw err;
      }

      Object.assign(user, updates);
      return {
        rows: [
          {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
          },
        ],
      };
    }

    // DELETE FROM users WHERE email = $1
    if (/^DELETE FROM users WHERE email = \$1$/i.test(normalized)) {
      const [email] = params;
      const idx = users.findIndex((u) => u.email === email);
      if (idx !== -1) {
        users.splice(idx, 1);
      }
      return { rows: [] };
    }

    throw new Error(`Unhandled mock SQL query in profile-update.test.js: ${normalized}`);
  });

  return {
    query: mockQuery,
    __resetMockStore: () => {
      users.length = 0;
      mockQuery.mockClear();
    },
  };
});

describe('Profile Update Functionality', () => {
  beforeEach(() => {
    db.__resetMockStore();
  });

  it('should update user profile successfully with name and email changes', async () => {
    // First register a user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Original Name',
        email: 'original@example.com',
        password: 'password123',
        role: 'pro',
      })
      .expect(201);

    const token = registerResponse.body.token;
    const userId = registerResponse.body.user.id;

    // Update the user profile
    const updateResponse = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Pro',
        email: 'updated@example.com',
      })
      .expect(200);

    // Verify the response structure
    expect(updateResponse.body).toHaveProperty('message', 'Profile updated successfully');
    expect(updateResponse.body.user).toMatchObject({
      id: userId,
      name: 'Updated Pro',
      email: 'updated@example.com',
      role: 'pro',
    });
    expect(updateResponse.body).toHaveProperty('token');

    // Verify the token was refreshed with new information
    const decoded = require('jsonwebtoken').decode(updateResponse.body.token);
    expect(decoded).toMatchObject({
      id: userId,
      name: 'Updated Pro',
      email: 'updated@example.com',
      role: 'pro',
    });
  });

  it('should update only name when only name is provided', async () => {
    // Register a user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Original Name',
        email: 'original@example.com',
        password: 'password123',
        role: 'homeowner',
      })
      .expect(201);

    const token = registerResponse.body.token;

    // Update only the name
    const updateResponse = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
      })
      .expect(200);

    expect(updateResponse.body.user).toMatchObject({
      name: 'Updated Name',
      email: 'original@example.com',
    });
  });

  it('should update only email when only email is provided', async () => {
    // Register a user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Original Name',
        email: 'original@example.com',
        password: 'password123',
        role: 'homeowner',
      })
      .expect(201);

    const token = registerResponse.body.token;

    // Update only the email
    const updateResponse = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'updated@example.com',
      })
      .expect(200);

    expect(updateResponse.body.user).toMatchObject({
      name: 'Original Name',
      email: 'updated@example.com',
    });
  });

  it('should reject update when neither name nor email is provided', async () => {
    // Register a user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'homeowner',
      })
      .expect(201);

    const token = registerResponse.body.token;

    // Try to update without providing any fields
    const response = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty(
      'error',
      'At least one of name or email must be provided for update'
    );
  });

  it('should reject update when invalid email format is provided', async () => {
    // Register a user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'homeowner',
      })
      .expect(201);

    const token = registerResponse.body.token;

    // Try to update with invalid email format
    const response = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'invalid-email' })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid email format');
  });
});