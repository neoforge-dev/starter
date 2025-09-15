// Simple Node.js HTTP server for testing
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8084;
const ROOT_DIR = __dirname;

const server = http.createServer((req, res) => {
  // Handle root request
  let filePath = req.url === '/' ? '/index.html' : req.url;

  // Security: prevent directory traversal
  if (filePath.includes('..')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  filePath = path.join(ROOT_DIR, filePath);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Internal server error');
        return;
      }

      // Set content type based on file extension
      const ext = path.extname(filePath);
      let contentType = 'text/plain';

      switch (ext) {
        case '.html':
          contentType = 'text/html';
          break;
        case '.js':
          contentType = 'application/javascript';
          break;
        case '.css':
          contentType = 'text/css';
          break;
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 NeoForge test server running at http://localhost:${PORT}/`);
  console.log(`📁 Serving files from: ${ROOT_DIR}`);
  console.log(`🔗 Open http://localhost:${PORT}/ in your browser to test`);
  console.log(`🔗 Open http://localhost:${PORT}/test-page.html for interactive testing`);
});