const express = require('express');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * GET /api/payments
 * List all payments populated with subscription (with service), client.
 * Supports filters: clientId, subscriptionId, startDate, endDate.
 * Sorted by paymentDate descending.
 */
router.get('/', async (req, res, next) => {
  try {
    const { clientId, subscriptionId, startDate, endDate } = req.query;
    const filter = {};

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      filter.clientId = new mongoose.Types.ObjectId(clientId);
    }

    if (subscriptionId && mongoose.Types.ObjectId.isValid(subscriptionId)) {
      filter.subscriptionId = new mongoose.Types.ObjectId(subscriptionId);
    }

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) {
        filter.paymentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    }

    const payments = await Payment.find(filter)
      .populate('clientId')
      .populate({
        path: 'subscriptionId',
        populate: { path: 'serviceId' },
      })
      .sort({ paymentDate: -1 })
      .lean();

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments
 * Create a payment. Validates amount > 0.
 * Checks that total payments don't exceed subscription totalPrice.
 * Prevents duplicate submissions with idempotency check.
 */
router.post('/', async (req, res, next) => {
  try {
    const { subscriptionId, clientId, paymentDate, paymentMethod, notes } = req.body;
    const amount = Number(req.body.amount);

    // Validate references
    if (!subscriptionId || !mongoose.Types.ObjectId.isValid(subscriptionId)) {
      return res.status(400).json({
        success: false,
        message: 'Abonnement invalide ou non spécifié.',
      });
    }

    if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Client invalide ou non spécifié.',
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être supérieur à 0.',
      });
    }

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Abonnement introuvable.',
      });
    }

    // Verify clientId matches the subscription
    if (subscription.clientId.toString() !== clientId) {
      return res.status(400).json({
        success: false,
        message: 'Le client ne correspond pas à l\'abonnement.',
      });
    }

    // Calculate existing total paid
    const existingPayments = await Payment.aggregate([
      { $match: { subscriptionId: new mongoose.Types.ObjectId(subscriptionId) } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const currentTotal = existingPayments.length > 0 ? existingPayments[0].total : 0;
    const newTotal = Math.round((currentTotal + amount) * 1000) / 1000;

    if (newTotal > Math.round(subscription.totalPrice * 1000) / 1000) {
      const maxAllowed = Math.round((subscription.totalPrice - currentTotal) * 1000) / 1000;
      return res.status(400).json({
        success: false,
        message: `Le montant dépasse le reste à payer. Maximum autorisé : ${maxAllowed} TND.`,
      });
    }

    // Idempotency check: prevent duplicate payment within 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const duplicatePayment = await Payment.findOne({
      subscriptionId: new mongoose.Types.ObjectId(subscriptionId),
      clientId: new mongoose.Types.ObjectId(clientId),
      amount,
      paymentMethod: paymentMethod || 'Espèces',
      createdAt: { $gte: thirtySecondsAgo },
    });

    if (duplicatePayment) {
      return res.status(409).json({
        success: false,
        message: 'Un paiement identique a déjà été enregistré récemment. Veuillez patienter.',
      });
    }

    const payment = await Payment.create({
      subscriptionId,
      clientId,
      amount,
      paymentDate: paymentDate || new Date(),
      paymentMethod: paymentMethod || 'Espèces',
      notes: notes || '',
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('clientId')
      .populate({
        path: 'subscriptionId',
        populate: { path: 'serviceId' },
      })
      .lean();

    res.status(201).json({
      success: true,
      message: 'Paiement enregistré avec succès.',
      data: populatedPayment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/payments/:id
 * Update payment (amount, paymentDate, paymentMethod, notes).
 * Re-validates total.
 */
router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant paiement invalide.',
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement introuvable.',
      });
    }

    const { paymentDate, paymentMethod, notes } = req.body;
    const amount = req.body.amount === undefined ? undefined : Number(req.body.amount);

    // If amount is being changed, validate total
    if (amount !== undefined) {
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Le montant doit être supérieur à 0.',
        });
      }

      const subscription = await Subscription.findById(payment.subscriptionId);

      if (subscription) {
        // Sum all payments EXCEPT the current one
        const otherPayments = await Payment.aggregate([
          {
            $match: {
              subscriptionId: payment.subscriptionId,
              _id: { $ne: payment._id },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const otherTotal = otherPayments.length > 0 ? otherPayments[0].total : 0;
        const newTotal = Math.round((otherTotal + amount) * 1000) / 1000;

        if (newTotal > Math.round(subscription.totalPrice * 1000) / 1000) {
          const maxAllowed = Math.round((subscription.totalPrice - otherTotal) * 1000) / 1000;
          return res.status(400).json({
            success: false,
            message: `Le montant dépasse le reste à payer. Maximum autorisé : ${maxAllowed} TND.`,
          });
        }
      }

      payment.amount = amount;
    }

    if (paymentDate !== undefined) payment.paymentDate = paymentDate;
    if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
    if (notes !== undefined) payment.notes = notes;

    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('clientId')
      .populate({
        path: 'subscriptionId',
        populate: { path: 'serviceId' },
      })
      .lean();

    res.json({
      success: true,
      message: 'Paiement mis à jour avec succès.',
      data: populatedPayment,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
