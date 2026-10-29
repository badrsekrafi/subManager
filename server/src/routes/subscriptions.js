const express = require('express');
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Client = require('../models/Client');
const Service = require('../models/Service');
const auth = require('../middleware/auth');
const updateStatuses = require('../utils/updateStatuses');
const { subscriptionInput } = require('../utils/subscriptionInput');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Validate both documents before writing; undo the new subscription if its
// initial payment cannot be persisted, including on standalone local MongoDB.
async function saveWithInitialPayment(subscription, values, notes) {
  const payment = values.initialPayment > 0 ? new Payment({
    subscriptionId: subscription._id,
    clientId: subscription.clientId,
    amount: values.initialPayment,
    paymentDate: values.purchaseDate,
    paymentMethod: values.paymentMethod,
    notes,
  }) : null;
  await subscription.validate();
  if (payment) await payment.validate();
  await subscription.save();
  if (payment) {
    try {
      await payment.save();
    } catch (error) {
      await Subscription.deleteOne({ _id: subscription._id });
      throw error;
    }
  }
  return payment;
}

/**
 * Helper: enrich a subscription with payment data.
 */
const enrichSubscription = async (subscription) => {
  const sub = subscription.toObject ? subscription.toObject() : { ...subscription };

  const payments = await Payment.find({ subscriptionId: sub._id }).lean();
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const roundedTotalPaid = Math.round(totalPaid * 1000) / 1000;
  const remaining = Math.max(0, Math.round((sub.totalPrice - totalPaid) * 1000) / 1000);

  let paymentStatus = 'Impayé';
  if (remaining <= 0) {
    paymentStatus = 'Payé';
  } else if (roundedTotalPaid > 0) {
    paymentStatus = 'Partiellement payé';
  }

  return {
    ...sub,
    totalPaid: roundedTotalPaid,
    remaining,
    paymentStatus,
  };
};

/**
 * GET /api/subscriptions
 * List all subscriptions populated with client and service.
 * Supports filters: serviceId, status, clientId, duration.
 */
router.get('/', async (req, res, next) => {
  try {
    await updateStatuses();
    const { serviceId, status, clientId, duration } = req.query;
    const filter = {};

    if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
      filter.serviceId = serviceId;
    }
    if (status) {
      filter.status = status;
    }
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      filter.clientId = clientId;
    }
    if (duration) {
      filter['duration.value'] = parseInt(duration, 10);
    }

    const subscriptions = await Subscription.find(filter)
      .populate('clientId')
      .populate('serviceId')
      .populate('renewalOf')
      .sort({ createdAt: -1 })
      .lean();

    // Batch enrich with payment data
    const subscriptionIds = subscriptions.map((s) => s._id);
    const paymentAgg = await Payment.aggregate([
      { $match: { subscriptionId: { $in: subscriptionIds } } },
      {
        $group: {
          _id: '$subscriptionId',
          totalPaid: { $sum: '$amount' },
        },
      },
    ]);

    const payMap = {};
    for (const item of paymentAgg) {
      payMap[item._id.toString()] = item.totalPaid;
    }

    const enrichedSubscriptions = subscriptions.map((sub) => {
      const totalPaid = Math.round((payMap[sub._id.toString()] || 0) * 1000) / 1000;
      const remaining = Math.max(0, Math.round((sub.totalPrice - totalPaid) * 1000) / 1000);

      let paymentStatus = 'Impayé';
      if (remaining <= 0) {
        paymentStatus = 'Payé';
      } else if (totalPaid > 0) {
        paymentStatus = 'Partiellement payé';
      }

      return {
        ...sub,
        totalPaid,
        remaining,
        paymentStatus,
      };
    });

    res.json({
      success: true,
      count: enrichedSubscriptions.length,
      data: enrichedSubscriptions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/subscriptions
 * Create a subscription. If initialPayment > 0, create a Payment record too.
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      clientId,
      serviceId,
      purchaseDate,
      startDate,
      duration,
      quantity,
      unitPrice,
      unitCost,
      notes,
      initialPayment,
      paymentMethod,
    } = req.body;

    // Validate references
    if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Client invalide ou non spécifié.',
      });
    }

    if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Service invalide ou non spécifié.',
      });
    }

    const [client, service] = await Promise.all([
      Client.findById(clientId),
      Service.findById(serviceId),
    ]);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client introuvable.',
      });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service introuvable.',
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'La date de début est requise.',
      });
    }

    const values = subscriptionInput(req.body);
    if (client.archived) return res.status(400).json({ success: false, message: 'Ce client est archivé.' });
    if (!service.active) return res.status(400).json({ success: false, message: 'Ce service est désactivé.' });
    if (!values.duration.value || values.duration.value < 1) {
      return res.status(400).json({
        success: false,
        message: 'La durée doit être d\'au moins 1 mois.',
      });
    }

    if (unitPrice === undefined || unitPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix unitaire est requis et doit être positif.',
      });
    }

    const subscription = new Subscription({
      clientId,
      serviceId,
      purchaseDate: purchaseDate || new Date(),
      startDate,
      ...values,
      notes: notes || '',
      expirationDate: new Date(), // will be calculated by pre-save
      totalPrice: 0, // will be calculated by pre-save
    });

    const payment = await saveWithInitialPayment(subscription, values, 'Paiement initial');

    const populatedSub = await Subscription.findById(subscription._id)
      .populate('clientId')
      .populate('serviceId')
      .lean();

    const enriched = {
      ...populatedSub,
      totalPaid: payment ? payment.amount : 0,
      remaining: payment
        ? Math.max(0, Math.round((populatedSub.totalPrice - payment.amount) * 1000) / 1000)
        : populatedSub.totalPrice,
      paymentStatus: populatedSub.totalPrice === 0 ? 'Payé' : payment
        ? payment.amount >= populatedSub.totalPrice
          ? 'Payé'
          : 'Partiellement payé'
        : 'Impayé',
    };

    res.status(201).json({
      success: true,
      message: 'Abonnement créé avec succès.',
      data: { subscription: enriched, payment },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/subscriptions/:id
 * Get a single subscription with all payments, client, service.
 */
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant abonnement invalide.',
      });
    }

    const subscription = await Subscription.findById(req.params.id)
      .populate('clientId')
      .populate('serviceId')
      .populate('renewalOf');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Abonnement introuvable.',
      });
    }

    const enriched = await enrichSubscription(subscription);

    const payments = await Payment.find({ subscriptionId: subscription._id })
      .sort({ paymentDate: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        subscription: enriched,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/subscriptions/:id
 * Update subscription fields (not payments).
 */
router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant abonnement invalide.',
      });
    }

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Abonnement introuvable.',
      });
    }

    const {
      serviceId,
      purchaseDate,
      startDate,
      duration,
      quantity,
      unitPrice,
      unitCost,
      notes,
      status,
    } = req.body;

    const values = subscriptionInput({ ...req.body, initialPayment: 0 }, subscription.toObject());
    const paid = await Payment.aggregate([
      { $match: { subscriptionId: subscription._id } },
      { $group: { _id: null, amount: { $sum: '$amount' } } },
    ]);
    if (values.totalPrice < (paid[0]?.amount || 0)) return res.status(400).json({ success: false, message: 'Le total ne peut pas être inférieur au montant déjà encaissé.' });
    if (serviceId !== undefined && !await Service.exists({ _id: serviceId })) return res.status(400).json({ success: false, message: 'Service introuvable.' });

    if (serviceId !== undefined) subscription.serviceId = serviceId;
    if (purchaseDate !== undefined) subscription.purchaseDate = purchaseDate;
    if (startDate !== undefined) subscription.startDate = startDate;
    if (duration !== undefined) subscription.duration = typeof duration === 'number' ? { value: duration, unit: 'months' } : duration;
    if (quantity !== undefined) subscription.quantity = quantity;
    if (unitPrice !== undefined) subscription.unitPrice = unitPrice;
    if (unitCost !== undefined) subscription.unitCost = unitCost;
    if (notes !== undefined) subscription.notes = notes;
    if (status !== undefined) subscription.status = status;
    Object.assign(subscription, {
      duration: values.duration, quantity: values.quantity, unitPrice: values.unitPrice,
      unitCost: values.unitCost, purchaseDate: values.purchaseDate, startDate: values.startDate,
    });

    await subscription.save(); // pre-save recalculates expirationDate & totalPrice

    const populated = await Subscription.findById(subscription._id)
      .populate('clientId')
      .populate('serviceId');

    const enriched = await enrichSubscription(populated);

    res.json({
      success: true,
      message: 'Abonnement mis à jour avec succès.',
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/subscriptions/:id/renew
 * Create a NEW subscription linked to the old one via renewalOf.
 */
router.post('/:id/renew', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant abonnement invalide.',
      });
    }

    const originalSubscription = await Subscription.findById(req.params.id);

    if (!originalSubscription) {
      return res.status(404).json({
        success: false,
        message: 'Abonnement original introuvable.',
      });
    }

    const {
      duration,
      unitPrice,
      quantity,
      startDate,
      initialPayment,
      paymentMethod,
      notes,
    } = req.body;

    const requestedStartDate = startDate ? new Date(startDate) : new Date();
    if (Number.isNaN(requestedStartDate.getTime())) return res.status(400).json({ success: false, message: 'La date de début est invalide.' });
    const renewalStartDate = new Date(Math.max(requestedStartDate.getTime(), originalSubscription.expirationDate.getTime()));
    const values = subscriptionInput({ ...req.body, startDate: renewalStartDate, purchaseDate: new Date() }, {
      duration: originalSubscription.duration,
      quantity: originalSubscription.quantity,
      unitPrice: originalSubscription.unitPrice,
      unitCost: originalSubscription.unitCost,
    });

    const newSubscription = new Subscription({
      clientId: originalSubscription.clientId,
      serviceId: originalSubscription.serviceId,
      ...values,
      notes: notes || '',
      renewalOf: originalSubscription._id,
      expirationDate: new Date(), // calculated by pre-save
      totalPrice: 0, // calculated by pre-save
    });

    const payment = await saveWithInitialPayment(newSubscription, values, 'Paiement initial - Renouvellement');

    const populated = await Subscription.findById(newSubscription._id)
      .populate('clientId')
      .populate('serviceId')
      .populate('renewalOf')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Abonnement renouvelé avec succès.',
      data: { subscription: populated, payment },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/subscriptions/:id/cancel
 * Cancel a subscription.
 */
router.patch('/:id/cancel', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant abonnement invalide.',
      });
    }

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Abonnement introuvable.',
      });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cet abonnement est déjà annulé.',
      });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    const populated = await Subscription.findById(subscription._id)
      .populate('clientId')
      .populate('serviceId');

    res.json({
      success: true,
      message: 'Abonnement annulé avec succès.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
