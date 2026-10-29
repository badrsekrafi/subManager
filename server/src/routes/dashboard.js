const express = require('express');
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Client = require('../models/Client');
const auth = require('../middleware/auth');
const updateStatuses = require('../utils/updateStatuses');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * GET /api/dashboard/stats
 * Return all dashboard statistics.
 */
router.get('/stats', async (req, res, next) => {
  try {
    // Update subscription statuses before computing stats
    await updateStatuses();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalClients,
      activeSubscriptions,
      expiredSubscriptions,
      expiringSoon,
      monthlyRevenueAgg,
      totalRevenueAgg,
      unpaidAgg,
    ] = await Promise.all([
      // Total non-archived clients
      Client.countDocuments({ archived: false }),

      // Active subscriptions (active or expiring_soon)
      Subscription.countDocuments({ status: { $in: ['active', 'expiring_soon'] } }),

      // Expired subscriptions
      Subscription.countDocuments({ status: 'expired' }),

      // Expiring soon (within 7 days)
      Subscription.countDocuments({
        status: { $in: ['active', 'expiring_soon'] },
        expirationDate: { $gt: now, $lte: sevenDaysFromNow },
      }),

      // Monthly revenue (sum of payments in current month)
      Payment.aggregate([
        {
          $match: {
            paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Total revenue (sum of all payments)
      Payment.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Total unpaid across all non-cancelled subscriptions
      Subscription.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $lookup: {
            from: 'payments',
            localField: '_id',
            foreignField: 'subscriptionId',
            as: 'payments',
          },
        },
        {
          $project: {
            totalPrice: 1,
            totalPaid: { $sum: '$payments.amount' },
          },
        },
        {
          $project: {
            remaining: {
              $max: [0, { $subtract: ['$totalPrice', '$totalPaid'] }],
            },
          },
        },
        { $group: { _id: null, totalUnpaid: { $sum: '$remaining' } } },
      ]),
    ]);

    const monthlyRevenue = monthlyRevenueAgg.length > 0
      ? Math.round(monthlyRevenueAgg[0].total * 1000) / 1000
      : 0;

    const totalRevenue = totalRevenueAgg.length > 0
      ? Math.round(totalRevenueAgg[0].total * 1000) / 1000
      : 0;

    const totalUnpaid = unpaidAgg.length > 0
      ? Math.round(unpaidAgg[0].totalUnpaid * 1000) / 1000
      : 0;

    res.json({
      success: true,
      data: {
        totalClients,
        activeSubscriptions,
        expiredSubscriptions,
        expiringSoon,
        monthlyRevenue,
        totalRevenue,
        totalUnpaid,
        remainingToCollect: totalUnpaid,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/revenue?year=2026
 * Monthly revenue for given year. Aggregate payments by month.
 * Returns array of 12 objects {month: 'Jan', revenue: number}.
 */
router.get('/revenue', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const revenueAgg = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
    ];

    // Build lookup for quick access
    const revenueMap = {};
    for (const item of revenueAgg) {
      revenueMap[item._id] = Math.round(item.revenue * 1000) / 1000;
    }

    const monthlyData = monthNames.map((month, index) => ({
      month,
      revenue: revenueMap[index + 1] || 0,
    }));

    res.json({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/expiring
 * Subscriptions expiring within 30 days, sorted by expirationDate asc.
 * Includes client and service data plus daysRemaining calculation.
 */
router.get('/expiring', async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscriptions = await Subscription.find({
      status: { $in: ['active', 'expiring_soon'] },
      expirationDate: { $gt: now, $lte: thirtyDaysFromNow },
    })
      .populate('clientId')
      .populate('serviceId')
      .sort({ expirationDate: 1 })
      .lean();

    const enriched = subscriptions.map((sub) => {
      const expirationMs = new Date(sub.expirationDate).getTime();
      const nowMs = now.getTime();
      const daysRemaining = Math.max(0, Math.ceil((expirationMs - nowMs) / (1000 * 60 * 60 * 24)));

      return {
        ...sub,
        daysRemaining,
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/recent-payments
 * Last 10 payments with client and service data.
 */
router.get('/recent-payments', async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('clientId')
      .populate({
        path: 'subscriptionId',
        populate: { path: 'serviceId' },
      })
      .sort({ paymentDate: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/service-distribution
 * Distribution of active subscriptions by service.
 */
router.get('/service-distribution', async (req, res, next) => {
  try {
    const distribution = await Subscription.aggregate([
      { $match: { status: { $in: ['active', 'expiring_soon'] } } },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: '$service' },
      {
        $group: {
          _id: '$service.name',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const formatted = distribution.map((d) => ({
      name: d._id,
      value: d.count,
      totalValue: Math.round(d.totalValue * 1000) / 1000,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/unpaid
 * Subscriptions that are not fully paid (remaining > 0) and not cancelled.
 */
router.get('/unpaid', async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ status: { $ne: 'cancelled' } })
      .populate('clientId')
      .populate('serviceId')
      .sort({ createdAt: -1 })
      .lean();

    const subIds = subscriptions.map((s) => s._id);
    const paymentAgg = await Payment.aggregate([
      { $match: { subscriptionId: { $in: subIds } } },
      {
        $group: {
          _id: '$subscriptionId',
          totalPaid: { $sum: '$amount' },
        },
      },
    ]);

    const payMap = {};
    for (const p of paymentAgg) {
      payMap[p._id.toString()] = p.totalPaid;
    }

    const unpaidSubs = [];
    const clientIdsWithDebt = new Set();
    let totalRemainingToCollect = 0;

    for (const sub of subscriptions) {
      const totalPaid = Math.round((payMap[sub._id.toString()] || 0) * 1000) / 1000;
      const remaining = Math.max(0, Math.round((sub.totalPrice - totalPaid) * 1000) / 1000);

      if (remaining > 0) {
        let paymentStatus = totalPaid > 0 ? 'Partiellement payé' : 'Impayé';
        unpaidSubs.push({
          ...sub,
          totalPaid,
          remaining,
          paymentStatus,
        });

        if (sub.clientId) {
          clientIdsWithDebt.add(sub.clientId._id.toString());
        }
        totalRemainingToCollect += remaining;
      }
    }

    res.json({
      success: true,
      data: {
        unpaidCount: unpaidSubs.length,
        debtorClientsCount: clientIdsWithDebt.size,
        totalRemaining: Math.round(totalRemainingToCollect * 1000) / 1000,
        subscriptions: unpaidSubs,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
