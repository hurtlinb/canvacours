'use strict';

const mariadb = require('mariadb');
const { DB_CONFIG } = require('./config');
const { createInitialAppState } = require('./default-state');

let pool;

function getPool() {
  if (!pool) {
    pool = mariadb.createPool({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      database: DB_CONFIG.database,
      connectionLimit: DB_CONFIG.connectionLimit
    });
  }
  return pool;
}

async function initializeDatabase() {
  const connection = await getPool().getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
        data LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await ensureDefaultState(connection);
  } finally {
    connection.release();
  }
}

async function ensureDefaultState(connection) {
  const rows = await connection.query('SELECT id FROM app_state WHERE id = 1');
  if (rows.length === 0) {
    const state = createInitialAppState();
    await connection.query('INSERT INTO app_state (id, data) VALUES (1, ?)', [
      JSON.stringify(state)
    ]);
  }
}

async function loadState() {
  const connection = await getPool().getConnection();
  try {
    const rows = await connection.query('SELECT data FROM app_state WHERE id = 1');
    if (!rows || rows.length === 0) {
      const state = createInitialAppState();
      await connection.query('INSERT INTO app_state (id, data) VALUES (1, ?)', [
        JSON.stringify(state)
      ]);
      return state;
    }
    const raw = rows[0].data;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (error) {
        // Fall through to reset
      }
    }
    const fallback = createInitialAppState();
    await connection.query('UPDATE app_state SET data = ? WHERE id = 1', [
      JSON.stringify(fallback)
    ]);
    return fallback;
  } finally {
    connection.release();
  }
}

async function saveState(state) {
  const connection = await getPool().getConnection();
  try {
    const payload = JSON.stringify(state || {});
    await connection.query('UPDATE app_state SET data = ? WHERE id = 1', [payload]);
  } finally {
    connection.release();
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

module.exports = {
  closePool,
  getPool,
  initializeDatabase,
  loadState,
  saveState
};
