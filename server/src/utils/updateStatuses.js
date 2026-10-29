const Subscription = require('../models/Subscription');

/**
 * Update statuses of all active/expiring_soon subscriptions based on
 * their expirationDate relative to the current date.
 *
 * - If expired → set status 'expired'
 * - If within 7 days → set status 'expiring_soon'
 * - Otherwise → keep 'active'
 */
const updateStatuses = async () => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Mark expired subscriptions
    const expiredResult = await Subscription.updateMany(
      {
        status: { $in: ['active', 'expiring_soon'] },
        expirationDate: { $lte: now },
      },
      { $set: { status: 'expired' } }
    );

    // Mark expiring_soon subscriptions (within 7 days but not yet expired)
    const expiringSoonResult = await Subscription.updateMany(
      {
        status: 'active',
        expirationDate: { $gt: now, $lte: sevenDaysFromNow },
      },
      { $set: { status: 'expiring_soon' } }
    );

    // Revert any incorrectly marked expiring_soon back to active
    // (in case expirationDate was updated and is now more than 7 days away)
    const reactivatedResult = await Subscription.updateMany(
      {
        status: 'expiring_soon',
        expirationDate: { $gt: sevenDaysFromNow },
      },
      { $set: { status: 'active' } }
    );

    const totalUpdated =
      (expiredResult.modifiedCount || 0) +
      (expiringSoonResult.modifiedCount || 0) +
      (reactivatedResult.modifiedCount || 0);

    if (totalUpdated > 0) {
      console.log(
        `[UpdateStatuses] ${expiredResult.modifiedCount} expirés, ` +
          `${expiringSoonResult.modifiedCount} bientôt expirés, ` +
          `${reactivatedResult.modifiedCount} réactivés`
      );
    }

    return {
      expired: expiredResult.modifiedCount || 0,
      expiringSoon: expiringSoonResult.modifiedCount || 0,
      reactivated: reactivatedResult.modifiedCount || 0,
    };
  } catch (error) {
    console.error('[UpdateStatuses] Erreur lors de la mise à jour des statuts :', error.message);
    throw error;
  }
};

module.exports = updateStatuses;
