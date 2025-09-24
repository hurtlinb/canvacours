const path = require('path');

const { version } = require('../package.json');

const DEFAULT_PORT = 3000;
const DEFAULT_DB_PORT = 3306;
const DEFAULT_DB_CONNECTION_LIMIT = 5;

function normalizePort(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PORT;
  }
  return parsed;
}

const PORT = normalizePort(process.env.PORT);

function normalizePositiveInteger(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
}

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: normalizePositiveInteger(process.env.DB_PORT, DEFAULT_DB_PORT),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'canvacours',
  connectionLimit: normalizePositiveInteger(
    process.env.DB_CONNECTION_LIMIT,
    DEFAULT_DB_CONNECTION_LIMIT
  )
};

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const INDEX_FILE = path.join(PUBLIC_DIR, 'index.html');

module.exports = {
  APP_VERSION: version,
  DEFAULT_PORT,
  DEFAULT_DB_PORT,
  INDEX_FILE,
  PORT,
  PUBLIC_DIR,
  normalizePort,
  DB_CONFIG,
  normalizePositiveInteger
};
