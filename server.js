const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const db = require('./database.js');

// Initialize database
db.initDatabase();

const PORT = parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        // 2MB limit
        reject(new Error('Request entity too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function serveStaticFile(req, res, filePath) {
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(normalizedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If path doesn't exist, try index.html for SPA routing fallback if requested
      const indexFallback = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexFallback, (err2, content) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(normalizedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(normalizedPath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error reading file');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    });
  });
}

async function requestHandler(req, res) {
  const host = req.headers.host || 'localhost';
  const rawUrl = req.headers['x-forwarded-uri'] || req.url;
  const parsedUrl = new URL(rawUrl, `http://${host}`);
  const query = Object.fromEntries(parsedUrl.searchParams.entries());
  let pathname = parsedUrl.pathname;

  // Resolve target route if rewritten by Vercel
  if (req.headers['x-api-route']) {
    pathname = req.headers['x-api-route'];
  } else if (query._api_route) {
    pathname = '/api/' + query._api_route.replace(/^\/+/, '');
  }

  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  try {
    // --- API ROUTES ---

    // GET /api/categories
    if (method === 'GET' && pathname === '/api/categories') {
      const categories = db.getCategories();
      sendJson(res, 200, { success: true, categories });
      return;
    }

    // GET /api/items
    if (method === 'GET' && pathname === '/api/items') {
      const filter = {
        category: query.category || 'all',
        search: query.search || '',
        isVeg: query.isVeg === '1' || query.isVeg === 'true',
        isVegan: query.isVegan === '1' || query.isVegan === 'true',
        isSpicy: query.isSpicy === '1' || query.isSpicy === 'true',
        isBestseller: query.isBestseller === '1' || query.isBestseller === 'true',
        sortBy: query.sortBy || 'featured'
      };
      const items = db.getFoodItems(filter);
      sendJson(res, 200, { success: true, items, count: items.length });
      return;
    }

    // GET /api/items/:id
    const itemMatch = pathname.match(/^\/api\/items\/(\d+)$/);
    if (method === 'GET' && itemMatch) {
      const itemId = parseInt(itemMatch[1], 10);
      const item = db.getFoodItemById(itemId);
      if (!item) {
        sendJson(res, 404, { success: false, error: 'Food item not found' });
        return;
      }
      sendJson(res, 200, { success: true, item });
      return;
    }

    // GET /api/coupons/validate?code=XYZ&subtotal=30
    if (method === 'GET' && pathname === '/api/coupons/validate') {
      const code = query.code;
      const subtotal = parseFloat(query.subtotal || '0');
      const validation = db.validateCoupon(code, subtotal);
      if (!validation.valid) {
        sendJson(res, 400, { success: false, error: validation.message });
        return;
      }
      sendJson(res, 200, { success: true, coupon: validation });
      return;
    }

    // POST /api/orders - Place order
    if (method === 'POST' && pathname === '/api/orders') {
      const body = await parseJsonBody(req);
      if (!body.customerName || !body.customerPhone || !body.deliveryAddress) {
        sendJson(res, 400, {
          success: false,
          error: 'Please provide customer name, phone number, and delivery address.'
        });
        return;
      }
      if (!Array.isArray(body.items) || body.items.length === 0) {
        sendJson(res, 400, {
          success: false,
          error: 'Order must include at least one food item.'
        });
        return;
      }

      try {
        const order = db.createOrder(body);
        sendJson(res, 201, { success: true, order, message: 'Order placed successfully!' });
      } catch (orderErr) {
        sendJson(res, 400, { success: false, error: orderErr.message });
      }
      return;
    }

    // GET /api/orders - List all orders
    if (method === 'GET' && pathname === '/api/orders') {
      const limit = parseInt(query.limit || '50', 10);
      const orders = db.getAllOrders(limit);
      sendJson(res, 200, { success: true, orders, count: orders.length });
      return;
    }

    // GET /api/orders/:id - Get specific order
    const orderMatch = pathname.match(/^\/api\/orders\/([A-Za-z0-9_-]+)$/);
    if (method === 'GET' && orderMatch) {
      const orderId = orderMatch[1];
      const order = db.getOrderById(orderId);
      if (!order) {
        sendJson(res, 404, { success: false, error: 'Order not found' });
        return;
      }
      sendJson(res, 200, { success: true, order });
      return;
    }

    // PATCH /api/orders/:id/status - Update order status
    if (method === 'PATCH' && orderMatch) {
      const orderId = orderMatch[1];
      const body = await parseJsonBody(req);
      if (!body.status) {
        sendJson(res, 400, { success: false, error: 'New status is required' });
        return;
      }

      const updated = db.updateOrderStatus(orderId, body.status);
      if (!updated) {
        sendJson(res, 404, { success: false, error: 'Order not found or update failed' });
        return;
      }
      sendJson(res, 200, { success: true, order: updated, message: `Status updated to ${body.status}` });
      return;
    }

    // POST /api/orders/:id/advance - Demo simulator step advance
    const advanceMatch = pathname.match(/^\/api\/orders\/([A-Za-z0-9_-]+)\/advance$/);
    if (method === 'POST' && advanceMatch) {
      const orderId = advanceMatch[1];
      const current = db.getOrderById(orderId);
      if (!current) {
        sendJson(res, 404, { success: false, error: 'Order not found' });
        return;
      }

      const sequence = ['received', 'preparing', 'out_for_delivery', 'delivered'];
      const currentIndex = sequence.indexOf(current.status);
      if (currentIndex === -1 || currentIndex >= sequence.length - 1) {
        sendJson(res, 200, { success: true, order: current, message: 'Order is already delivered or complete' });
        return;
      }

      const nextStatus = sequence[currentIndex + 1];
      const updated = db.updateOrderStatus(orderId, nextStatus);
      sendJson(res, 200, { success: true, order: updated, nextStatus });
      return;
    }

    // GET /api/stats - Store overview
    if (method === 'GET' && pathname === '/api/stats') {
      const stats = db.getStats();
      sendJson(res, 200, { success: true, stats });
      return;
    }

    // Guard: Never serve HTML for API requests
    if (pathname.startsWith('/api/') || pathname === '/api') {
      sendJson(res, 404, { success: false, error: `API route not found: ${pathname}` });
      return;
    }

    // --- STATIC ASSET SERVING ---
    let relativeFilePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const absolutePath = path.join(PUBLIC_DIR, relativeFilePath);
    serveStaticFile(req, res, absolutePath);

  } catch (err) {
    console.error('Server Request Error:', err);
    sendJson(res, 500, { success: false, error: 'Internal Server Error', details: err.message });
  }
}

const server = http.createServer(requestHandler);

let currentPort = PORT;
let maxPortRetries = 5;

function startServer(portToUse) {
  server.listen(portToUse, () => {
    console.log(`=================================================`);
    console.log(`  TasteCrave Online Food Ordering System`);
    console.log(`  Server running on http://localhost:${portToUse}`);
    console.log(`  Environment: Node.js ${process.version}`);
    console.log(`=================================================`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && maxPortRetries > 0) {
    maxPortRetries--;
    currentPort++;
    console.warn(`\n[Notice] Port ${currentPort - 1} is currently in use. Automatically trying port ${currentPort}...`);
    startServer(currentPort);
  } else {
    console.error('Server error:', err);
  }
});

// Start listening only when run directly as the main process (e.g. node server.js)
if (require.main === module && !process.env.VERCEL && !process.env.NOW_REGION && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer(PORT);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

// Export request handler for Vercel Serverless Function & testing
module.exports = requestHandler;
module.exports.server = server;
module.exports.startServer = startServer;
