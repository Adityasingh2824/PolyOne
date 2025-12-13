// Environment variable validation and configuration
const dotenvSafe = require('dotenv-safe');
const path = require('path');

// Load .env file with validation
try {
  dotenvSafe.config({
    path: path.join(__dirname, '../../.env'),
    example: path.join(__dirname, '../../.env.example'),
    allowEmptyValues: true
  });
} catch (error) {
  // In development, allow missing .env.example
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  .env.example not found, skipping validation');
    require('dotenv').config();
  } else {
    throw error;
  }
}

// Validate required environment variables
const requiredEnvVars = {
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT || '5000'
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value || value === '')
  .map(([key]) => key);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Export validated configuration
module.exports = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'polyone',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres123',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Polygon
  POLYGON_RPC_URL: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  POLYGON_AMOY_RPC_URL: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
  ZKEVM_RPC_URL: process.env.ZKEVM_RPC_URL || 'https://zkevm-rpc.com',

  // Smart Contracts
  PRIVATE_KEY: process.env.PRIVATE_KEY || '',
  CHAIN_FACTORY_ADDRESS: process.env.CHAIN_FACTORY_ADDRESS || '',
  CHAIN_REGISTRY_ADDRESS: process.env.CHAIN_REGISTRY_ADDRESS || '',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Security
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  AUTH_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5', 10),

  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  PROMETHEUS_PORT: parseInt(process.env.PROMETHEUS_PORT || '9090', 10)
};

