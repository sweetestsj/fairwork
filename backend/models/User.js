const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async createUser(userData) {
    const { name, email, password, role } = userData;

    try {
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user - this will throw a constraint violation if email already exists
      const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
        [name, email, hashedPassword, role]
      );

      return result.rows[0];
    } catch (error) {
      // Check for unique violation error (PostgreSQL specific)
      if (error.code === '23505') {
        throw new Error('A user with this email already exists');
      }

      // If it's a different kind of database error, re-throw the original error
      throw error;
    }
  }

  // Find user by email
  static async findUserByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  // Validate user credentials
  static async validateUserCredentials(email, password) {
    try {
      const user = await this.findUserByEmail(email);

      if (!user) {
        return null;
      }

      // Compare password hash
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return null;
      }

      // Remove password hash from returned user object
      const { password_hash, ...userWithoutHash } = user;
      return userWithoutHash;
    } catch (error) {
      throw new Error(`Failed to validate credentials: ${error.message}`);
    }
  }

  // Get user by ID
  static async getUserById(id) {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Validate user data
  static validateUserData(userData) {
    const { name, email, password, role } = userData;

    if (!name || name.trim() === '') {
      throw new Error('Name is required');
    }

    if (!email || email.trim() === '') {
      throw new Error('Email is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (!role || (role !== 'homeowner' && role !== 'pro')) {
      throw new Error('Role must be either "homeowner" or "pro"');
    }
  }
}

module.exports = User;