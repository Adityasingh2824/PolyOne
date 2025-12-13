-- PolyOne Database Schema for Supabase
-- Complete schema with Bridge, Analytics, User Management, and Billing features
-- Version: 2.0.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- USERS TABLE (Enhanced with profile management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  wallet_address VARCHAR(42) UNIQUE,
  
  -- User roles and permissions
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user', 'viewer')),
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Profile information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  company VARCHAR(255),
  job_title VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en',
  
  -- Contact info
  phone VARCHAR(20),
  twitter_handle VARCHAR(50),
  github_handle VARCHAR(50),
  discord_handle VARCHAR(50),
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  
  -- Subscription info
  subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise', 'custom')),
  subscription_id UUID,
  
  -- Metadata
  preferences JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- ORGANIZATIONS TABLE (Enhanced team management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  
  -- Owner
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Billing
  billing_email VARCHAR(255),
  billing_address JSONB DEFAULT '{}'::jsonb,
  tax_id VARCHAR(50),
  
  -- Subscription
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_id UUID,
  
  -- Limits
  max_members INTEGER DEFAULT 5,
  max_chains INTEGER DEFAULT 3,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  settings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role and permissions
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'billing')),
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Chain-specific permissions
  chain_permissions JSONB DEFAULT '{}'::jsonb, -- {chain_id: ['read', 'write', 'admin']}
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- CHAINS TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS chains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  
  -- Chain configuration
  chain_type VARCHAR(50) NOT NULL CHECK (chain_type IN ('rollup', 'validium', 'sidechain')),
  rollup_type VARCHAR(50) NOT NULL CHECK (rollup_type IN ('zk-rollup', 'optimistic-rollup', 'validium')),
  gas_token VARCHAR(10) NOT NULL DEFAULT 'POL',
  validator_access VARCHAR(50) DEFAULT 'public' CHECK (validator_access IN ('public', 'permissioned', 'private')),
  validators_count INTEGER DEFAULT 3 CHECK (validators_count >= 1),
  
  -- Status
  status VARCHAR(50) DEFAULT 'deploying' CHECK (status IN (
    'deploying', 'active', 'paused', 'inactive', 'upgrading', 
    'failed', 'deleted', 'maintenance', 'scaling'
  )),
  
  -- Chain identifiers
  chain_id BIGINT UNIQUE,
  blockchain_tx_hash VARCHAR(66),
  blockchain_chain_id INTEGER,
  on_chain_id BIGINT, -- ID in the smart contract
  
  -- Network endpoints
  rpc_url TEXT,
  ws_url TEXT,
  explorer_url TEXT,
  bridge_url TEXT,
  polygon_scan_url TEXT,
  
  -- Performance metrics
  uptime DECIMAL(5,2) DEFAULT 0.00 CHECK (uptime >= 0 AND uptime <= 100),
  tps INTEGER DEFAULT 0,
  transactions BIGINT DEFAULT 0,
  total_blocks BIGINT DEFAULT 0,
  avg_block_time DECIMAL(10,2),
  current_block BIGINT DEFAULT 0,
  
  -- Resource usage
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  bandwidth_used_gb DECIMAL(10,2) DEFAULT 0,
  compute_units_used BIGINT DEFAULT 0,
  
  -- AggLayer integration
  agglayer_chain_id VARCHAR(100),
  agglayer_status VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deployed_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,
  network_config JSONB DEFAULT '{}'::jsonb, -- gas limits, block size, etc.
  security_config JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Flags
  is_on_chain BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  is_testnet BOOLEAN DEFAULT true,
  bridge_enabled BOOLEAN DEFAULT false,
  analytics_enabled BOOLEAN DEFAULT true
);

-- ============================================================================
-- VALIDATORS TABLE (Enhanced with staking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS validators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(42) NOT NULL,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT,
  
  -- Validator status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
    'pending', 'active', 'inactive', 'slashed', 'jailed', 'unbonding', 'removed'
  )),
  is_genesis BOOLEAN DEFAULT false,
  
  -- Staking info
  stake_amount DECIMAL(30,18) DEFAULT 0,
  min_stake_required DECIMAL(30,18) DEFAULT 0,
  rewards_earned DECIMAL(30,18) DEFAULT 0,
  rewards_claimed DECIMAL(30,18) DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 5.00, -- percentage
  
  -- Delegation
  delegations_received DECIMAL(30,18) DEFAULT 0,
  delegators_count INTEGER DEFAULT 0,
  
  -- Performance metrics
  total_blocks_produced BIGINT DEFAULT 0,
  total_blocks_proposed BIGINT DEFAULT 0,
  missed_blocks BIGINT DEFAULT 0,
  uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
  avg_response_time_ms INTEGER,
  
  -- Slashing
  slash_count INTEGER DEFAULT 0,
  total_slashed DECIMAL(30,18) DEFAULT 0,
  jail_until TIMESTAMP WITH TIME ZONE,
  
  -- Node info
  node_ip VARCHAR(45),
  node_port INTEGER,
  p2p_address TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(chain_id, address)
);

-- ============================================================================
-- BRIDGE TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bridge_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User and chain info
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  source_chain_id UUID REFERENCES chains(id) ON DELETE SET NULL,
  destination_chain_id UUID REFERENCES chains(id) ON DELETE SET NULL,
  
  -- Chain identifiers (for external chains)
  source_chain_network_id BIGINT NOT NULL,
  destination_chain_network_id BIGINT NOT NULL,
  
  -- Transaction details
  tx_type VARCHAR(50) NOT NULL CHECK (tx_type IN ('deposit', 'withdraw', 'claim', 'transfer')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'initiated', 'processing', 'confirming', 
    'ready_to_claim', 'claimed', 'completed', 'failed', 'refunded'
  )),
  
  -- Token info
  token_address VARCHAR(42) NOT NULL,
  token_symbol VARCHAR(20),
  token_decimals INTEGER DEFAULT 18,
  amount DECIMAL(78,0) NOT NULL, -- Raw amount (wei)
  amount_formatted DECIMAL(38,18), -- Human readable
  
  -- Fees
  bridge_fee DECIMAL(78,0) DEFAULT 0,
  gas_fee_source DECIMAL(78,0) DEFAULT 0,
  gas_fee_destination DECIMAL(78,0) DEFAULT 0,
  
  -- Transaction hashes
  source_tx_hash VARCHAR(66),
  destination_tx_hash VARCHAR(66),
  claim_tx_hash VARCHAR(66),
  
  -- Addresses
  sender_address VARCHAR(42) NOT NULL,
  recipient_address VARCHAR(42) NOT NULL,
  
  -- Proof and verification
  merkle_proof TEXT,
  deposit_count BIGINT,
  global_exit_root VARCHAR(66),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  initiated_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- BRIDGE SUPPORTED TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bridge_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Token info
  token_address VARCHAR(42) NOT NULL,
  wrapped_address VARCHAR(42), -- Address on the other chain
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  decimals INTEGER DEFAULT 18,
  logo_url TEXT,
  
  -- Bridge config
  min_amount DECIMAL(78,0) DEFAULT 0,
  max_amount DECIMAL(78,0),
  daily_limit DECIMAL(78,0),
  bridge_fee_percentage DECIMAL(5,4) DEFAULT 0.001, -- 0.1%
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_native BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(chain_id, token_address)
);

-- ============================================================================
-- ANALYTICS - TRANSACTION ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transaction_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  
  -- Transaction metrics
  total_transactions BIGINT DEFAULT 0,
  successful_transactions BIGINT DEFAULT 0,
  failed_transactions BIGINT DEFAULT 0,
  pending_transactions BIGINT DEFAULT 0,
  
  -- Volume
  total_value_transferred DECIMAL(78,0) DEFAULT 0, -- in wei
  avg_transaction_value DECIMAL(78,0) DEFAULT 0,
  
  -- Gas metrics
  total_gas_used BIGINT DEFAULT 0,
  avg_gas_used BIGINT DEFAULT 0,
  total_gas_fees DECIMAL(78,0) DEFAULT 0,
  avg_gas_price DECIMAL(78,0) DEFAULT 0,
  
  -- Performance
  avg_confirmation_time_ms INTEGER,
  max_confirmation_time_ms INTEGER,
  min_confirmation_time_ms INTEGER,
  
  -- Unique metrics
  unique_senders INTEGER DEFAULT 0,
  unique_receivers INTEGER DEFAULT 0,
  unique_contracts_called INTEGER DEFAULT 0,
  
  -- Contract interactions
  contract_deployments INTEGER DEFAULT 0,
  contract_calls INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(chain_id, period_start, period_type)
);

-- ============================================================================
-- ANALYTICS - GAS ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS gas_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  
  -- Gas price metrics (in wei)
  avg_gas_price DECIMAL(78,0) DEFAULT 0,
  min_gas_price DECIMAL(78,0) DEFAULT 0,
  max_gas_price DECIMAL(78,0) DEFAULT 0,
  median_gas_price DECIMAL(78,0) DEFAULT 0,
  
  -- Base fee metrics (EIP-1559)
  avg_base_fee DECIMAL(78,0) DEFAULT 0,
  min_base_fee DECIMAL(78,0) DEFAULT 0,
  max_base_fee DECIMAL(78,0) DEFAULT 0,
  
  -- Priority fee metrics
  avg_priority_fee DECIMAL(78,0) DEFAULT 0,
  suggested_priority_fee DECIMAL(78,0) DEFAULT 0,
  
  -- Usage metrics
  total_gas_used BIGINT DEFAULT 0,
  avg_gas_limit BIGINT DEFAULT 0,
  gas_utilization_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Block metrics
  avg_block_gas_used BIGINT DEFAULT 0,
  avg_block_gas_limit BIGINT DEFAULT 0,
  
  -- Fee estimation
  slow_gas_price DECIMAL(78,0) DEFAULT 0, -- 25th percentile
  standard_gas_price DECIMAL(78,0) DEFAULT 0, -- 50th percentile
  fast_gas_price DECIMAL(78,0) DEFAULT 0, -- 75th percentile
  instant_gas_price DECIMAL(78,0) DEFAULT 0, -- 90th percentile
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(chain_id, period_start, period_type)
);

-- ============================================================================
-- ANALYTICS - USER ACTIVITY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_activity_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chain_id UUID REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Activity metrics
  logins_count INTEGER DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  dashboard_views INTEGER DEFAULT 0,
  
  -- Chain activity
  chains_created INTEGER DEFAULT 0,
  chains_deleted INTEGER DEFAULT 0,
  chains_paused INTEGER DEFAULT 0,
  
  -- Validator activity
  validators_added INTEGER DEFAULT 0,
  validators_removed INTEGER DEFAULT 0,
  
  -- Bridge activity
  bridge_deposits INTEGER DEFAULT 0,
  bridge_withdrawals INTEGER DEFAULT 0,
  bridge_volume DECIMAL(78,0) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, chain_id, period_start, period_type)
);

-- ============================================================================
-- ANALYTICS - CHAIN PERFORMANCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS chain_performance_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  
  -- Block metrics
  blocks_produced INTEGER DEFAULT 0,
  avg_block_time_ms INTEGER,
  min_block_time_ms INTEGER,
  max_block_time_ms INTEGER,
  
  -- Transaction throughput
  tps_avg DECIMAL(10,2) DEFAULT 0,
  tps_max DECIMAL(10,2) DEFAULT 0,
  tps_min DECIMAL(10,2) DEFAULT 0,
  
  -- Uptime
  uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
  downtime_minutes INTEGER DEFAULT 0,
  incidents_count INTEGER DEFAULT 0,
  
  -- Resource usage
  cpu_usage_avg DECIMAL(5,2),
  memory_usage_avg DECIMAL(5,2),
  storage_used_gb DECIMAL(10,2),
  bandwidth_used_gb DECIMAL(10,2),
  
  -- Network metrics
  peer_count_avg INTEGER,
  latency_avg_ms INTEGER,
  
  -- State metrics
  state_size_bytes BIGINT,
  accounts_count BIGINT,
  contracts_count BIGINT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(chain_id, period_start, period_type)
);

-- ============================================================================
-- ANALYTICS EXPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chain_id UUID REFERENCES chains(id) ON DELETE SET NULL,
  
  -- Export details
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN (
    'transactions', 'gas_analytics', 'performance', 'user_activity', 'full_report'
  )),
  format VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'pdf', 'json', 'xlsx')),
  
  -- Date range
  date_from TIMESTAMP WITH TIME ZONE NOT NULL,
  date_to TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- File info
  file_name VARCHAR(255),
  file_url TEXT,
  file_size_bytes BIGINT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- BILLING - SUBSCRIPTION PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Limits
  max_chains INTEGER DEFAULT 1,
  max_validators_per_chain INTEGER DEFAULT 3,
  max_tps INTEGER DEFAULT 100,
  max_storage_gb INTEGER DEFAULT 10,
  max_bandwidth_gb INTEGER DEFAULT 100,
  max_team_members INTEGER DEFAULT 1,
  max_api_calls_per_month INTEGER DEFAULT 10000,
  
  -- Features
  features JSONB DEFAULT '[]'::jsonb,
  bridge_enabled BOOLEAN DEFAULT false,
  analytics_enabled BOOLEAN DEFAULT false,
  custom_domain_enabled BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  sla_percentage DECIMAL(5,2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- BILLING - SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Subscription details
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
    'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused', 'expired'
  )),
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Payment provider
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  
  -- Dates
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  canceled_at TIMESTAMP WITH TIME ZONE,
  
  -- Billing
  next_invoice_date TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Usage tracking
  chains_used INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  bandwidth_used_gb DECIMAL(10,2) DEFAULT 0,
  api_calls_used INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- BILLING - INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Invoice details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
    'draft', 'open', 'paid', 'void', 'uncollectible'
  )),
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_due DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Billing period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Due date
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Payment provider
  stripe_invoice_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  
  -- Line items
  line_items JSONB DEFAULT '[]'::jsonb,
  
  -- PDF
  invoice_pdf_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- BILLING - PAYMENT METHODS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Payment method details
  type VARCHAR(50) NOT NULL CHECK (type IN ('card', 'bank_account', 'crypto', 'other')),
  provider VARCHAR(50) DEFAULT 'stripe',
  
  -- Card details (masked)
  card_brand VARCHAR(20),
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  -- Crypto details
  crypto_address VARCHAR(100),
  crypto_network VARCHAR(50),
  
  -- Provider IDs
  stripe_payment_method_id VARCHAR(255),
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CHECK (user_id IS NOT NULL OR organization_id IS NOT NULL)
);

-- ============================================================================
-- BILLING - PAYMENT HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL CHECK (status IN (
    'pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded'
  )),
  
  -- Type
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN (
    'subscription', 'one_time', 'refund', 'usage_based'
  )),
  
  -- Provider
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  
  -- Crypto payment
  tx_hash VARCHAR(66),
  
  -- Error handling
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- BILLING - USAGE RECORDS TABLE (for metered billing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  chain_id UUID REFERENCES chains(id) ON DELETE SET NULL,
  
  -- Usage type
  usage_type VARCHAR(50) NOT NULL CHECK (usage_type IN (
    'api_calls', 'storage', 'bandwidth', 'compute', 'transactions', 'bridge_volume'
  )),
  
  -- Usage data
  quantity DECIMAL(20,6) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- 'calls', 'GB', 'units', etc.
  unit_price DECIMAL(10,6) DEFAULT 0,
  
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Billing
  billed BOOLEAN DEFAULT false,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- CHAIN BACKUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS chain_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Backup type
  backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'snapshot', 'scheduled')),
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'failed', 'restoring', 'restored', 'deleted'
  )),
  
  -- Backup details
  size_bytes BIGINT,
  block_height BIGINT,
  state_root VARCHAR(66),
  storage_location TEXT,
  backup_hash VARCHAR(66),
  
  -- Encryption
  is_encrypted BOOLEAN DEFAULT true,
  encryption_key_id VARCHAR(255),
  
  -- Retention
  retention_days INTEGER DEFAULT 30,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- CHAIN UPGRADES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS chain_upgrades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Upgrade type
  upgrade_type VARCHAR(50) NOT NULL CHECK (upgrade_type IN (
    'protocol', 'config', 'validator', 'contract', 'network', 'security'
  )),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'scheduled', 'in_progress', 'completed', 'failed', 'rolled_back', 'canceled'
  )),
  
  -- Version info
  from_version VARCHAR(50),
  to_version VARCHAR(50) NOT NULL,
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE,
  maintenance_window_start TIMESTAMP WITH TIME ZONE,
  maintenance_window_end TIMESTAMP WITH TIME ZONE,
  
  -- Upgrade details
  description TEXT,
  release_notes TEXT,
  breaking_changes JSONB DEFAULT '[]'::jsonb,
  rollback_available BOOLEAN DEFAULT true,
  auto_rollback_on_failure BOOLEAN DEFAULT true,
  
  -- Pre-flight checks
  pre_flight_checks JSONB DEFAULT '[]'::jsonb,
  pre_flight_passed BOOLEAN,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  rolled_back_at TIMESTAMP WITH TIME ZONE,
  
  -- Changes and metadata
  changes JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- CHAIN EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS chain_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'created', 'deployed', 'paused', 'resumed', 'upgraded', 
    'backup_created', 'backup_restored', 'validator_added', 
    'validator_removed', 'validator_slashed', 'scaled_up', 'scaled_down',
    'deleted', 'failed', 'config_updated', 'bridge_enabled', 'bridge_disabled',
    'maintenance_started', 'maintenance_ended', 'incident_detected', 'incident_resolved'
  )),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  
  -- Event details
  title VARCHAR(255),
  description TEXT,
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Related resources
  validator_id UUID REFERENCES validators(id) ON DELETE SET NULL,
  backup_id UUID REFERENCES chain_backups(id) ON DELETE SET NULL,
  upgrade_id UUID REFERENCES chain_upgrades(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional data
  data JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- VALIDATOR PERFORMANCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS validator_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  validator_id UUID NOT NULL REFERENCES validators(id) ON DELETE CASCADE,
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  period_type VARCHAR(20) DEFAULT 'hourly' CHECK (period_type IN ('hourly', 'daily', 'weekly')),
  
  -- Block production
  blocks_produced INTEGER DEFAULT 0,
  blocks_proposed INTEGER DEFAULT 0,
  blocks_missed INTEGER DEFAULT 0,
  block_production_rate DECIMAL(5,2) DEFAULT 100.00,
  
  -- Transaction processing
  transactions_processed BIGINT DEFAULT 0,
  transactions_validated BIGINT DEFAULT 0,
  
  -- Uptime
  uptime_seconds BIGINT DEFAULT 0,
  uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
  
  -- Performance
  avg_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  min_response_time_ms INTEGER,
  
  -- Rewards and penalties
  rewards_earned DECIMAL(30,18) DEFAULT 0,
  penalties_applied DECIMAL(30,18) DEFAULT 0,
  slash_events INTEGER DEFAULT 0,
  
  -- Network
  peer_count_avg INTEGER,
  sync_lag_blocks INTEGER,
  
  -- Timestamps
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional metrics
  metrics JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(validator_id, period_start, period_type)
);

-- ============================================================================
-- API KEYS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Key details
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL, -- First few characters for identification
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  
  -- Permissions
  scopes JSONB DEFAULT '[]'::jsonb,
  allowed_chains JSONB DEFAULT '[]'::jsonb, -- Empty = all chains
  allowed_ips JSONB DEFAULT '[]'::jsonb, -- Empty = all IPs
  
  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  requests_today INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- ACTIVITY LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  chain_id UUID REFERENCES chains(id) ON DELETE SET NULL,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  
  -- Activity details
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  
  -- Status
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
  
  -- Request details
  ip_address INET,
  user_agent TEXT,
  request_method VARCHAR(10),
  request_path TEXT,
  request_body JSONB,
  response_status INTEGER,
  
  -- Duration
  duration_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Notification details
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'info', 'success', 'warning', 'error', 
    'chain_event', 'validator_alert', 'billing', 
    'security', 'announcement', 'bridge_update'
  )),
  category VARCHAR(50) DEFAULT 'general',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related resources
  chain_id UUID REFERENCES chains(id) ON DELETE CASCADE,
  validator_id UUID REFERENCES validators(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Actions
  action_url TEXT,
  action_label VARCHAR(50),
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_email_sent BOOLEAN DEFAULT false,
  is_push_sent BOOLEAN DEFAULT false,
  
  -- Timestamps
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional data
  data JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Email notifications
  email_chain_events BOOLEAN DEFAULT true,
  email_validator_alerts BOOLEAN DEFAULT true,
  email_billing BOOLEAN DEFAULT true,
  email_security BOOLEAN DEFAULT true,
  email_announcements BOOLEAN DEFAULT true,
  email_weekly_digest BOOLEAN DEFAULT true,
  
  -- Push notifications
  push_chain_events BOOLEAN DEFAULT true,
  push_validator_alerts BOOLEAN DEFAULT true,
  push_billing BOOLEAN DEFAULT false,
  push_security BOOLEAN DEFAULT true,
  
  -- In-app notifications
  inapp_all BOOLEAN DEFAULT true,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================================================
-- WEBHOOKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  chain_id UUID REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Webhook details
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret VARCHAR(255) NOT NULL,
  
  -- Events to subscribe to
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Delivery settings
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Last delivery info
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_delivery_status VARCHAR(20),
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- WEBHOOK DELIVERIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  
  -- Delivery details
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  response_status INTEGER,
  response_body TEXT,
  
  -- Timing
  attempt_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Error
  error_message TEXT
);

-- ============================================================================
-- INDEXES for Performance Optimization
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Chains indexes
CREATE INDEX IF NOT EXISTS idx_chains_user_id ON chains(user_id);
CREATE INDEX IF NOT EXISTS idx_chains_organization_id ON chains(organization_id);
CREATE INDEX IF NOT EXISTS idx_chains_status ON chains(status);
CREATE INDEX IF NOT EXISTS idx_chains_chain_id ON chains(chain_id);
CREATE INDEX IF NOT EXISTS idx_chains_created_at ON chains(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chains_is_on_chain ON chains(is_on_chain);
CREATE INDEX IF NOT EXISTS idx_chains_name_trgm ON chains USING gin(name gin_trgm_ops);

-- Validators indexes
CREATE INDEX IF NOT EXISTS idx_validators_chain_id ON validators(chain_id);
CREATE INDEX IF NOT EXISTS idx_validators_status ON validators(status);
CREATE INDEX IF NOT EXISTS idx_validators_address ON validators(address);
CREATE INDEX IF NOT EXISTS idx_validators_created_at ON validators(created_at DESC);

-- Bridge transactions indexes
CREATE INDEX IF NOT EXISTS idx_bridge_tx_user_id ON bridge_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_tx_source_chain ON bridge_transactions(source_chain_id);
CREATE INDEX IF NOT EXISTS idx_bridge_tx_dest_chain ON bridge_transactions(destination_chain_id);
CREATE INDEX IF NOT EXISTS idx_bridge_tx_status ON bridge_transactions(status);
CREATE INDEX IF NOT EXISTS idx_bridge_tx_created_at ON bridge_transactions(created_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_tx_analytics_chain_period ON transaction_analytics(chain_id, period_start, period_type);
CREATE INDEX IF NOT EXISTS idx_gas_analytics_chain_period ON gas_analytics(chain_id, period_start, period_type);
CREATE INDEX IF NOT EXISTS idx_chain_perf_chain_period ON chain_performance_analytics(chain_id, period_start, period_type);

-- Billing indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_chain_id ON activity_logs(chain_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chains_updated_at ON chains;
CREATE TRIGGER update_chains_updated_at BEFORE UPDATE ON chains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_validators_updated_at ON validators;
CREATE TRIGGER update_validators_updated_at BEFORE UPDATE ON validators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('invoice_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

DROP TRIGGER IF EXISTS set_invoice_number ON invoices;
CREATE TRIGGER set_invoice_number BEFORE INSERT ON invoices
  FOR EACH ROW WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION generate_invoice_number();

-- Function to calculate subscription usage
CREATE OR REPLACE FUNCTION calculate_subscription_usage(sub_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'chains_used', COUNT(DISTINCT c.id),
    'storage_used_gb', COALESCE(SUM(c.storage_used_gb), 0),
    'bandwidth_used_gb', COALESCE(SUM(c.bandwidth_used_gb), 0),
    'validators_count', COALESCE(SUM(c.validators_count), 0)
  ) INTO result
  FROM chains c
  JOIN subscriptions s ON (s.user_id = c.user_id OR s.organization_id = c.organization_id)
  WHERE s.id = sub_id AND c.deleted_at IS NULL;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE validators ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Chains policies
DROP POLICY IF EXISTS "Users can view own chains" ON chains;
CREATE POLICY "Users can view own chains" ON chains
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can create chains" ON chains;
CREATE POLICY "Users can create chains" ON chains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chains" ON chains;
CREATE POLICY "Users can update own chains" ON chains
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chains" ON chains;
CREATE POLICY "Users can delete own chains" ON chains
  FOR DELETE USING (auth.uid() = user_id);

-- Validators policies
DROP POLICY IF EXISTS "Users can view validators of own chains" ON validators;
CREATE POLICY "Users can view validators of own chains" ON validators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chains 
      WHERE chains.id = validators.chain_id 
      AND chains.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage validators of own chains" ON validators;
CREATE POLICY "Users can manage validators of own chains" ON validators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chains 
      WHERE chains.id = validators.chain_id 
      AND chains.user_id = auth.uid()
    )
  );

-- Bridge transactions policies
DROP POLICY IF EXISTS "Users can view own bridge transactions" ON bridge_transactions;
CREATE POLICY "Users can view own bridge transactions" ON bridge_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Invoices policies
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

-- API Keys policies
DROP POLICY IF EXISTS "Users can manage own API keys" ON api_keys;
CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- VIEWS for Common Queries
-- ============================================================================

-- View for chain statistics
CREATE OR REPLACE VIEW chain_statistics AS
SELECT 
  c.id,
  c.name,
  c.status,
  c.validators_count,
  COUNT(DISTINCT v.id) as actual_validators,
  COUNT(DISTINCT CASE WHEN v.status = 'active' THEN v.id END) as active_validators,
  SUM(v.stake_amount) as total_stake,
  AVG(v.uptime_percentage) as avg_validator_uptime,
  c.tps,
  c.transactions,
  c.uptime,
  c.current_block,
  c.storage_used_gb,
  c.bandwidth_used_gb
FROM chains c
LEFT JOIN validators v ON c.id = v.chain_id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- View for user dashboard statistics
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT c.id) as total_chains,
  COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_chains,
  COUNT(DISTINCT CASE WHEN c.is_on_chain THEN c.id END) as on_chain_chains,
  SUM(c.validators_count) as total_validators,
  SUM(c.transactions) as total_transactions,
  SUM(c.storage_used_gb) as total_storage_gb,
  (
    SELECT COUNT(*) FROM bridge_transactions bt 
    WHERE bt.user_id = u.id AND bt.status = 'completed'
  ) as total_bridge_transactions
FROM users u
LEFT JOIN chains c ON u.id = c.user_id AND c.deleted_at IS NULL
GROUP BY u.id;

-- View for billing summary
CREATE OR REPLACE VIEW billing_summary AS
SELECT 
  s.id as subscription_id,
  s.user_id,
  s.organization_id,
  sp.name as plan_name,
  sp.price_monthly,
  s.status,
  s.billing_cycle,
  s.current_period_start,
  s.current_period_end,
  s.chains_used,
  sp.max_chains,
  s.storage_used_gb,
  sp.max_storage_gb,
  s.api_calls_used,
  sp.max_api_calls_per_month,
  (
    SELECT COALESCE(SUM(amount), 0) 
    FROM payment_history ph 
    WHERE ph.subscription_id = s.id AND ph.status = 'succeeded'
  ) as total_paid
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id;

-- ============================================================================
-- SEED DATA - Default Subscription Plans
-- ============================================================================

INSERT INTO subscription_plans (id, name, slug, description, price_monthly, price_yearly, max_chains, max_validators_per_chain, max_tps, max_storage_gb, max_bandwidth_gb, max_team_members, max_api_calls_per_month, features, bridge_enabled, analytics_enabled, priority_support)
VALUES 
  (
    uuid_generate_v4(),
    'Free',
    'free',
    'Perfect for testing and development',
    0,
    0,
    1,
    3,
    100,
    5,
    50,
    1,
    1000,
    '["Basic chain deployment", "Community support", "Public dashboard"]'::jsonb,
    false,
    false,
    false
  ),
  (
    uuid_generate_v4(),
    'Starter',
    'starter',
    'For small projects and startups',
    49,
    490,
    3,
    5,
    500,
    25,
    250,
    3,
    10000,
    '["All Free features", "Email support", "Basic analytics", "Custom gas token"]'::jsonb,
    true,
    true,
    false
  ),
  (
    uuid_generate_v4(),
    'Professional',
    'professional',
    'For growing businesses',
    199,
    1990,
    10,
    10,
    2000,
    100,
    1000,
    10,
    100000,
    '["All Starter features", "Priority support", "Advanced analytics", "Custom domain", "SLA 99.9%"]'::jsonb,
    true,
    true,
    true
  ),
  (
    uuid_generate_v4(),
    'Enterprise',
    'enterprise',
    'For large organizations',
    999,
    9990,
    -1,
    25,
    10000,
    500,
    5000,
    -1,
    -1,
    '["All Professional features", "Dedicated support", "Custom SLA", "On-premise option", "White-label"]'::jsonb,
    true,
    true,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- COMMENTS for Documentation
-- ============================================================================

COMMENT ON TABLE users IS 'Stores user account information with profile and subscription data';
COMMENT ON TABLE organizations IS 'Stores organization/team information';
COMMENT ON TABLE chains IS 'Stores blockchain chain configurations and status';
COMMENT ON TABLE validators IS 'Stores validator nodes for each chain with staking info';
COMMENT ON TABLE bridge_transactions IS 'Tracks all bridge transactions between chains';
COMMENT ON TABLE bridge_tokens IS 'Supported tokens for bridging';
COMMENT ON TABLE transaction_analytics IS 'Aggregated transaction analytics per chain';
COMMENT ON TABLE gas_analytics IS 'Gas price and usage analytics';
COMMENT ON TABLE chain_performance_analytics IS 'Chain performance metrics over time';
COMMENT ON TABLE subscription_plans IS 'Available subscription plans';
COMMENT ON TABLE subscriptions IS 'User/org subscriptions';
COMMENT ON TABLE invoices IS 'Billing invoices';
COMMENT ON TABLE payment_history IS 'All payment transactions';
COMMENT ON TABLE activity_logs IS 'Audit log for all user actions';
COMMENT ON TABLE notifications IS 'User notifications and alerts';
COMMENT ON TABLE webhooks IS 'Webhook configurations for event delivery';
