/**
 * API Gateway — Single entry point for all F&G microservices
 * Handles: JWT auth, rate limiting, request routing, CORS
 * Port: 3000
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { createLogger } = require('../../shared/utils/logger.js');

const logger = createLogger('api-gateway');
const app = express();

// ── Config ─────────────────────────────────────────────────────────────────
const SERVICES = {
  '/api/auth':         `http://localhost:3001`,
  '/api/restaurants':  `http://localhost:3002`,
  '/api/orders':       `http://localhost:3003`,
  '/api/delivery':     `http://localhost:3004`,
  '/api/payments':     `http://localhost:3005`,
  '/api/notifications':  `http://localhost:3006`,
  '/api/search':       `http://localhost:3008`,
  '/api/analytics':    `http://localhost:3009`,
};

// ── CORS — explicit allowlist (#1 CodeQL fix) ─────────────────────────────
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:3000,http://localhost:4000,http://localhost:19006,exp://localhost'
).split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile native, curl, server-to-server)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// Rate limiting — 100 req / 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// Stricter limit on auth endpoints
const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10 });
app.use('/api/auth/', authLimiter);

// ── JWT Auth Middleware ────────────────────────────────────────────────────
const PUBLIC_ROUTES = [
  '/api/auth/otp/send', '/api/auth/otp/verify',
  '/api/auth/login', '/api/restaurants', '/api/search',
  '/api/health',
];

function authMiddleware(req, res, next) {
  const isPublic = PUBLIC_ROUTES.some(r => req.path.startsWith(r));
  if (isPublic) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fg_jwt_secret_dev');
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-role'] = decoded.role || 'customer';
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
app.use(authMiddleware);

// ── Request Logging ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const userId = req.headers['x-user-id'] || 'anon';
    logger.info('', { 
      method: req.method, 
      path: req.path, 
      status: res.statusCode, 
      durationMs: ms, 
      userId 
    });
  });
  next();
});

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ service: 'api-gateway', status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/api/services', (req, res) => {
  res.json({ services: Object.keys(SERVICES).map(path => ({ path, target: SERVICES[path] })) });
});

// ── Route Proxying ─────────────────────────────────────────────────────────
Object.entries(SERVICES).forEach(([path, target]) => {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error(`[GW] Proxy error for ${path}:`, err.message);
        res.status(502).json({ error: 'Service temporarily unavailable', service: path });
      },
    },
  }));
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled request error', { 
    error: err.message, 
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    referenceId: Date.now().toString()
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`🔀 API Gateway running on port ${PORT}`);
    logger.info(`Routes configured: ${Object.keys(SERVICES).join(', ')}`);
  });
}

module.exports = app;
