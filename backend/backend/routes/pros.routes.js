const express = require('express');
const router = express.Router();
const prosController = require('../controllers/pros.controller');

// Pro routes
router.get('/', prosController.getPros);
router.get('/:id', prosController.getProById);
router.get('/verified/:verified', prosController.getProsByVerification);
router.post('/', prosController.createPro);
router.put('/:id', prosController.updatePro);
router.put('/:id/verify', prosController.verifyPro);
router.delete('/:id', prosController.deletePro);
router.get('/top-rated', prosController.getTopRatedPros);
router.get('/service/:service_id', prosController.getProsByService);

module.exports = router;