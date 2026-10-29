/**
 * Global error handler middleware.
 * Handles Mongoose validation, duplicate key, and cast errors.
 * Returns JSON error responses with appropriate status codes.
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur interne du serveur';
  let errors = null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const fieldErrors = {};
    for (const field of Object.keys(err.errors)) {
      fieldErrors[field] = err.errors[field].message;
    }
    message = 'Erreur de validation des données';
    errors = fieldErrors;
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyValue || {})[0];
    const duplicateValue = err.keyValue ? err.keyValue[duplicateField] : '';
    message = `La valeur "${duplicateValue}" existe déjà pour le champ "${duplicateField}"`;
  }

  // Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Valeur invalide pour le champ "${err.path}" : ${err.value}`;
  }

  // JWT errors (fallback – primary handling is in auth middleware)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré';
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('[ErrorHandler]', err);
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
