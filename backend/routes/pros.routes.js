const express = require('express');
const router = express.Router();
const prosController = require('../controllers/pros.controller');

// Pro routes
router.get('/', prosController.getPros);
router.get('/:id', prosController.getProById);
router.get('/user/:user_id', prosController.getProByUserId);
router.post('/', prosController.createPro);
router.put('/:user_id', prosController.updatePro);
router.put('/verify/:user_id', prosController.verifyPro);
router.delete('/:user_id', prosController.deletePro);

module.exports = router;