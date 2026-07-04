const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs after express-validator's chain of checks (body(), param(), etc.)
 * has been attached to a route. Collects any validation failures and
 * forwards them as a single 400 ApiError.
 *
 * Usage: router.post('/x', [body('email').isEmail()], validate, handler)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => e.msg);
    return next(ApiError.badRequest('Validation failed', formatted));
  }
  next();
};

module.exports = validate;
