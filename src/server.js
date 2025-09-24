'use strict';

const express = require('express');
const { INDEX_FILE, PORT, PUBLIC_DIR } = require('./config');
const { initializeDatabase } = require('./database');
const apiRouter = require('./routes/api');

function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRouter);

  app.use(express.static(PUBLIC_DIR, {
    fallthrough: true,
    extensions: ['html']
  }));

  app.get('*', (req, res) => {
    res.sendFile(INDEX_FILE);
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
