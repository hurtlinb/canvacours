const path = require('path');

const { version } = require('../package.json');

const DEFAULT_PORT = 3000;

function normalizePort(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PORT;
  }
  return parsed;
}

const PORT = normalizePort(process.env.PORT);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const INDEX_FILE = path.join(PUBLIC_DIR, 'index.html');

module.exports = {
  APP_VERSION: version,
  DEFAULT_PORT,
  INDEX_FILE,
  PORT,
  PUBLIC_DIR,
  normalizePort
};
