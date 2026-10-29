const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du service est requis'],
      unique: true,
      trim: true,
    },
    icon: {
      type: String,
      default: 'Package',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', serviceSchema);
