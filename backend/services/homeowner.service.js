const { query } = require('../config/database');

// Get all homeowners
const getAllHomeowners = async () => {
  const result = await query(`
    SELECT h.*, u.email, u.first_name, u.last_name, u.phone, u.address
    FROM homeowners h
    JOIN users u ON h.user_id = u.id
    ORDER BY h.created_at DESC
  `);
  return result.rows;
};

// Get homeowner by ID
const getHomeownerById = async (id) => {
  const result = await query(`
    SELECT h.*, u.email, u.first_name, u.last_name, u.phone, u.address
    FROM homeowners h
    JOIN users u ON h.user_id = u.id
    WHERE h.user_id = $1
  `, [id]);

  return result.rows[0];
};

// Get homeowner by user ID (used for checking if a user is already a homeowner)
const getHomeownerByUserId = async (user_id) => {
  const result = await query('SELECT * FROM homeowners WHERE user_id = $1', [user_id]);
  return result.rows[0];
};

module.exports = {
  getAllHomeowners,
  getHomeownerById,
  getHomeownerByUserId
};