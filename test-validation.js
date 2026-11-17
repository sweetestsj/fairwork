// Test script to verify validation behavior
const { login } = require('./backend/controllers/authController');

// Mock request object for testing
const mockReq = {
  body: {
    email: '',
    password: ''
  }
};

// Mock response object
const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('Response:', data);
    return data;
  }
};

// Test the validation logic
console.log('Testing login with empty email and password...');
// This should return "Email and password are required"