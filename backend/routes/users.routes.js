const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');

// User routes
router.get('/', usersController.getUsers);
router.get('/:id', usersController.getUserById);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

// Authentication routes
router.post('/login', usersController.login);
router.post('/register', usersController.register);

module.exports = router;