const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * JWT authentication middleware.
 * Extracts token from httpOnly cookie named 'token',
 * verifies it, and attaches the admin document to req.admin.
 */
const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Veuillez vous connecter.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expirée. Veuillez vous reconnecter.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token invalide. Veuillez vous reconnecter.',
      });
    }

    const admin = await Admin.findById(decoded.id).select('-passwordHash');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Administrateur introuvable. Veuillez vous reconnecter.',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = auth;
