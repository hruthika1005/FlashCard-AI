const jwt = require('jsonwebtoken');

/**
 * Signs a JWT containing the user's id. Expiry is controlled via
 * the JWT_EXPIRES_IN environment variable (defaults to 7 days).
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
