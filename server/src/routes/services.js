const express = require('express');
const mongoose = require('mongoose');
const Service = require('../models/Service');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * GET /api/services
 * List all services.
 */
router.get('/', async (req, res, next) => {
  try {
    const services = await Service.find().sort({ name: 1 }).lean();

    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/services
 * Create a new service.
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du service est requis.',
      });
    }

    const service = await Service.create({
      name: name.trim(),
      icon: icon || 'Package',
    });

    res.status(201).json({
      success: true,
      message: 'Service créé avec succès.',
      data: service,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/services/:id
 * Update service fields.
 */
router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant service invalide.',
      });
    }

    const { name, icon, active } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (icon !== undefined) updateData.icon = icon;
    if (active !== undefined) updateData.active = active;

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service introuvable.',
      });
    }

    res.json({
      success: true,
      message: 'Service mis à jour avec succès.',
      data: service,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
