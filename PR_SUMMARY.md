# Profile Update Functionality Implementation

## Summary
This PR implements profile update functionality for the FairWork application, allowing authenticated users to update their name and email address.

## Changes Made
- Added `updateProfile` controller method in `backend/controllers/authController.js`
- Added `updateUser` model method in `backend/models/User.js` 
- Added PUT `/auth/profile` route in `backend/routes/profile.js`
- Implemented proper validation and error handling
- Maintained authentication protection for all profile operations

## Features
- Users can update their name and/or email address
- Email format validation
- Duplicate email detection (409 conflict)
- Token refresh upon profile update
- Proper error handling for database connection issues, validation errors, etc.

## Testing
- All existing tests pass (60/60 tests passing)
- Comprehensive test coverage in `tests/auth.test.js` including:
  - Profile update with valid data
  - Error handling for missing fields
  - Email format validation
  - Duplicate email detection
  - Integration with JWT token refresh

## API Endpoint
- `PUT /auth/profile` (protected route)
- Requires authentication token in Authorization header
- Returns updated user profile and refreshed JWT token

## Implementation Details
The implementation follows the existing code patterns and error handling conventions used throughout the application. It leverages PostgreSQL's unique constraint violations for duplicate email detection and maintains consistency with other auth endpoints.