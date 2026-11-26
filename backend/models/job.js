// Job model for FairWork marketplace

class Job {
  constructor(db) {
    this.db = db;
  }

  // Get all jobs with optional filtering and sorting
  async getAllJobs(filters = {}, sortOrder = 'j.created_at DESC', distanceFilter = {}) {
    let query = `
      SELECT j.id, j.title, j.description, s.category, j.created_at,
             j.updated_at, j.status, u.name as provider_name, j.budget,
             j.location
      FROM jobs j
      JOIN users u ON j.homeowner_id = u.id
      JOIN services s ON j.service_id = s.id
    `;

    let params = [];
    let paramIndex = 1;
    let hasWhereClause = false;

    // Add status filter if provided
    if (filters.status) {
      query += ` WHERE j.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
      hasWhereClause = true;
    } else {
      // Default to open jobs only if no status filter is specified
      if (!hasWhereClause) {
        query += ` WHERE j.status = 'open'`;
        hasWhereClause = true;
      }
    }

    // Filter by category
    if (filters.category) {
      if (!hasWhereClause) {
        query += ` WHERE s.category ILIKE $${paramIndex}`;
        hasWhereClause = true;
      } else {
        query += ` AND s.category ILIKE $${paramIndex}`;
      }
      params.push(`%${filters.category}%`);
      paramIndex++;
    }

    // Filter by minimum price
    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      if (!hasWhereClause) {
        query += ` WHERE j.budget >= $${paramIndex}`;
        hasWhereClause = true;
      } else {
        query += ` AND j.budget >= $${paramIndex}`;
      }
      params.push(filters.minPrice);
      paramIndex++;
    }

    // Filter by maximum price
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      if (!hasWhereClause) {
        query += ` WHERE j.budget <= $${paramIndex}`;
        hasWhereClause = true;
      } else {
        query += ` AND j.budget <= $${paramIndex}`;
      }
      params.push(filters.maxPrice);
      paramIndex++;
    }

    // Filter by date posted
    if (filters.datePosted) {
      const date = new Date(filters.datePosted);
      if (!hasWhereClause) {
        query += ` WHERE DATE(j.created_at) = $${paramIndex}`;
        hasWhereClause = true;
      } else {
        query += ` AND DATE(j.created_at) = $${paramIndex}`;
      }
      params.push(date.toISOString().split('T')[0]);
      paramIndex++;
    }

    // Add distance filter if provided
    if (distanceFilter.distance && distanceFilter.lat && distanceFilter.lng) {
      // Validate that location data exists in jobs table before filtering
      if (!hasWhereClause) {
        query += ` WHERE j.location IS NOT NULL`;
        hasWhereClause = true;
      } else {
        query += ` AND j.location IS NOT NULL`;
      }

      // Add distance calculation and filtering using PostGIS or Haversine formula
      // For simplicity, we'll use the Haversine formula to calculate distance in miles
      const haversineQuery = `
        SELECT *,
               (3959 * acos(
                 cos(radians($${paramIndex})) *
                 cos(radians(j.location->>'lat'::numeric)) *
                 cos(radians(j.location->>'lng'::numeric) - radians($${paramIndex + 1})) +
                 sin(radians($${paramIndex})) *
                 sin(radians(j.location->>'lat'::numeric))
               )) AS distance
        FROM jobs j
        JOIN users u ON j.homeowner_id = u.id
        JOIN services s ON j.service_id = s.id
        WHERE j.status = 'open'
        AND j.location IS NOT NULL
        AND (3959 * acos(
          cos(radians($${paramIndex})) *
          cos(radians(j.location->>'lat'::numeric)) *
          cos(radians(j.location->>'lng'::numeric) - radians($${paramIndex + 1})) +
          sin(radians($${paramIndex})) *
          sin(radians(j.location->>'lat'::numeric))
        )) <= $${paramIndex + 2}
      `;

      // Replace the entire query with distance-based one
      query = haversineQuery;

      // Add parameters for distance calculation
      params.push(distanceFilter.lat, distanceFilter.lng, distanceFilter.distance);
      paramIndex += 3;
    }

    // If no distance filter was applied, continue with standard ordering
    if (!distanceFilter.distance || !distanceFilter.lat || !distanceFilter.lng) {
      query += ` ORDER BY ${sortOrder}`;
    }

    try {
      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching jobs: ${error.message}`);
    }
  }

  // Get job by ID
  async getJobById(id) {
    const query = `
      SELECT j.id, j.title, j.description, s.category, j.created_at,
             j.updated_at, j.status, u.name as provider_name
      FROM jobs j
      JOIN users u ON j.homeowner_id = u.id
      JOIN services s ON j.service_id = s.id
      WHERE j.id = $1 AND j.status = 'open'
    `;

    try {
      const result = await this.db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error fetching job: ${error.message}`);
    }
  }

  // Create a new job
  async createJob(jobData) {
    const { title, description, serviceId, homeownerId } = jobData;

    const query = `
      INSERT INTO jobs (title, description, service_id, homeowner_id, status)
      VALUES ($1, $2, $3, $4, 'open')
      RETURNING id, title, description, created_at, updated_at
    `;

    try {
      const result = await this.db.query(query, [title, description, serviceId, homeownerId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating job: ${error.message}`);
    }
  }

  // Update a job
  async updateJob(id, jobData) {
    const { title, description, serviceId } = jobData;

    const query = `
      UPDATE jobs
      SET title = $1, description = $2, service_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND status = 'open'
      RETURNING id, title, description, created_at, updated_at
    `;

    try {
      const result = await this.db.query(query, [title, description, serviceId, id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating job: ${error.message}`);
    }
  }

  // Delete a job
  async deleteJob(id) {
    const query = `
      UPDATE jobs
      SET status = 'cancelled'
      WHERE id = $1 AND status = 'open'
    `;

    try {
      await this.db.query(query, [id]);
      return true;
    } catch (error) {
      throw new Error(`Error deleting job: ${error.message}`);
    }
  }
}

module.exports = Job;