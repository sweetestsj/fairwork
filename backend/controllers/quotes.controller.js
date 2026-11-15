const { query } = require('../config/database');

// Get all quotes
exports.getQuotes = async (req, res) => {
  try {
    const result = await query('SELECT * FROM quotes ORDER BY submitted_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting quotes:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get quote by ID
exports.getQuoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM quotes WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting quote:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get quotes by job
exports.getQuotesByJob = async (req, res) => {
  try {
    const { job_id } = req.params;
    const result = await query('SELECT * FROM quotes WHERE job_id = $1 ORDER BY submitted_at DESC', [job_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting quotes by job:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get quotes by pro
exports.getQuotesByPro = async (req, res) => {
  try {
    const { pro_id } = req.params;
    const result = await query('SELECT * FROM quotes WHERE pro_id = $1 ORDER BY submitted_at DESC', [pro_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting quotes by pro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new quote
exports.createQuote = async (req, res) => {
  try {
    const { job_id, pro_id, amount, description } = req.body;

    const result = await query(
      'INSERT INTO quotes (job_id, pro_id, amount, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [job_id, pro_id, amount, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating quote:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update quote
exports.updateQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { job_id, pro_id, amount, description } = req.body;

    const result = await query(
      'UPDATE quotes SET job_id = $1, pro_id = $2, amount = $3, description = $4, submitted_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [job_id, pro_id, amount, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating quote:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete quote
exports.deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM quotes WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};