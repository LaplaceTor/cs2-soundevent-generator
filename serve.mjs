import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 4173;
const DIST_DIR = path.resolve('dist');

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

const server = http.createServer((req, res) => {
  let rawUrl = req.url?.split('?')[0] || '/';
  let reqPath;
  try {
    reqPath = decodeURIComponent(rawUrl);
  } catch {
    res.writeHead(400, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end('400 Bad Request: Malformed URI');
    return;
  }

  // Normalize request path
  const normalizedPath = path.normalize(reqPath);
  let filePath = path.resolve(DIST_DIR, '.' + path.sep + normalizedPath);

  // Prevent path traversal outside dist directory
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end('403 Forbidden');
    return;
  }

  // Fallback to index.html for SPA routing if file does not exist or is a directory
  let isSpaFallback = false;
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
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
        'X-Content-Type-Options': 'nosniff',
      });
      res.end('404 Not Found');
      return;
    }

    const headers = {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': isHashedAsset
        ? 'public, max-age=31536000, immutable'
        : 'no-cache, no-store, must-revalidate',
    };

    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Local Preview Server running at: http://localhost:${PORT}/`);
});
