const { query } = require('../config/database');
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
      const result = await query(
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
      const result = await query(
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
      const result = await query(
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

  // Update user profile
  static async updateUserProfile(userId, profileData) {
    try {
      const { name, email, phone, address, role } = profileData;

      // Build dynamic query for updating user profile
      let queryStr = 'UPDATE users SET name = $1';
      const params = [name];
      let paramIndex = 2;

      if (email) {
        queryStr += `, email = $${paramIndex++}`;
        params.push(email);
      }

      if (phone) {
        queryStr += `, phone = $${paramIndex++}`;
        params.push(phone);
      }

      if (address) {
        queryStr += `, address = $${paramIndex++}`;
        params.push(address);
      }

      if (role) {
        queryStr += `, role = $${paramIndex++}`;
        params.push(role);
      }

      queryStr += ` WHERE id = $${paramIndex} RETURNING id, name, email, phone, address, role, created_at`;
      params.push(userId);

      const result = await query(queryStr, params);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  // Get service preferences for a user
  static async getServicePreferences(userId) {
    try {
      const result = await query(
        `SELECT s.id, s.name, s.description
         FROM services s
         JOIN user_service_preferences usp ON s.id = usp.service_id
         WHERE usp.user_id = $1`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get service preferences: ${error.message}`);
    }
  }

  // Update service preferences for a user
  static async updateServicePreferences(userId, serviceIds) {
    try {
      // First, delete existing preferences
      await query('DELETE FROM user_service_preferences WHERE user_id = $1', [userId]);

      // Then insert new preferences
      if (serviceIds.length > 0) {
        const values = serviceIds.map((id, index) => `($1, $${index + 2})`).join(',');
        const params = [userId, ...serviceIds];

        await query(
          `INSERT INTO user_service_preferences (user_id, service_id) VALUES ${values}`,
          params
        );
      }

      // Return updated preferences
      return await this.getServicePreferences(userId);
    } catch (error) {
      throw new Error(`Failed to update service preferences: ${error.message}`);
    }
  }

  // Get pro credentials
  static async getProCredentials(userId) {
    try {
      const result = await query(
        'SELECT business_name, license_number, insurance_documents FROM pros WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get pro credentials: ${error.message}`);
    }
  }

  // Update pro credentials
  static async updateProCredentials(userId, credentialsData) {
    try {
      const { businessName, licenseNumber, insuranceDocuments } = credentialsData;

      // Check if pro record exists, if not create it
      let result = await query(
        'SELECT user_id FROM pros WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Create new pro record
        result = await query(
          'INSERT INTO pros (user_id, business_name, license_number, insurance_documents) VALUES ($1, $2, $3, $4) RETURNING user_id',
          [userId, businessName, licenseNumber, insuranceDocuments]
        );
      } else {
        // Update existing pro record
        result = await query(
          'UPDATE pros SET business_name = $2, license_number = $3, insurance_documents = $4 WHERE user_id = $1 RETURNING user_id',
          [userId, businessName, licenseNumber, insuranceDocuments]
        );
      }

      // Return updated credentials
      return await this.getProCredentials(userId);
    } catch (error) {
      throw new Error(`Failed to update pro credentials: ${error.message}`);
    }
  }

  // Get additional pro information
  static async getProInfo(userId) {
    try {
      const result = await query(
        'SELECT business_name, license_number FROM pros WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get pro info: ${error.message}`);
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