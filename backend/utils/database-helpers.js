// Database helper functions for common operations

/**
 * Helper to validate UUID format
 */
exports.isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Helper to get user by ID with role validation
 */
exports.getUserByIdWithRole = async (query, userId, requiredRole) => {
  const result = await query(
    'SELECT * FROM users WHERE id = $1 AND role = $2',
    [userId, requiredRole]
  );

  return result.rows[0];
};

/**
 * Helper to check if a user exists
 */
exports.userExists = async (query, userId) => {
  const result = await query('SELECT id FROM users WHERE id = $1', [userId]);
  return result.rows.length > 0;
};

/**
 * Helper to get service by ID
 */
exports.getServiceById = async (query, serviceId) => {
  const result = await query('SELECT * FROM services WHERE id = $1', [serviceId]);
  return result.rows[0];
};

/**
 * Helper to get job by ID with validation
 */
exports.getJobByIdWithValidation = async (query, jobId, userId = null) => {
  let queryText;
  let queryParams;

  if (userId) {
    // Check if the job belongs to the user or if user is a pro who submitted a quote
    queryText = `
      SELECT j.*, u.first_name as homeowner_first_name, u.last_name as homeowner_last_name
      FROM jobs j
      JOIN homeowners h ON j.homeowner_id = h.user_id
      JOIN users u ON h.user_id = u.id
      WHERE j.id = $1 AND (j.homeowner_id = $2 OR EXISTS (
        SELECT 1 FROM quotes q WHERE q.job_id = j.id AND q.pro_id = $2
      ))
    `;
    queryParams = [jobId, userId];
  } else {
    queryText = `
      SELECT j.*, u.first_name as homeowner_first_name, u.last_name as homeowner_last_name
      FROM jobs j
      JOIN homeowners h ON j.homeowner_id = h.user_id
      JOIN users u ON h.user_id = u.id
      WHERE j.id = $1
    `;
    queryParams = [jobId];
  }

  const result = await query(queryText, queryParams);
  return result.rows[0];
};