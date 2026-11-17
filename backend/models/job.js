// Job model for FairWork marketplace

class Job {
  constructor(db) {
    this.db = db;
  }

  // Get all jobs with optional filtering by service category and sorting
  async getAllJobs(category = null, sort = 'date') {
    let query = `
      SELECT j.id, j.title, j.description, s.category, j.created_at,
             j.updated_at, j.status, u.name as provider_name, j.budget
      FROM jobs j
      JOIN users u ON j.homeowner_id = u.id
      JOIN services s ON j.service_id = s.id
      WHERE j.status = 'open'
    `;

    let params = [];

    if (category) {
      query += ` AND s.category = $1`;
      params.push(category);
    }

    // Apply sorting based on the sort parameter
    switch (sort) {
      case 'budget':
        query += ` ORDER BY j.budget DESC`;
        break;
      case 'category':
        query += ` ORDER BY s.category`;
        break;
      case 'date':
      default:
        query += ` ORDER BY j.created_at DESC`;
        break;
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