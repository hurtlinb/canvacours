const fs = require('fs');
const path = require('path');

const envPaths = [path.join(__dirname, '..', '.env'), path.join(__dirname, '..', '..', '.env')];

envPaths.forEach((envFilePath) => {
  if (!fs.existsSync(envFilePath)) {
    return;
  }

  const envContent = fs.readFileSync(envFilePath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key) {
      return;
    }
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
});

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
