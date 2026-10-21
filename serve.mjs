import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 4173;
const DIST_DIR = path.resolve('dist');
const DIST_PREFIX = DIST_DIR.endsWith(path.sep) ? DIST_DIR : DIST_DIR + path.sep;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' ws: wss:",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': CSP_POLICY,
};

const server = http.createServer((req, res) => {
  // Method whitelist
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Allow': 'GET, HEAD',
      ...SECURITY_HEADERS,
    });
    res.end('405 Method Not Allowed');
    return;
  }

  let rawUrl = req.url?.split('?')[0] || '/';
  let reqPath;
  try {
    reqPath = decodeURIComponent(rawUrl);
  } catch {
    res.writeHead(400, {
      'Content-Type': 'text/plain; charset=utf-8',
      ...SECURITY_HEADERS,
    });
    res.end('400 Bad Request: Malformed URI');
    return;
  }

  // Reject null bytes and path traversal attempts explicitly
  if (reqPath.includes('\0') || /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(reqPath)) {
    res.writeHead(403, {
      'Content-Type': 'text/plain; charset=utf-8',
      ...SECURITY_HEADERS,
    });
    res.end('403 Forbidden');
    return;
  }

  // Normalize request path
  const normalizedPath = path.normalize(reqPath);
  let filePath = path.resolve(DIST_DIR, '.' + path.sep + normalizedPath);

  // Robust path traversal check:
  // 1. relative path from DIST_DIR must not start with '..' and must not be absolute
  // 2. filePath must start with DIST_PREFIX or equal DIST_DIR
  const relPath = path.relative(DIST_DIR, filePath);
  const isOutside =
    relPath.startsWith('..') ||
    path.isAbsolute(relPath) ||
    (!filePath.startsWith(DIST_PREFIX) && filePath !== DIST_DIR);

  if (isOutside) {
    res.writeHead(403, {
      'Content-Type': 'text/plain; charset=utf-8',
      ...SECURITY_HEADERS,
    });
    res.end('403 Forbidden');
    return;
  }

  // Check stat safely without throwing
  let stat = null;
  try {
    if (fs.existsSync(filePath)) {
      stat = fs.statSync(filePath);
    }
  } catch {
    stat = null;
  }

  // Fallback to index.html for SPA routing if file does not exist or is a directory
  let isSpaFallback = false;
  if (!stat || stat.isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
    isSpaFallback = true;
  }

  const relFromDist = path.relative(DIST_DIR, filePath).replace(/\\/g, '/');
  const isHashedAsset = !isSpaFallback && relFromDist.startsWith('assets/');

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        ...SECURITY_HEADERS,
      });
      res.end('404 Not Found');
      return;
    }

    const headers = {
      'Content-Type': contentType,
      ...SECURITY_HEADERS,
      'Cache-Control': isHashedAsset
        ? 'public, max-age=31536000, immutable'
        : 'no-cache, no-store, must-revalidate',
    };

    if (req.method === 'HEAD') {
      res.writeHead(200, headers);
      res.end();
      return;
    }

    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Local Preview Server running at: http://localhost:${PORT}/`);
});
