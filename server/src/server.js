require('dotenv').config();
const dns = require('dns');
const path = require('path');

// Resolve MongoDB Atlas SRV records reliably on Windows
try {
  if (process.platform === 'win32' && !process.env.VERCEL) dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const updateStatuses = require('./utils/updateStatuses');
const initDefaults = require('./utils/initDefaults');

// Route imports
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const subscriptionRoutes = require('./routes/subscriptions');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const serviceRoutes = require('./routes/services');

const app = express();
const PORT = process.env.PORT || 5000;
if (process.env.VERCEL || process.env.RENDER) app.set('trust proxy', 1);

let initialization;
const ensureReady = async () => {
  if (!initialization) {
    initialization = (async () => {
      await connectDB();
      await initDefaults();
      await updateStatuses();
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  await initialization;
  await connectDB();
};

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Rate limiting on API routes
app.use('/api', apiLimiter);

// DB connection check middleware to prevent 10s buffering timeout
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') return next();
  try {
    await ensureReady();
  } catch {
    return res.status(503).json({
      success: false,
      message: 'La base de données est temporairement indisponible. Veuillez réessayer.',
    });
  }
  next();
});

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur en fonctionnement',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);

// Render serves the compiled React app and API from the same HTTPS origin.
if (process.env.SERVE_CLIENT === 'true') {
  const clientDirectory = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDirectory));
  app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
    if (!req.accepts('html')) return next();
    res.sendFile(path.join(clientDirectory, 'index.html'));
  });
}

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée : ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use(errorHandler);

/**
 * Start the server: attempt to connect to MongoDB and start listening.
 */
const startServer = async () => {

  const tryConnect = async () => {
    try {
      await ensureReady();

    } catch (err) {
      console.warn('[MongoDB] Nouvelle tentative de connexion dans 5 secondes...');
      setTimeout(tryConnect, 5000);
    }
  };

  // Start HTTP server immediately
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 [Serveur Backend] Démarré sur le port ${PORT}`);
    console.log(`🔗 API disponible sur http://localhost:${PORT}/api`);
    console.log(`======================================================\n`);
  });

  // Attempt DB connection
  await tryConnect();
};

if (require.main === module && !process.env.VERCEL) startServer();

module.exports = app;
