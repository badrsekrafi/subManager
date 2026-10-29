// Manual browser QA against an isolated database, never production data.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const dns = require('node:dns');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const databaseName = `submanager_test_browser_${crypto.randomBytes(6).toString('hex')}`;
const environment = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'submanager-qa-'));
const password = crypto.randomBytes(18).toString('hex');
const credentialsPath = path.join(temporaryDirectory, 'browser.json');
let server;
let closing = false;

async function close() {
  if (closing) return;
  closing = true;
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.name === databaseName && databaseName.startsWith('submanager_test_browser_')) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (fs.existsSync(credentialsPath)) fs.unlinkSync(credentialsPath);
  console.log('Isolated browser database and temporary credentials removed.');
  process.exit(0);
}

async function main() {
  if (process.platform === 'win32') dns.setServers(['8.8.8.8', '1.1.1.1']);
  process.env.NODE_ENV = 'test';
  process.env.SERVE_CLIENT = 'true';
  process.env.MONGODB_URI = environment.MONGODB_URI;
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  process.env.ADMIN_EMAIL = 'browser-qa@example.test';
  process.env.ADMIN_INITIAL_PASSWORD = password;
  await mongoose.connect(environment.MONGODB_URI, { dbName: databaseName, serverSelectionTimeoutMS: 15000 });
  const Admin = require('../src/models/Admin');
  await Admin.create({ name: 'QA Administrator', email: process.env.ADMIN_EMAIL, passwordHash: password, mustChangePassword: false });
  const app = require('../src/server');
  server = app.listen(0, '127.0.0.1', () => {
    const origin = `http://127.0.0.1:${server.address().port}`;
    fs.writeFileSync(credentialsPath, JSON.stringify({ origin, email: process.env.ADMIN_EMAIL, password }));
    console.log(`QA_URL=${origin}`);
    console.log(`QA_CREDENTIALS_FILE=${credentialsPath}`);
  });
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

main().catch(async error => {
  console.error(error.name, error.code || 'Browser QA startup failed');
  await close();
});
