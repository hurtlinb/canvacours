const fs = require('fs').promises;
const path = require('path');

const { APP_VERSION, PUBLIC_DIR, INDEX_FILE } = require('./config');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

function createHeaders(statusCode, contentType, body) {
  const headers = {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff'
  };
  if (body !== undefined && body !== null) {
    const size = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(String(body));
    headers['Content-Length'] = size;
  }
  return headers;
}

function send(res, method, statusCode, contentType, body) {
  const headers = createHeaders(statusCode, contentType, body);
  res.writeHead(statusCode, headers);
  if (method === 'HEAD' || body === undefined || body === null) {
    res.end();
    return;
  }
  res.end(body);
}

function normalizePathname(pathname) {
  if (!pathname) {
    return '/';
  }
  try {
    const decoded = decodeURIComponent(pathname);
    if (!decoded || decoded === '/') {
      return '/';
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

function resolveContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return MIME_TYPES[extension] || 'application/octet-stream';
}

async function serveIndex(res, method) {
  try {
    const template = await fs.readFile(INDEX_FILE, 'utf8');
    const html = template.replace(/%%APP_VERSION%%/g, APP_VERSION);
    send(res, method, 200, 'text/html; charset=utf-8', html);
  } catch (error) {
    handleReadError(res, method, error);
  }
}

async function serveStaticAsset(res, method, relativePath) {
  const sanitizedPath = relativePath.replace(/^\/+/, '');
  const absolutePath = path.join(PUBLIC_DIR, sanitizedPath);
  if (!absolutePath.startsWith(PUBLIC_DIR)) {
    send(res, method, 404, 'text/plain; charset=utf-8', 'Not Found');
    return;
  }
  try {
    const file = await fs.readFile(absolutePath);
    const contentType = resolveContentType(absolutePath);
    send(res, method, 200, contentType, file);
  } catch (error) {
    handleReadError(res, method, error);
  }
}

function handleReadError(res, method, error) {
  if (error && (error.code === 'ENOENT' || error.code === 'EISDIR')) {
    send(res, method, 404, 'text/plain; charset=utf-8', 'Not Found');
    return;
  }
  console.error('Impossible de servir la ressource demandée.', error);
  send(res, method, 500, 'text/plain; charset=utf-8', 'Internal Server Error');
}

async function handleRequest(req, res) {
  const method = req.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    send(res, method, 405, 'text/plain; charset=utf-8', 'Method Not Allowed');
    return;
  }

  let pathname = '/';
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    pathname = normalizePathname(requestUrl.pathname);
  } catch (error) {
    pathname = null;
  }

  if (pathname === null) {
    send(res, method, 400, 'text/plain; charset=utf-8', 'Bad Request');
    return;
  }

  if (pathname === '/' || pathname === '/index.html') {
    await serveIndex(res, method);
    return;
  }

  await serveStaticAsset(res, method, pathname);
}

module.exports = {
  handleRequest
};
