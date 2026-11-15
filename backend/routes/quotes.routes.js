const express = require('express');
const router = express.Router();
const quotesController = require('../controllers/quotes.controller');

// Quote routes
router.get('/', quotesController.getQuotes);
router.get('/job/:job_id', quotesController.getQuotesByJob);
router.get('/pro/:pro_id', quotesController.getQuotesByPro);
router.post('/job/:job_id/pro/:pro_id', quotesController.submitQuote);
router.put('/:id', quotesController.updateQuote);
router.delete('/:id', quotesController.deleteQuote);

module.exports = router;