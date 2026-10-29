const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate admin with email and password, set httpOnly JWT cookie.
 */
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'L\'email et le mot de passe sont requis.',
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.',
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.',
      });
    }

    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const adminData = admin.toJSON();

    res.json({
      success: true,
      message: 'Connexion réussie.',
      data: {
        admin: adminData,
        mustChangePassword: admin.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Clear the JWT cookie.
 */
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({
    success: true,
    message: 'Déconnexion réussie.',
  });
});

/**
 * GET /api/auth/me
 * Return the currently authenticated admin.
 */
router.get('/me', auth, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { admin: req.admin },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/profile
 * Update admin name and email.
 */
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrateur introuvable.',
      });
    }

    if (name !== undefined) admin.name = name.trim();

    if (email !== undefined) {
      const trimmedEmail = email.toLowerCase().trim();
      const existingAdmin = await Admin.findOne({
        email: trimmedEmail,
        _id: { $ne: admin._id },
      });
      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message: 'Cette adresse email est déjà utilisée.',
        });
      }
      admin.email = trimmedEmail;
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès.',
      data: { admin: admin.toJSON() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/password
 * Change admin password. Requires currentPassword, newPassword, confirmPassword.
 */
router.put('/password', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs de mot de passe sont requis.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe et la confirmation ne correspondent pas.',
      });
    }

    // Fetch admin WITH passwordHash for comparison
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrateur introuvable.',
      });
    }

    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Le mot de passe actuel est incorrect.',
      });
    }

    admin.passwordHash = newPassword; // pre-save hook will hash it
    admin.mustChangePassword = false;
    await admin.save();

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
