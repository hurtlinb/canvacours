const http = require('http');
const { version } = require('./package.json');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Application Node.js basique</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 2rem;
          line-height: 1.5;
        }
        .version {
          font-weight: bold;
          color: #2c3e50;
        }
      </style>
    </head>
    <body>
      <h1>Bienvenue sur votre application Node.js basique!</h1>
      <p class="version">Version : ${version}</p>
    </body>
  </html>`);
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
