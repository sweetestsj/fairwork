const { query } = require('../config/database');

// Get all pros
const getAllPros = async () => {
  const result = await query(`
    SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
    FROM pros p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.rating DESC, p.completed_jobs DESC
  `);
  return result.rows;
};

// Get pro by ID
const getProById = async (id) => {
  const result = await query(`
    SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
    FROM pros p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = $1
  `, [id]);

  return result.rows[0];
};

// Get verified pros
const getVerifiedPros = async () => {
  const result = await query(`
    SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
    FROM pros p
    JOIN users u ON p.user_id = u.id
    WHERE p.verified = true
    ORDER BY p.rating DESC, p.completed_jobs DESC
  `);
  return result.rows;
};

// Get pro by user ID (used for checking if a user is already a pro)
const getProByUserId = async (user_id) => {
  const result = await query('SELECT * FROM pros WHERE user_id = $1', [user_id]);
  return result.rows[0];
};

// Update pro verification status
const updateProVerification = async (pro_id, verified) => {
  const result = await query(
    'UPDATE pros SET verified=$1 WHERE user_id=$2 RETURNING *',
    [verified, pro_id]
  );
  return result.rows[0];
};

// Update pro rating and completed jobs
const updateProRating = async (pro_id, rating, completed_jobs) => {
  const result = await query(
    'UPDATE pros SET rating=$1, completed_jobs=$2 WHERE user_id=$3 RETURNING *',
    [rating, completed_jobs, pro_id]
  );
  return result.rows[0];
};

module.exports = {
  getAllPros,
  getProById,
  getVerifiedPros,
  getProByUserId,
  updateProVerification,
  updateProRating
};