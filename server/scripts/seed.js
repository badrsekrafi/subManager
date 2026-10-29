require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { addMonths, subMonths, subDays } = require('date-fns');

// Models
const Admin = require('../src/models/Admin');
const Client = require('../src/models/Client');
const Service = require('../src/models/Service');
const Subscription = require('../src/models/Subscription');
const Payment = require('../src/models/Payment');

const seed = async () => {
  try {
    console.log('=== Initialisation de la base de données ===\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[MongoDB] Connecté avec succès\n');

    // ───────────────────────────────────────────
    // 1. Create admin account if not exists
    // ───────────────────────────────────────────
    console.log('--- Création du compte administrateur ---');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (!adminEmail) throw new Error('ADMIN_EMAIL est requis pour initialiser le compte administrateur.');

    let admin = await Admin.findOne({ email: adminEmail });

    if (!admin) {
      if (!adminPassword) throw new Error('ADMIN_INITIAL_PASSWORD est requis pour créer le compte administrateur.');
      admin = await Admin.create({
        name: 'Administrateur',
        email: adminEmail,
        passwordHash: adminPassword, // pre-save hook will hash it
        mustChangePassword: true,
      });
      console.log(`  ✓ Admin créé : ${admin.email}`);
    } else {
      console.log(`  → Admin existe déjà : ${admin.email}`);
    }

    // ───────────────────────────────────────────
    // 2. Create default services
    // ───────────────────────────────────────────
    console.log('\n--- Création des services ---');

    const serviceData = [
      { name: 'Netflix', icon: 'Tv' },
      { name: 'Spotify', icon: 'Music' },
      { name: 'Gemini', icon: 'Sparkles' },
      { name: 'Claude', icon: 'Bot' },
      { name: 'ChatGPT', icon: 'MessageSquare' },
      { name: 'YouTube Premium', icon: 'Video' },
      { name: 'Disney+', icon: 'Film' },
    ];

    const services = {};
    for (const svc of serviceData) {
      let service = await Service.findOne({ name: svc.name });
      if (!service) {
        service = await Service.create(svc);
        console.log(`  ✓ Service créé : ${service.name}`);
      } else {
        console.log(`  → Service existe déjà : ${service.name}`);
      }
      services[svc.name] = service;
    }

    // ───────────────────────────────────────────
    // 3. Create 5 demo clients with French names
    // ───────────────────────────────────────────
    console.log('\n--- Création des clients ---');

    const clientData = [
      { firstName: 'Mohamed', lastName: 'Ben Ali', phone: '+216 50 123 456', notes: 'Client fidèle' },
      { firstName: 'Fatma', lastName: 'Trabelsi', phone: '+216 55 987 654', notes: '' },
      { firstName: 'Ahmed', lastName: 'Hammami', phone: '+216 52 456 789', notes: 'Préfère les paiements par virement' },
      { firstName: 'Salma', lastName: 'Chaabane', phone: '+216 58 321 098', notes: '' },
      { firstName: 'Youssef', lastName: 'Mansouri', phone: '+216 54 654 321', notes: 'Étudiant - tarif réduit' },
    ];

    // Clear existing demo clients to avoid duplicates on re-runs
    const existingClientCount = await Client.countDocuments();
    let clients = [];

    if (existingClientCount >= 5) {
      console.log('  → Des clients existent déjà, réutilisation...');
      clients = await Client.find().limit(5).lean();
    } else {
      for (const cd of clientData) {
        const client = await Client.create(cd);
        clients.push(client.toObject());
        console.log(`  ✓ Client créé : ${client.firstName} ${client.lastName}`);
      }
    }

    // ───────────────────────────────────────────
    // 4. Create demo subscriptions
    // ───────────────────────────────────────────
    console.log('\n--- Création des abonnements ---');

    const existingSubCount = await Subscription.countDocuments();

    if (existingSubCount > 0) {
      console.log('  → Des abonnements existent déjà, passage...');
    } else {
      const now = new Date();

      const subscriptionData = [
        // Active subscriptions
        {
          clientIdx: 0,
          serviceName: 'Netflix',
          startDate: subMonths(now, 1),
          duration: 3,
          unitPrice: 25,
          quantity: 1,
          status: 'active',
        },
        {
          clientIdx: 0,
          serviceName: 'Spotify',
          startDate: subMonths(now, 2),
          duration: 6,
          unitPrice: 15,
          quantity: 1,
          status: 'active',
        },
        {
          clientIdx: 1,
          serviceName: 'ChatGPT',
          startDate: subMonths(now, 1),
          duration: 1,
          unitPrice: 60,
          quantity: 1,
          status: 'active',
        },
        {
          clientIdx: 1,
          serviceName: 'Disney+',
          startDate: subMonths(now, 3),
          duration: 12,
          unitPrice: 20,
          quantity: 1,
          status: 'active',
        },
        // Expiring soon (within 7 days)
        {
          clientIdx: 2,
          serviceName: 'Claude',
          startDate: subMonths(now, 1),
          duration: 1,
          unitPrice: 55,
          quantity: 1,
          status: 'expiring_soon',
          overrideExpiration: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        },
        {
          clientIdx: 2,
          serviceName: 'Gemini',
          startDate: subMonths(now, 2),
          duration: 2,
          unitPrice: 50,
          quantity: 1,
          status: 'expiring_soon',
          overrideExpiration: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        },
        // Expired subscriptions
        {
          clientIdx: 3,
          serviceName: 'YouTube Premium',
          startDate: subMonths(now, 4),
          duration: 3,
          unitPrice: 30,
          quantity: 1,
          status: 'expired',
        },
        {
          clientIdx: 3,
          serviceName: 'Netflix',
          startDate: subMonths(now, 7),
          duration: 6,
          unitPrice: 25,
          quantity: 1,
          status: 'expired',
        },
        // Multi-quantity subscription
        {
          clientIdx: 4,
          serviceName: 'Netflix',
          startDate: subMonths(now, 1),
          duration: 3,
          unitPrice: 25,
          quantity: 2,
          status: 'active',
        },
        // Cancelled
        {
          clientIdx: 4,
          serviceName: 'Spotify',
          startDate: subMonths(now, 5),
          duration: 6,
          unitPrice: 15,
          quantity: 1,
          status: 'cancelled',
        },
      ];

      const createdSubscriptions = [];

      for (const sd of subscriptionData) {
        const client = clients[sd.clientIdx];
        const service = services[sd.serviceName];

        const sub = new Subscription({
          clientId: client._id,
          serviceId: service._id,
          purchaseDate: sd.startDate,
          startDate: sd.startDate,
          duration: { value: sd.duration, unit: 'months' },
          quantity: sd.quantity,
          unitPrice: sd.unitPrice,
          unitCost: Math.round(sd.unitPrice * 0.6 * 100) / 100,
          notes: '',
          expirationDate: new Date(), // pre-save will compute
          totalPrice: 0, // pre-save will compute
          status: sd.status,
        });

        await sub.save();

        // Override expiration for expiring_soon demo data
        if (sd.overrideExpiration) {
          await Subscription.updateOne(
            { _id: sub._id },
            { $set: { expirationDate: sd.overrideExpiration } }
          );
        }

        createdSubscriptions.push(sub);
        console.log(
          `  ✓ Abonnement : ${client.firstName} ${client.lastName} → ${sd.serviceName} ` +
            `(${sd.duration} mois, ${sub.totalPrice} TND, ${sd.status})`
        );
      }

      // ───────────────────────────────────────────
      // 5. Create demo payments
      // ───────────────────────────────────────────
      console.log('\n--- Création des paiements ---');

      const paymentData = [
        // Mohamed - Netflix: fully paid
        {
          subIdx: 0,
          amount: 25,
          method: 'Espèces',
          daysAgo: 30,
        },
        // Mohamed - Spotify: partial payment
        {
          subIdx: 1,
          amount: 10,
          method: 'Virement',
          daysAgo: 60,
        },
        // Fatma - ChatGPT: fully paid
        {
          subIdx: 2,
          amount: 60,
          method: 'D17',
          daysAgo: 15,
        },
        // Fatma - Disney+: partial payment
        {
          subIdx: 3,
          amount: 10,
          method: 'Espèces',
          daysAgo: 90,
        },
        {
          subIdx: 3,
          amount: 5,
          method: 'Espèces',
          daysAgo: 60,
        },
        // Ahmed - Claude: partial
        {
          subIdx: 4,
          amount: 30,
          method: 'Virement',
          daysAgo: 20,
        },
        // Salma - YouTube Premium: fully paid (expired)
        {
          subIdx: 6,
          amount: 30,
          method: 'Espèces',
          daysAgo: 120,
        },
        // Salma - Netflix: no payment (expired, unpaid)
        // Youssef - Netflix x2: partial
        {
          subIdx: 8,
          amount: 25,
          method: 'D17',
          daysAgo: 10,
        },
        // Recent payments for dashboard
        {
          subIdx: 0,
          amount: 0, // will be skipped if 0
          method: 'Espèces',
          daysAgo: 2,
        },
      ];

      for (const pd of paymentData) {
        if (pd.amount <= 0) continue;

        const sub = createdSubscriptions[pd.subIdx];
        if (!sub) continue;

        const payment = await Payment.create({
          subscriptionId: sub._id,
          clientId: sub.clientId,
          amount: pd.amount,
          paymentDate: subDays(now, pd.daysAgo),
          paymentMethod: pd.method,
          notes: '',
        });

        console.log(
          `  ✓ Paiement : ${pd.amount} TND (${pd.method}) pour abonnement #${pd.subIdx + 1}`
        );
      }
    }

    // ───────────────────────────────────────────
    // Summary
    // ───────────────────────────────────────────
    console.log('\n=== Résumé ===');
    console.log(`  Admins     : ${await Admin.countDocuments()}`);
    console.log(`  Services   : ${await Service.countDocuments()}`);
    console.log(`  Clients    : ${await Client.countDocuments()}`);
    console.log(`  Abonnements: ${await Subscription.countDocuments()}`);
    console.log(`  Paiements  : ${await Payment.countDocuments()}`);
    console.log('\n✅ Base de données initialisée avec succès !');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'initialisation :', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();
