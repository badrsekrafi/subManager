const Admin = require('../models/Admin');
const Service = require('../models/Service');

const defaultServices = [
  { name: 'Netflix', icon: 'Tv' },
  { name: 'Spotify', icon: 'Music' },
  { name: 'Gemini', icon: 'Sparkles' },
  { name: 'Claude', icon: 'Bot' },
  { name: 'ChatGPT', icon: 'MessageSquare' },
  { name: 'YouTube Premium', icon: 'Video' },
  { name: 'Disney+', icon: 'Film' },
];

/**
 * Automatically ensure admin account and default services exist in DB
 */
async function initDefaults() {
  try {
    // 1. Ensure Admin exists
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (!adminEmail) throw new Error('ADMIN_EMAIL est requis pour initialiser le compte administrateur.');

    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      if (!adminPassword) throw new Error('ADMIN_INITIAL_PASSWORD est requis pour créer le compte administrateur.');
      await Admin.create({
        name: 'Administrateur',
        email: adminEmail,
        passwordHash: adminPassword, // Will be hashed by pre-save hook
        mustChangePassword: true,
      });
      console.log(`[Init] ✓ Compte administrateur initial créé (${adminEmail})`);
    }

    // 2. Ensure Default Services exist
    for (const svc of defaultServices) {
      const exists = await Service.findOne({ name: svc.name });
      if (!exists) {
        await Service.create(svc);
      }
    }
    console.log('[Init] ✓ Services par défaut vérifiés et initialisés');
  } catch (err) {
    console.warn('[Init] Note lors de l\'initialisation des données de base :', err.message);
  }
}

module.exports = initDefaults;
