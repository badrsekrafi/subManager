const rateLimit = require('express-rate-limit');

/**
 * Login rate limiter: max 5 attempts per 15 minutes per IP.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
});

/**
 * General API rate limiter: max 200 requests per 15 minutes.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    message: 'Trop de requêtes. Veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
});

module.exports = { loginLimiter, apiLimiter };
