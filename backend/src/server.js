const express = require('express');
const cors = require('cors');
const winston = require('winston');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const http = require('http');

// Load and validate environment variables
const config = require('./config/env');

// Swagger documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Prometheus metrics
const { register, metricsMiddleware } = require('./services/metrics');

// WebSocket service
const WebSocketService = require('./services/websocket');

const app = express();
const server = http.createServer(app);
const PORT = config.PORT;

// Initialize WebSocket service
const wsService = new WebSocketService(server);
app.set('wsService', wsService);

// Logger configuration
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Security middleware - CSP tuned for API + Swagger UI
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Swagger UI needs inline scripts
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.FRONTEND_URL || 'http://localhost:3000'],
      fontSrc: ["'self'", "https:", "data:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Per-endpoint rate limits for expensive operations
const expensiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 per hour
  message: 'Too many requests for this operation. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
app.use('/api/chains/create', expensiveLimiter);
app.use('/api/bridge/transaction', expensiveLimiter);
app.use('/api/billing/checkout', expensiveLimiter);

// CORS configuration
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));

// Domain resolver middleware (for white-label custom domains)
const domainResolver = require('./middleware/domainResolver');
app.use(domainResolver);

// API Key authentication middleware (sets req.userId if valid API key is present)
const { apiKeyAuth } = require('./middleware/apiKeyAuth');
app.use('/api/', apiKeyAuth);

// Stripe webhook needs raw body - mount BEFORE JSON parser
app.use('/api/billing/webhook/stripe', express.raw({ type: 'application/json' }));

// Body parsing middleware (for all other routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chains', require('./routes/chains'));
app.use('/api/validators', require('./routes/validators'));
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/whitelabel', require('./routes/whitelabel'));
app.use('/api/health', require('./routes/health'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/api-keys', require('./routes/apiKeys'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/bridge', require('./routes/bridge'));
app.use('/api/liquidity', require('./routes/liquidity'));

// API Documentation (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'PolyOne API Documentation'
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).end();
  }
});

// Health check with dependency status (readiness probe)
app.get('/health', async (req, res) => {
  const checks = { service: 'ok' };
  let overall = 'ok';

  // Check database connectivity
  try {
    const db = require('./services/database');
    if (db.useSupabase) {
      // Quick query to verify Supabase connection
      await db.getUserByEmail('__health_check__@probe.internal').catch(() => null);
      checks.database = 'ok';
    } else {
      checks.database = 'in-memory';
    }
  } catch (error) {
    checks.database = 'error';
    overall = 'degraded';
  }

  // Check Stripe (optional)
  try {
    const stripe = require('./services/stripe');
    checks.stripe = stripe.isConfigured() ? 'configured' : 'not_configured';
  } catch {
    checks.stripe = 'not_configured';
  }

  const statusCode = overall === 'ok' ? 200 : 503;
  res.status(statusCode).json({
    status: overall,
    timestamp: new Date().toISOString(),
    service: 'polyone-backend',
    version: '1.0.0',
    uptime: process.uptime(),
    checks
  });
});

app.get('/api/health', async (req, res) => {
  // Lightweight liveness check
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'polyone-backend',
    version: '1.0.0'
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const requestId = req.id || uuidv4();
  
  // Log error with context
  logger.error({
    requestId,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Structured error response
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      requestId
    }
  };

  // Add stack trace in development
  if (config.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.details;
  }

  res.status(statusCode).json(errorResponse);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      path: req.path,
      requestId: req.id
    }
  });
});

server.listen(PORT, () => {
  logger.info(`🚀 PolyOne API Server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`📊 Metrics endpoint: http://localhost:${PORT}/metrics`);
  logger.info(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws`);
});

module.exports = { app, server, wsService };

