'use strict';

const fs = require('fs');
const express = require('express');
const { APP_VERSION, INDEX_FILE, PORT, PUBLIC_DIR } = require('./config');
const { initializeDatabase } = require('./database');
const apiRouter = require('./routes/api');

const indexHtml = fs
  .readFileSync(INDEX_FILE, 'utf8')
  .replace(/%%APP_VERSION%%/g, APP_VERSION || '');

function sendIndexHtml(res) {
  res.type('html').send(indexHtml);
}

function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRouter);

  app.get(['/', '/index.html'], (req, res) => {
    sendIndexHtml(res);
  });

  app.use(express.static(PUBLIC_DIR, {
    fallthrough: true,
    extensions: ['html']
  }));

  app.get('*', (req, res) => {
    sendIndexHtml(res);
  });

  app.use((err, req, res, next) => {
    console.error('Erreur lors du traitement d\'une requête.', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

async function startServer(port = PORT) {
  await initializeDatabase();
  const app = createApp();
  return new Promise((resolve, reject) => {
    const server = app
      .listen(port, () => {
        console.log(`Serveur démarré sur http://localhost:${port}`);
        resolve(server);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

module.exports = {
  createApp,
  startServer
};
