const { query } = require('../config/database');

class JobService {
  // Get all jobs with additional details (join with users, services)
  static async getAllJobs() {
    const result = await query(`
      SELECT
        j.id,
        j.homeowner_id,
        j.service_id,
        j.title,
        j.description,
        j.budget_min,
        j.budget_max,
        j.location,
        j.status,
        j.created_at,
        j.updated_at,
        s.name as service_name,
        s.description as service_description,
        h.first_name as homeowner_first_name,
        h.last_name as homeowner_last_name,
        h.email as homeowner_email
      FROM jobs j
      LEFT JOIN services s ON j.service_id = s.id
      LEFT JOIN homeowners h ON j.homeowner_id = h.user_id
      ORDER BY j.created_at DESC
    `);

    return result.rows;
  }

  // Get job by ID with additional details
  static async getJobById(id) {
    const result = await query(`
      SELECT
        j.id,
        j.homeowner_id,
        j.service_id,
        j.title,
        j.description,
        j.budget_min,
        j.budget_max,
        j.location,
        j.status,
        j.created_at,
        j.updated_at,
        s.name as service_name,
        s.description as service_description,
        h.first_name as homeowner_first_name,
        h.last_name as homeowner_last_name,
        h.email as homeowner_email
      FROM jobs j
      LEFT JOIN services s ON j.service_id = s.id
      LEFT JOIN homeowners h ON j.homeowner_id = h.user_id
      WHERE j.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Create a new job
  static async createJob(jobData) {
    const {
      homeowner_id,
      service_id,
      title,
      description,
      budget_min,
      budget_max,
      location,
      status = 'open'
    } = jobData;

    const result = await query(
      `INSERT INTO jobs (homeowner_id, service_id, title, description, budget_min, budget_max, location, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [homeowner_id, service_id, title, description, budget_min, budget_max, location, status]
    );

    return result.rows[0];
  }

  // Update job
  static async updateJob(id, jobData) {
    const {
      homeowner_id,
      service_id,
      title,
      description,
      budget_min,
      budget_max,
      location,
      status
    } = jobData;

    const result = await query(
      `UPDATE jobs SET
         homeowner_id=$1,
         service_id=$2,
         title=$3,
         description=$4,
         budget_min=$5,
         budget_max=$6,
         location=$7,
         status=$8,
         updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [homeowner_id, service_id, title, description, budget_min, budget_max, location, status, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Delete job
  static async deleteJob(id) {
    const result = await query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return false;
    }

    return true;
  }

  // Get jobs by homeowner with additional details
  static async getJobsByHomeowner(homeownerId) {
    const result = await query(`
      SELECT
        j.id,
        j.homeowner_id,
        j.service_id,
        j.title,
        j.description,
        j.budget_min,
        j.budget_max,
        j.location,
        j.status,
        j.created_at,
        j.updated_at,
        s.name as service_name,
        s.description as service_description
      FROM jobs j
      LEFT JOIN services s ON j.service_id = s.id
      WHERE j.homeowner_id = $1
      ORDER BY j.created_at DESC
    `, [homeownerId]);

    return result.rows;
  }

  // Get jobs by status
  static async getJobsByStatus(status) {
    const result = await query(`
      SELECT
        j.id,
        j.homeowner_id,
        j.service_id,
        j.title,
        j.description,
        j.budget_min,
        j.budget_max,
        j.location,
        j.status,
        j.created_at,
        j.updated_at,
        s.name as service_name,
        s.description as service_description,
        h.first_name as homeowner_first_name,
        h.last_name as homeowner_last_name
      FROM jobs j
      LEFT JOIN services s ON j.service_id = s.id
      LEFT JOIN homeowners h ON j.homeowner_id = h.user_id
      WHERE j.status = $1
      ORDER BY j.created_at DESC
    `, [status]);

    return result.rows;
  }

  // Get available jobs (open status)
  static async getAvailableJobs() {
    const result = await query(`
      SELECT
        j.id,
        j.homeowner_id,
        j.service_id,
        j.title,
        j.description,
        j.budget_min,
        j.budget_max,
        j.location,
        j.status,
        j.created_at,
        j.updated_at,
        s.name as service_name,
        s.description as service_description,
        h.first_name as homeowner_first_name,
        h.last_name as homeowner_last_name
      FROM jobs j
      LEFT JOIN services s ON j.service_id = s.id
      LEFT JOIN homeowners h ON j.homeowner_id = h.user_id
      WHERE j.status = 'open'
      ORDER BY j.created_at DESC
    `);

    return result.rows;
  }

  // Update job status
  static async updateJobStatus(id, status) {
    const result = await query(
      'UPDATE jobs SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }
}

module.exports = JobService;