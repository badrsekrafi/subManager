const mongoose = require('mongoose');
const dns = require('dns');

// Keep the Windows DNS workaround local to development.
if (process.platform === 'win32' && !process.env.VERCEL) {
  try { dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']); } catch {}
}

let connectionPromise;
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    }).finally(() => { connectionPromise = undefined; });
  }
  return connectionPromise;
};

module.exports = connectDB;
