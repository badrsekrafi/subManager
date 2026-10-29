const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'L\'abonnement est requis'],
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Le client est requis'],
    },
    amount: {
      type: Number,
      required: [true, 'Le montant est requis'],
      min: [0.001, 'Le montant doit être supérieur à 0'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'La date de paiement est requise'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['Espèces', 'Virement', 'D17', 'Autre'],
        message: 'Méthode de paiement invalide : {VALUE}',
      },
      default: 'Espèces',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ subscriptionId: 1 });
paymentSchema.index({ clientId: 1 });
paymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
