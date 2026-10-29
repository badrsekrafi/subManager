const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Administrateur',
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'L\'adresse email est requise'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir une adresse email valide'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
    },
    mustChangePassword: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: hash the password if the passwordHash field has been modified.
 */
adminSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

/**
 * Compare a candidate password against the stored hash.
 * @param {string} candidatePassword - The password to verify.
 * @returns {Promise<boolean>}
 */
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Strip passwordHash from JSON output.
 */
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);
