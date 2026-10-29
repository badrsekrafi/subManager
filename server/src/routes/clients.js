const express = require('express');
const mongoose = require('mongoose');
const Client = require('../models/Client');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * GET /api/clients
 * List all non-archived clients with aggregated subscription/payment data.
 * Supports ?search= query param (searches firstName, lastName, phone).
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, showArchived } = req.query;

    const filter = {};

    if (showArchived !== 'true') {
      filter.archived = false;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phone: searchRegex },
      ];
    }

    const clients = await Client.find(filter).sort({ createdAt: -1 }).lean();

    // Aggregate subscription and payment data for each client
    const clientIds = clients.map((c) => c._id);

    const [subscriptionAgg, paymentAgg, lastActivityAgg] = await Promise.all([
      // Subscription counts and total billed
      Subscription.aggregate([
        { $match: { clientId: { $in: clientIds }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: '$clientId',
            subscriptionCount: { $sum: 1 },
            totalBilled: { $sum: '$totalPrice' },
          },
        },
      ]),
      // Total paid per client
      Payment.aggregate([
        { $match: { clientId: { $in: clientIds } } },
        {
          $group: {
            _id: '$clientId',
            totalPaid: { $sum: '$amount' },
          },
        },
      ]),
      // Last activity per client (latest payment or subscription)
      Payment.aggregate([
        { $match: { clientId: { $in: clientIds } } },
        {
          $group: {
            _id: '$clientId',
            lastPayment: { $max: '$paymentDate' },
          },
        },
      ]),
    ]);

    // Build lookup maps
    const subMap = {};
    for (const item of subscriptionAgg) {
      subMap[item._id.toString()] = item;
    }

    const payMap = {};
    for (const item of paymentAgg) {
      payMap[item._id.toString()] = item;
    }

    const activityMap = {};
    for (const item of lastActivityAgg) {
      activityMap[item._id.toString()] = item;
    }

    // Enrich clients with aggregated data
    const enrichedClients = clients.map((client) => {
      const cid = client._id.toString();
      const sub = subMap[cid] || { subscriptionCount: 0, totalBilled: 0 };
      const pay = payMap[cid] || { totalPaid: 0 };
      const activity = activityMap[cid] || { lastPayment: null };

      const totalBilled = Math.round(sub.totalBilled * 1000) / 1000;
      const totalPaid = Math.round(pay.totalPaid * 1000) / 1000;
      const remaining = Math.round((totalBilled - totalPaid) * 1000) / 1000;

      return {
        ...client,
        fullName: `${client.firstName} ${client.lastName}`,
        subscriptionCount: sub.subscriptionCount,
        totalBilled,
        totalPaid,
        remaining: Math.max(0, remaining),
        lastActivity: activity.lastPayment || client.updatedAt || client.createdAt,
      };
    });

    res.json({
      success: true,
      count: enrichedClients.length,
      data: enrichedClients,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients
 * Create a new client.
 */
router.post('/', async (req, res, next) => {
  try {
    const { firstName, lastName, phone, notes } = req.body;

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le prénom est requis.',
      });
    }

    if (!lastName || !lastName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le nom est requis.',
      });
    }

    const client = await Client.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone ? phone.trim() : '',
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès.',
      data: client,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id
 * Get a single client with all subscriptions and payments.
 */
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant client invalide.',
      });
    }

    const client = await Client.findById(req.params.id).lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client introuvable.',
      });
    }

    const [subscriptions, payments] = await Promise.all([
      Subscription.find({ clientId: client._id })
        .populate('serviceId')
        .sort({ createdAt: -1 })
        .lean(),
      Payment.find({ clientId: client._id })
        .populate({
          path: 'subscriptionId',
          populate: { path: 'serviceId' },
        })
        .sort({ paymentDate: -1 })
        .lean(),
    ]);

    // Compute payment info for each subscription
    const paymentsBySubscription = {};
    for (const payment of payments) {
      const subId = payment.subscriptionId?._id?.toString() || payment.subscriptionId?.toString();
      if (!paymentsBySubscription[subId]) {
        paymentsBySubscription[subId] = [];
      }
      paymentsBySubscription[subId].push(payment);
    }

    const enrichedSubscriptions = subscriptions.map((sub) => {
      const subPayments = paymentsBySubscription[sub._id.toString()] || [];
      const totalPaid = subPayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, Math.round((sub.totalPrice - totalPaid) * 1000) / 1000);

      let paymentStatus = 'Impayé';
      if (remaining <= 0) {
        paymentStatus = 'Payé';
      } else if (totalPaid > 0) {
        paymentStatus = 'Partiellement payé';
      }

      return {
        ...sub,
        totalPaid: Math.round(totalPaid * 1000) / 1000,
        remaining,
        paymentStatus,
        payments: subPayments,
      };
    });

    client.fullName = `${client.firstName} ${client.lastName}`;

    res.json({
      success: true,
      data: {
        client,
        subscriptions: enrichedSubscriptions,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/clients/:id
 * Update client fields.
 */
router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant client invalide.',
      });
    }

    const { firstName, lastName, phone, notes } = req.body;
    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (notes !== undefined) updateData.notes = notes;

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client introuvable.',
      });
    }

    res.json({
      success: true,
      message: 'Client mis à jour avec succès.',
      data: client,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/clients/:id/archive
 * Toggle archived status of a client.
 */
router.patch('/:id/archive', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant client invalide.',
      });
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client introuvable.',
      });
    }

    client.archived = !client.archived;
    await client.save();

    const statusLabel = client.archived ? 'archivé' : 'désarchivé';

    res.json({
      success: true,
      message: `Client ${statusLabel} avec succès.`,
      data: client,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
