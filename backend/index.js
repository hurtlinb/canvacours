const { startServer } = require('./src/server');
const { PORT } = require('./src/config');

startServer(PORT).catch((error) => {
  console.error('Le serveur a rencontré une erreur critique.', error);
  process.exitCode = 1;
});
