// Shared error handling utility for controllers
const errorHandler = (res, error, defaultMessage = 'An unknown error occurred') => {
  // Ensure error.message is properly handled to prevent null reference
  const errorMessage = error && typeof error.message === 'string' ? error.message : defaultMessage;

  // Handle database-related errors specifically
  if (error && error.message && typeof error.message === 'string' && error.message.includes('database')) {
    return res.status(500).json({
      success: false,
      message: errorMessage
    });
  }

  // Default to 500 for other errors
  res.status(500).json({
    success: false,
    message: errorMessage
  });
};

module.exports = errorHandler;