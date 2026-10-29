const mongoose = require('mongoose');
const { addMonths } = require('date-fns');

const subscriptionSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Le client est requis'],
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Le service est requis'],
    },
    purchaseDate: {
      type: Date,
      required: [true, 'La date d\'achat est requise'],
    },
    startDate: {
      type: Date,
      required: [true, 'La date de début est requise'],
    },
    duration: {
      value: {
        type: Number,
        required: [true, 'La durée est requise'],
        min: [1, 'La durée doit être d\'au moins 1 mois'],
      },
      unit: {
        type: String,
        enum: {
          values: ['months'],
          message: 'L\'unité de durée doit être "months"',
        },
        default: 'months',
        required: true,
      },
    },
    expirationDate: {
      type: Date,
      required: [true, 'La date d\'expiration est requise'],
    },
    quantity: {
      type: Number,
      required: [true, 'La quantité est requise'],
      min: [1, 'La quantité minimum est 1'],
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Le prix unitaire est requis'],
      min: [0, 'Le prix unitaire ne peut pas être négatif'],
    },
    unitCost: {
      type: Number,
      min: [0, 'Le coût unitaire ne peut pas être négatif'],
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: [true, 'Le prix total est requis'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'expiring_soon', 'expired', 'cancelled'],
        message: 'Statut invalide : {VALUE}',
      },
      default: 'active',
    },
    notes: {
      type: String,
      default: '',
    },
    renewalOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook:
 * 1. Calculate expirationDate from startDate + duration (in months).
 * 2. Calculate totalPrice = quantity * unitPrice.
 */
subscriptionSchema.pre('save', function (next) {
  if (this.isModified('startDate') || this.isModified('duration') || this.isNew) {
    this.expirationDate = addMonths(new Date(this.startDate), this.duration.value);
  }

  if (this.isModified('quantity') || this.isModified('unitPrice') || this.isNew) {
    // Use rounding to avoid floating point precision issues
    this.totalPrice = Math.round(this.quantity * this.unitPrice * 1000) / 1000;
  }

  next();
});

subscriptionSchema.index({ clientId: 1 });
subscriptionSchema.index({ serviceId: 1 });
subscriptionSchema.index({ expirationDate: 1 });
subscriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
