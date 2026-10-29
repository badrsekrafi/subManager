const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Le prénom est requis'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual: fullName combining firstName and lastName.
 */
clientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

clientSchema.index({ firstName: 1, lastName: 1 });

module.exports = mongoose.model('Client', clientSchema);
