const http = require('http');

const { PORT } = require('./config');
const { handleRequest } = require('./request-handler');

function startServer(port = PORT) {
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      console.error('Erreur inattendue pendant le traitement de la requête.', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Internal Server Error');
    });
  });

  server.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
  });

  return server;
}

module.exports = {
  startServer
};
