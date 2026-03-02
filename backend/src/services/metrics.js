const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeChains = new client.Gauge({
  name: 'polyone_active_chains',
  help: 'Number of active chains'
});

const totalChains = new client.Gauge({
  name: 'polyone_total_chains',
  help: 'Total number of chains'
});

const activeUsers = new client.Gauge({
  name: 'polyone_active_users',
  help: 'Number of active users'
});

const chainDeployments = new client.Counter({
  name: 'polyone_chain_deployments_total',
  help: 'Total number of chain deployments',
  labelNames: ['status']
});

const databaseOperations = new client.Counter({
  name: 'polyone_database_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'table', 'status']
});

const websocketConnections = new client.Gauge({
  name: 'polyone_websocket_connections',
  help: 'Number of active WebSocket connections'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeChains);
register.registerMetric(totalChains);
register.registerMetric(activeUsers);
register.registerMetric(chainDeployments);
register.registerMetric(databaseOperations);
register.registerMetric(websocketConnections);

// Middleware to track HTTP requests
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  activeChains,
  totalChains,
  activeUsers,
  chainDeployments,
  databaseOperations,
  websocketConnections,
  metricsMiddleware
};



















