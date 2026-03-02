-- ============================================================================
-- CHAIN HEALTH MONITORING TABLES
-- ============================================================================

-- Health check results table
CREATE TABLE IF NOT EXISTS chain_health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Overall status
  status VARCHAR(50) NOT NULL CHECK (status IN ('healthy', 'warning', 'degraded', 'unhealthy', 'error')),
  health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  
  -- Individual check results
  rpc_status VARCHAR(50),
  rpc_response_time_ms INTEGER,
  rpc_block_number BIGINT,
  rpc_error TEXT,
  
  block_production_status VARCHAR(50),
  current_block BIGINT,
  block_time_seconds DECIMAL(10,2),
  block_time_variance DECIMAL(10,2),
  
  validator_status VARCHAR(50),
  total_validators INTEGER,
  active_validators INTEGER,
  inactive_validators INTEGER,
  
  performance_status VARCHAR(50),
  tps DECIMAL(10,2),
  avg_block_time DECIMAL(10,2),
  total_transactions BIGINT,
  
  network_status VARCHAR(50),
  network_response_time_ms INTEGER,
  
  -- Issues detected
  issues JSONB DEFAULT '[]'::jsonb,
  severity VARCHAR(50) CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  
  -- Timestamps
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for chain_health_checks
CREATE INDEX IF NOT EXISTS idx_chain_health_checks_chain_id ON chain_health_checks(chain_id);
CREATE INDEX IF NOT EXISTS idx_chain_health_checks_checked_at ON chain_health_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_chain_health_checks_status ON chain_health_checks(status);

-- Uptime tracking table
CREATE TABLE IF NOT EXISTS chain_uptime_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Uptime metrics
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_uptime_seconds BIGINT DEFAULT 0,
  total_downtime_seconds BIGINT DEFAULT 0,
  uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
  
  -- Current status
  current_status VARCHAR(50) DEFAULT 'unknown' CHECK (current_status IN ('healthy', 'unhealthy', 'unknown')),
  last_status_change TIMESTAMP WITH TIME ZONE,
  
  -- Statistics
  total_status_changes INTEGER DEFAULT 0,
  longest_uptime_period_seconds BIGINT DEFAULT 0,
  longest_downtime_period_seconds BIGINT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(chain_id)
);

-- Health incidents table
CREATE TABLE IF NOT EXISTS chain_health_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Incident details
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'detected', 'resolved', 'recovery_attempted', 'recovery_successful', 'recovery_failed'
  )),
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'closed')),
  
  -- Description
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Health data snapshot
  health_data JSONB DEFAULT '{}'::jsonb,
  recovery_actions JSONB DEFAULT '[]'::jsonb,
  
  -- Resolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- Timestamps
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for chain_health_incidents
CREATE INDEX IF NOT EXISTS idx_chain_health_incidents_chain_id ON chain_health_incidents(chain_id);
CREATE INDEX IF NOT EXISTS idx_chain_health_incidents_status ON chain_health_incidents(status);
CREATE INDEX IF NOT EXISTS idx_chain_health_incidents_severity ON chain_health_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_chain_health_incidents_detected_at ON chain_health_incidents(detected_at);

-- Alert rules table
CREATE TABLE IF NOT EXISTS chain_alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Alert thresholds
  tps_min DECIMAL(10,2),
  tps_max DECIMAL(10,2),
  block_time_max DECIMAL(10,2),
  uptime_min DECIMAL(5,2),
  validators_min INTEGER,
  response_time_max_ms INTEGER,
  error_rate_max DECIMAL(5,2),
  
  -- Alert configuration
  enabled BOOLEAN DEFAULT true,
  check_interval_seconds INTEGER DEFAULT 300, -- 5 minutes
  alert_channels JSONB DEFAULT '[]'::jsonb, -- ['email', 'webhook', 'sms']
  
  -- Notification settings
  notify_on_warning BOOLEAN DEFAULT true,
  notify_on_error BOOLEAN DEFAULT true,
  notify_on_critical BOOLEAN DEFAULT true,
  escalation_enabled BOOLEAN DEFAULT false,
  escalation_delay_minutes INTEGER DEFAULT 30,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(chain_id)
);

-- Recovery actions log
CREATE TABLE IF NOT EXISTS chain_recovery_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES chain_health_incidents(id) ON DELETE SET NULL,
  
  -- Action details
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'restart_rpc', 'scale_validators', 'optimize_performance', 'restart_chain', 'failover', 'manual'
  )),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  
  -- Action parameters
  parameters JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  
  -- Execution
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  error_message TEXT,
  
  -- Triggered by
  triggered_by VARCHAR(50) DEFAULT 'system' CHECK (triggered_by IN ('system', 'user', 'scheduled')),
  triggered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for chain_recovery_actions
CREATE INDEX IF NOT EXISTS idx_chain_recovery_actions_chain_id ON chain_recovery_actions(chain_id);
CREATE INDEX IF NOT EXISTS idx_chain_recovery_actions_status ON chain_recovery_actions(status);
CREATE INDEX IF NOT EXISTS idx_chain_recovery_actions_created_at ON chain_recovery_actions(created_at);

-- Performance history table (for trending)
CREATE TABLE IF NOT EXISTS chain_performance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('minute', 'hour', 'day')),
  
  -- Performance metrics
  avg_tps DECIMAL(10,2),
  avg_block_time DECIMAL(10,2),
  total_transactions BIGINT,
  total_blocks BIGINT,
  avg_gas_price DECIMAL(78,0),
  avg_response_time_ms INTEGER,
  
  -- Health metrics
  health_score INTEGER,
  uptime_percentage DECIMAL(5,2),
  active_validators INTEGER,
  
  -- Issues count
  warnings_count INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(chain_id, period_start, period_type)
);

-- Indexes for chain_performance_history
CREATE INDEX IF NOT EXISTS idx_chain_performance_history_chain_id ON chain_performance_history(chain_id);
CREATE INDEX IF NOT EXISTS idx_chain_performance_history_period_start ON chain_performance_history(period_start);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update chain uptime tracking
CREATE OR REPLACE FUNCTION update_chain_uptime()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    UPDATE chain_uptime_tracking
    SET 
      last_status_change = NOW(),
      total_status_changes = total_status_changes + 1,
      updated_at = NOW()
    WHERE chain_id = NEW.chain_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update uptime on chain status change
DROP TRIGGER IF EXISTS trigger_update_chain_uptime ON chains;
CREATE TRIGGER trigger_update_chain_uptime
  AFTER UPDATE OF status ON chains
  FOR EACH ROW
  EXECUTE FUNCTION update_chain_uptime();

-- Function to auto-create uptime tracking on chain creation
CREATE OR REPLACE FUNCTION create_chain_uptime_tracking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chain_uptime_tracking (chain_id, start_time, current_status)
  VALUES (NEW.id, NOW(), 'unknown')
  ON CONFLICT (chain_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create uptime tracking
DROP TRIGGER IF EXISTS trigger_create_chain_uptime_tracking ON chains;
CREATE TRIGGER trigger_create_chain_uptime_tracking
  AFTER INSERT ON chains
  FOR EACH ROW
  EXECUTE FUNCTION create_chain_uptime_tracking();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for chain health summary
CREATE OR REPLACE VIEW chain_health_summary AS
SELECT 
  c.id,
  c.name,
  c.status as chain_status,
  chc.status as health_status,
  chc.health_score,
  chc.checked_at as last_health_check,
  cut.uptime_percentage,
  cut.current_status as uptime_status,
  cut.total_uptime_seconds,
  cut.total_downtime_seconds,
  (
    SELECT COUNT(*) 
    FROM chain_health_incidents chi 
    WHERE chi.chain_id = c.id 
    AND chi.status = 'open'
  ) as open_incidents_count,
  (
    SELECT COUNT(*) 
    FROM chain_health_incidents chi 
    WHERE chi.chain_id = c.id 
    AND chi.severity = 'critical'
    AND chi.status = 'open'
  ) as critical_incidents_count
FROM chains c
LEFT JOIN LATERAL (
  SELECT * FROM chain_health_checks 
  WHERE chain_id = c.id 
  ORDER BY checked_at DESC 
  LIMIT 1
) chc ON true
LEFT JOIN chain_uptime_tracking cut ON c.id = cut.chain_id
WHERE c.deleted_at IS NULL;
