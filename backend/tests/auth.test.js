const jwt = require('jsonwebtoken');

// Hermetic in-memory mock for ../config/database so auth tests run without external Postgres
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

    throw new Error(`Unhandled mock SQL query in auth.test.js: ${normalized}`);
  });

  return {
    query: mockQuery,
    __resetMockStore: () => {
      users.length = 0;
      mockQuery.mockClear();
    },
  };
});

const request = require('supertest');
const app = require('../server');
const db = require('../config/database');

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    db.__resetMockStore();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully and include name in JWT', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'homeowner'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('name', userData.name);
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('role', userData.role);
      expect(response.body).toHaveProperty('token');

      const decoded = jwt.decode(response.body.token);
      expect(decoded).toMatchObject({
        id: response.body.user.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      });
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'homeowner'
      };

      // Register first user
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'User already exists');
    });

    it('should not register user with invalid data', async () => {
      const invalidUserData = {
        name: '',
        email: 'invalid-email',
        password: '123',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidUserData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Registration failed');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully with valid credentials', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'homeowner'
      };

      // Register a user first
      await request(app)
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      const loginData = {
        email: registerData.email,
        password: registerData.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', registerData.email);
      expect(response.body).toHaveProperty('token');

      const decoded = jwt.decode(response.body.token);
      expect(decoded).toMatchObject({
        name: registerData.name,
        email: registerData.email,
        role: registerData.role,
      });
    });

    it('should not login user with invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should not login user without required fields', async () => {
      const loginData = {
        email: '',
        password: ''
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });
  });

  describe('POST /auth/logout', () => {
    it('should handle logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should require authentication token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should reject invalid authentication token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should load fresh user profile from database via canonical and legacy routes', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Denton Homeowner',
          email: 'homeowner@example.com',
          password: 'password123',
          role: 'homeowner',
        })
        .expect(201);

      const originalToken = registerResponse.body.token;
      const userId = registerResponse.body.user.id;

      // Update profile in DB, then verify GET with the original token returns fresh DB state
      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${originalToken}`)
        .send({ name: 'Updated Homeowner' })
        .expect(200);

      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${originalToken}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('message', 'Profile retrieved successfully');
      expect(profileResponse.body.user).toMatchObject({
        id: userId,
        name: 'Updated Homeowner',
        email: 'homeowner@example.com',
        role: 'homeowner',
      });
      expect(profileResponse.body.user).not.toHaveProperty('password_hash');

      // Legacy /auth/profile alias should also resolve cleanly without double nesting
      const legacyResponse = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${originalToken}`)
        .expect(200);

      expect(legacyResponse.body.user).toMatchObject({
        id: userId,
        name: 'Updated Homeowner',
      });
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should require authentication token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'No Auth' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should update user name and email and return refreshed JWT with name', async () => {
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

      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Pro',
          email: 'updated@example.com',
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('message', 'Profile updated successfully');
      expect(updateResponse.body.user).toMatchObject({
        id: registerResponse.body.user.id,
        name: 'Updated Pro',
        email: 'updated@example.com',
        role: 'pro',
      });
      expect(updateResponse.body).toHaveProperty('token');

      const decoded = jwt.decode(updateResponse.body.token);
      expect(decoded).toMatchObject({
        id: registerResponse.body.user.id,
        name: 'Updated Pro',
        email: 'updated@example.com',
        role: 'pro',
      });
    });

    it('should return 400 when neither name nor email is provided', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'homeowner',
        })
        .expect(201);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${registerResponse.body.token}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty(
        'error',
        'At least one of name or email must be provided for update'
      );
    });

    it('should return 400 for invalid email format', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'homeowner',
        })
        .expect(201);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${registerResponse.body.token}`)
        .send({ email: 'not-an-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid email format');
    });

    it('should return 409 when updating to an email already used by another account', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'First User',
          email: 'first@example.com',
          password: 'password123',
          role: 'homeowner',
        })
        .expect(201);

      const secondUser = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'second@example.com',
          password: 'password123',
          role: 'pro',
        })
        .expect(201);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${secondUser.body.token}`)
        .send({ email: 'first@example.com' })
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Email already in use');
    });
  });
});