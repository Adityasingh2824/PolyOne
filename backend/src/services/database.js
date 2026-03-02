const { supabase, isSupabaseConfigured } = require('../config/supabase');

// Fallback in-memory storage
const inMemoryStorage = {
  users: new Map(),
  chains: new Map(),
  validators: new Map(),
  chainEvents: new Map(),
  chainBackups: new Map(),
  chainUpgrades: new Map(),
  subscriptions: new Map(),
  invoices: new Map(),
  payments: new Map(),
  usage: new Map(),
  notifications: new Map(),
  organizations: new Map(),
  healthChecks: new Map(),
  healthIncidents: new Map(),
  uptimeTracking: new Map(),
  serviceCredits: new Map()
};

// Export inMemoryStorage for direct access in development
if (process.env.NODE_ENV === 'development') {
  module.exports.inMemoryStorage = inMemoryStorage;
}

class DatabaseService {
  constructor() {
    this.useSupabase = isSupabaseConfigured();
    
    // Log detailed configuration status
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();
    
    if (!this.useSupabase) {
      // Only show warning if Supabase was partially configured
      // If completely empty, assume intentional use of in-memory storage
      const hasSupabaseVars = supabaseUrl || supabaseKey;
      if (hasSupabaseVars) {
        console.warn('⚠️  Database Service: Using in-memory storage (data will be lost on restart)');
        console.warn('⚠️  Supabase URL present:', !!supabaseUrl);
        console.warn('⚠️  Supabase Key present:', !!supabaseKey);
        if (!supabaseUrl) {
          console.warn('⚠️  Missing SUPABASE_URL environment variable');
        }
        if (!supabaseKey) {
          console.warn('⚠️  Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable');
        }
      } else {
        console.log('📝 Database Service: Using in-memory storage (Supabase not configured)');
        console.log('💡 To use Supabase, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
      }
    } else {
      console.log('✅ Database Service: Using Supabase');
      console.log('📋 Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'not set');
      // Test connection
      const { testSupabaseConnection } = require('../config/supabase');
      testSupabaseConnection().catch(err => {
        console.error('❌ Supabase connection test failed:', err.message);
      });
    }
  }

  // ============================================================================
  // USERS
  // ============================================================================

  async createUser(userData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const id = userData.id || require('uuid').v4();
      const user = { ...userData, id, created_at: new Date().toISOString() };
      inMemoryStorage.users.set(id, user);
      return user;
    }
  }

  async getUserByEmail(email) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      return Array.from(inMemoryStorage.users.values()).find(u => u.email === email);
    }
  }

  async getUserById(id) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      return inMemoryStorage.users.get(id);
    }
  }

  async updateUser(id, updates) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const user = inMemoryStorage.users.get(id);
      if (user) {
        const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
        inMemoryStorage.users.set(id, updated);
        return updated;
      }
      return null;
    }
  }

  async deleteUser(id) {
    if (this.useSupabase) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } else {
      inMemoryStorage.users.delete(id);
      return true;
    }
  }

  // ============================================================================
  // CHAINS
  // ============================================================================

  async createChain(chainData) {
    try {
      // Ensure user_id is set correctly
      if (!chainData.user_id && chainData.userId) {
        chainData.user_id = chainData.userId;
      }
      if (!chainData.userId && chainData.user_id) {
        chainData.userId = chainData.user_id;
      }
      
      console.log('💾 Creating chain with data:', {
        id: chainData.id,
        name: chainData.name,
        user_id: chainData.user_id,
        userId: chainData.userId
      });
      
      if (this.useSupabase) {
        // Prepare data for Supabase (remove userId if it's not a column)
        const supabaseData = { ...chainData };
        // Keep both user_id and userId for compatibility
        if (!supabaseData.user_id && supabaseData.userId) {
          supabaseData.user_id = supabaseData.userId;
        }
        
        const { data, error } = await supabase
          .from('chains')
          .insert([supabaseData])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating chain in Supabase:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          throw error;
        }
        
        console.log('✅ Chain created in Supabase:', data.id, 'for user:', data.user_id);
        console.log('📋 Created chain data:', JSON.stringify(data, null, 2));
        
        // Create initial event
        try {
          await this.createChainEvent({
            chain_id: data.id,
            event_type: 'created',
            description: `Chain ${data.name} created`,
            triggered_by: data.user_id
          });
        } catch (eventError) {
          console.warn('Failed to create chain event:', eventError);
        }
        
        return data;
      } else {
        const id = chainData.id || require('uuid').v4();
        const chain = { 
          ...chainData, 
          id,
          // Ensure created_at and updated_at are set
          created_at: chainData.created_at || new Date().toISOString(),
          updated_at: chainData.updated_at || new Date().toISOString(),
          // Ensure both user_id and userId are set for compatibility
          user_id: chainData.user_id || chainData.userId,
          userId: chainData.userId || chainData.user_id
        };
        
        // Store in memory
        inMemoryStorage.chains.set(id, chain);
        
        // Verify it was stored
        const stored = inMemoryStorage.chains.get(id);
        if (!stored) {
          throw new Error('Failed to store chain in memory');
        }
        
        console.log('✅ Chain created in memory storage:', id, 'for user:', chain.user_id);
        console.log('📊 Total chains in storage:', inMemoryStorage.chains.size);
        console.log('🔍 Verifying storage - chain exists:', !!stored);
        console.log('📋 Stored chain data:', JSON.stringify(stored, null, 2));
        
        return chain;
      }
    } catch (error) {
      console.error('❌ Error in createChain:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  async getChainById(id) {
    try {
      if (this.useSupabase) {
        console.log(`🔍 getChainById (Supabase): Looking for chain ID: ${id}`);
        const { data, error } = await supabase
          .from('chains')
          .select('*')
          .eq('id', id)
          .is('deleted_at', null)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Not found - this is expected for non-existent chains
            console.log(`⚠️ Chain not found in Supabase: ${id}`);
            return null;
          }
          console.error('Error fetching chain from Supabase:', error);
          throw error;
        }
        
        if (data) {
          console.log(`✅ Chain found in Supabase: ${data.id} for user: ${data.user_id}`);
        }
        return data;
      } else {
        // First try direct lookup
        let chain = inMemoryStorage.chains.get(id);
        if (chain) {
          console.log(`✅ Found chain by direct ID lookup: ${id}`);
          return chain;
        }
        
        // If not found, search all chains (in case ID format differs)
        console.log(`🔍 Chain not found by direct ID, searching all chains for: ${id}`);
        console.log(`📊 Total chains in storage: ${inMemoryStorage.chains.size}`);
        
        const allChains = Array.from(inMemoryStorage.chains.values());
        chain = allChains.find(c => {
          const matches = String(c.id) === String(id) || 
                         c.id === id ||
                         String(c.id).includes(String(id)) ||
                         String(id).includes(String(c.id));
          if (matches) {
            console.log(`✅ Found chain by search: ${c.id} (matches ${id})`);
          }
          return matches;
        });
        
        if (chain) {
          return chain;
        }
        
        // Log all chain IDs for debugging
        if (allChains.length > 0) {
          console.log('📋 All chain IDs in storage:');
          allChains.forEach(c => {
            console.log(`  - ID: ${c.id}, Name: ${c.name}, User: ${c.user_id}`);
          });
        } else {
          console.log('⚠️ No chains found in storage at all!');
        }
        
        return null;
      }
    } catch (error) {
      console.error('❌ Error in getChainById:', error);
      throw error;
    }
  }

  async getUserChains(userId) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('chains')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching chains from Supabase:', error);
          throw error;
        }
        console.log(`✅ getUserChains (Supabase): userId=${userId}, found ${data?.length || 0} chains`);
        return data || [];
      } else {
        const allChains = Array.from(inMemoryStorage.chains.values());
        console.log(`🔍 getUserChains (memory): userId=${userId}, total chains in storage: ${allChains.length}`);
        
        // Log all chains for debugging
        if (allChains.length > 0) {
          console.log('📋 All chains in storage:');
          allChains.forEach(c => {
            console.log(`  - Chain ID: ${c.id}, user_id: ${c.user_id}, name: ${c.name}`);
          });
        }
        
        const userChains = allChains.filter(c => {
          // Match by user_id (can be wallet address or userId)
          const matches = c.user_id === userId || c.userId === userId;
          if (matches) {
            console.log(`  ✓ Matched chain: ${c.id} (user_id: ${c.user_id})`);
          }
          return matches;
        });
        
        console.log(`✅ getUserChains (memory): found ${userChains.length} chains for userId=${userId}`);
        return userChains;
      }
    } catch (error) {
      console.error('❌ Error in getUserChains:', error);
      throw error;
    }
  }

  async updateChain(id, updates) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('chains')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Try direct lookup first
        let chain = inMemoryStorage.chains.get(id);
        
        // If not found, search all chains
        if (!chain) {
          console.log(`🔍 Chain ${id} not found by direct lookup, searching all chains...`);
          const allChains = Array.from(inMemoryStorage.chains.values());
          chain = allChains.find(c => String(c.id) === String(id) || c.id === id);
        }
        
        if (chain) {
          const updated = { ...chain, ...updates, updated_at: new Date().toISOString() };
          inMemoryStorage.chains.set(id, updated);
          console.log(`✅ Chain updated: ${id}, status: ${updates.status || chain.status}`);
          return updated;
        } else {
          console.error(`❌ Cannot update chain ${id}: not found in storage`);
          console.log(`📊 Total chains in storage: ${inMemoryStorage.chains.size}`);
          return null;
        }
      }
    } catch (error) {
      console.error('❌ Error in updateChain:', error);
      throw error;
    }
  }

  async pauseChain(chainId, userId) {
    const updates = {
      status: 'paused',
      paused_at: new Date().toISOString()
    };
    
    const chain = await this.updateChain(chainId, updates);
    
    if (chain && this.useSupabase) {
      await this.createChainEvent({
        chain_id: chainId,
        event_type: 'paused',
        description: `Chain paused`,
        triggered_by: userId
      });
    }
    
    return chain;
  }

  async resumeChain(chainId, userId) {
    const updates = {
      status: 'active',
      paused_at: null
    };
    
    const chain = await this.updateChain(chainId, updates);
    
    if (chain && this.useSupabase) {
      await this.createChainEvent({
        chain_id: chainId,
        event_type: 'resumed',
        description: `Chain resumed`,
        triggered_by: userId
      });
    }
    
    return chain;
  }

  async deleteChain(id) {
    if (this.useSupabase) {
      // Soft delete
      const { data, error } = await supabase
        .from('chains')
        .update({ deleted_at: new Date().toISOString(), status: 'deleted' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      inMemoryStorage.chains.delete(id);
      return true;
    }
  }

  // ============================================================================
  // VALIDATORS
  // ============================================================================

  async createValidator(validatorData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('validators')
        .insert([validatorData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Log event
      await this.createChainEvent({
        chain_id: data.chain_id,
        event_type: 'validator_added',
        description: `Validator ${data.name} added`,
        data: { validator_id: data.id, address: data.address }
      });
      
      return data;
    } else {
      const id = validatorData.id || require('uuid').v4();
      const validator = { 
        ...validatorData, 
        id, 
        created_at: new Date().toISOString() 
      };
      inMemoryStorage.validators.set(id, validator);
      return validator;
    }
  }

  async getChainValidators(chainId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('validators')
        .select('*')
        .eq('chain_id', chainId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } else {
      return Array.from(inMemoryStorage.validators.values())
        .filter(v => v.chain_id === chainId);
    }
  }

  async getValidatorById(validatorId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('validators')
        .select('*')
        .eq('id', validatorId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      return inMemoryStorage.validators.get(validatorId);
    }
  }

  async updateValidator(id, updates) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('validators')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const validator = inMemoryStorage.validators.get(id);
      if (validator) {
        const updated = { ...validator, ...updates, updated_at: new Date().toISOString() };
        inMemoryStorage.validators.set(id, updated);
        return updated;
      }
      return null;
    }
  }

  async removeValidator(id, chainId, userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('validators')
        .update({ status: 'removed', deactivated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log event
      await this.createChainEvent({
        chain_id: chainId,
        event_type: 'validator_removed',
        description: `Validator removed`,
        triggered_by: userId,
        data: { validator_id: id }
      });
      
      return data;
    } else {
      inMemoryStorage.validators.delete(id);
      return true;
    }
  }

  // ============================================================================
  // CHAIN EVENTS
  // ============================================================================

  async createChainEvent(eventData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_events')
        .insert([eventData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const id = require('uuid').v4();
      const event = { 
        ...eventData, 
        id, 
        created_at: new Date().toISOString() 
      };
      inMemoryStorage.chainEvents.set(id, event);
      return event;
    }
  }

  async getChainEvents(chainId, limit = 50) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_events')
        .select('*')
        .eq('chain_id', chainId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    } else {
      return Array.from(inMemoryStorage.chainEvents.values())
        .filter(e => e.chain_id === chainId)
        .slice(0, limit);
    }
  }

  // ============================================================================
  // CHAIN BACKUPS
  // ============================================================================

  async createChainBackup(backupData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_backups')
        .insert([backupData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Log event
      await this.createChainEvent({
        chain_id: data.chain_id,
        event_type: 'backup_created',
        description: `Chain backup created (${data.backup_type})`,
        data: { backup_id: data.id }
      });
      
      return data;
    } else {
      const id = require('uuid').v4();
      const backup = { 
        ...backupData, 
        id, 
        created_at: new Date().toISOString() 
      };
      inMemoryStorage.chainBackups.set(id, backup);
      return backup;
    }
  }

  async getChainBackups(chainId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_backups')
        .select('*')
        .eq('chain_id', chainId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } else {
      return Array.from(inMemoryStorage.chainBackups.values())
        .filter(b => b.chain_id === chainId);
    }
  }

  async updateChainBackup(id, updates) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_backups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const backup = inMemoryStorage.chainBackups.get(id);
      if (backup) {
        const updated = { ...backup, ...updates };
        inMemoryStorage.chainBackups.set(id, updated);
        return updated;
      }
      return null;
    }
  }

  // ============================================================================
  // CHAIN UPGRADES
  // ============================================================================

  async createChainUpgrade(upgradeData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_upgrades')
        .insert([upgradeData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Log event
      await this.createChainEvent({
        chain_id: data.chain_id,
        event_type: 'upgraded',
        description: `Chain upgrade initiated (${data.from_version} → ${data.to_version})`,
        data: { upgrade_id: data.id }
      });
      
      return data;
    } else {
      const id = require('uuid').v4();
      const upgrade = { 
        ...upgradeData, 
        id, 
        created_at: new Date().toISOString() 
      };
      inMemoryStorage.chainUpgrades.set(id, upgrade);
      return upgrade;
    }
  }

  async getChainUpgrades(chainId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_upgrades')
        .select('*')
        .eq('chain_id', chainId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } else {
      return Array.from(inMemoryStorage.chainUpgrades.values())
        .filter(u => u.chain_id === chainId);
    }
  }

  async getChainUpgradeById(upgradeId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_upgrades')
        .select('*')
        .eq('id', upgradeId)
        .single();
      
      if (error) throw error;
      return data;
    } else {
      return inMemoryStorage.chainUpgrades.get(upgradeId) ||
        Array.from(inMemoryStorage.chainUpgrades.values()).find(u => u.id === upgradeId) ||
        null;
    }
  }

  /**
   * Get the latest completed upgrade for a chain that is eligible for auto-rollback
   * (completed within withinMinutes, has auto_rollback_on_failure true, not already rolled back)
   */
  async getLatestCompletedUpgradeForAutoRollback(chainId, withinMinutes = 24 * 60) {
    const upgrades = await this.getChainUpgrades(chainId);
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    const eligible = upgrades.filter(u =>
      u.status === 'completed' &&
      u.auto_rollback_on_failure === true &&
      u.rollback_available !== false &&
      new Date(u.completed_at || u.created_at) >= cutoff
    );
    return eligible.length > 0 ? eligible[0] : null;
  }

  async updateChainUpgrade(id, updates) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_upgrades')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const upgrade = inMemoryStorage.chainUpgrades.get(id);
      if (upgrade) {
        const updated = { ...upgrade, ...updates };
        inMemoryStorage.chainUpgrades.set(id, updated);
        return updated;
      }
      return null;
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  async getUserDashboardStats(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('user_dashboard_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || {
        total_chains: 0,
        active_chains: 0,
        on_chain_chains: 0,
        total_validators: 0,
        total_transactions: 0
      };
    } else {
      const chains = Array.from(inMemoryStorage.chains.values())
        .filter(c => c.user_id === userId);
      
      return {
        total_chains: chains.length,
        active_chains: chains.filter(c => c.status === 'active').length,
        on_chain_chains: chains.filter(c => c.is_on_chain).length,
        total_validators: chains.reduce((sum, c) => sum + (c.validators_count || 0), 0),
        total_transactions: chains.reduce((sum, c) => sum + (c.transactions || 0), 0)
      };
    }
  }

  // ============================================================================
  // BILLING & SUBSCRIPTIONS
  // ============================================================================

  async getSubscriptionPlans() {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } else {
      // Return default plans for in-memory storage
      return [
        {
          id: '1',
          name: 'Starter',
          price: 29,
          duration: 30,
          features: ['3 Chains', 'Basic Support', '10 Validators'],
          popular: false,
          isActive: true
        },
        {
          id: '2',
          name: 'Professional',
          price: 99,
          duration: 30,
          features: ['10 Chains', 'Priority Support', '50 Validators', 'Advanced Analytics'],
          popular: true,
          isActive: true
        },
        {
          id: '3',
          name: 'Enterprise',
          price: 299,
          duration: 30,
          features: ['Unlimited Chains', '24/7 Support', 'Unlimited Validators', 'Custom Features'],
          popular: false,
          isActive: true
        }
      ];
    }
  }

  async getSubscriptionPlanById(planId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      const plans = await this.getSubscriptionPlans();
      return plans.find(p => p.id === planId);
    }
  }

  async getUserSubscriptions(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } else {
      // In-memory storage for subscriptions
      if (!inMemoryStorage.subscriptions) {
        inMemoryStorage.subscriptions = new Map();
      }
      return Array.from(inMemoryStorage.subscriptions.values())
        .filter(s => s.userId === userId || s.user_id === userId);
    }
  }

  async getSubscriptionById(subscriptionId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('id', subscriptionId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      if (!inMemoryStorage.subscriptions) {
        inMemoryStorage.subscriptions = new Map();
      }
      return inMemoryStorage.subscriptions.get(subscriptionId);
    }
  }

  async createSubscription(subscriptionData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([{
          id: subscriptionData.id,
          user_id: subscriptionData.userId,
          plan_id: subscriptionData.planId,
          status: subscriptionData.status,
          start_time: new Date(subscriptionData.startTime * 1000).toISOString(),
          end_time: new Date(subscriptionData.endTime * 1000).toISOString(),
          auto_renew: subscriptionData.autoRenew,
          is_active: subscriptionData.isActive
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      if (!inMemoryStorage.subscriptions) {
        inMemoryStorage.subscriptions = new Map();
      }
      const id = subscriptionData.id;
      const subscription = {
        ...subscriptionData,
        id,
        created_at: new Date().toISOString()
      };
      inMemoryStorage.subscriptions.set(id, subscription);
      return subscription;
    }
  }

  async cancelSubscription(subscriptionId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          is_active: false,
          canceled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      if (!inMemoryStorage.subscriptions) {
        inMemoryStorage.subscriptions = new Map();
      }
      const subscription = inMemoryStorage.subscriptions.get(subscriptionId);
      if (subscription) {
        subscription.status = 'canceled';
        subscription.isActive = false;
        subscription.canceledAt = new Date().toISOString();
        inMemoryStorage.subscriptions.set(subscriptionId, subscription);
      }
      return subscription;
    }
  }

  async getUserInvoices(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } else {
      if (!inMemoryStorage.invoices) {
        inMemoryStorage.invoices = new Map();
      }
      return Array.from(inMemoryStorage.invoices.values())
        .filter(i => i.userId === userId || i.user_id === userId);
    }
  }

  async getInvoiceById(invoiceId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      if (!inMemoryStorage.invoices) {
        inMemoryStorage.invoices = new Map();
      }
      return inMemoryStorage.invoices.get(invoiceId);
    }
  }

  async payInvoice(invoiceId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          is_paid: true,
          paid_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      if (!inMemoryStorage.invoices) {
        inMemoryStorage.invoices = new Map();
      }
      const invoice = inMemoryStorage.invoices.get(invoiceId);
      if (invoice) {
        invoice.status = 'paid';
        invoice.isPaid = true;
        invoice.paidAt = new Date().toISOString();
        inMemoryStorage.invoices.set(invoiceId, invoice);
      }
      return invoice;
    }
  }

  // ============================================================================
  // SERVICE CREDITS (partner appchains - offset operational costs)
  // ============================================================================

  async getServiceCreditsBalance(userId, organizationId = null) {
    if (this.useSupabase) {
      let query = supabase.from('service_credits').select('*');
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      } else {
        query = query.eq('user_id', userId).is('organization_id', null);
      }
      const { data, error } = await query.single();
      if (error && error.code !== 'PGRST116') throw error;
      return data ? parseFloat(data.balance) : 0;
    } else {
      const key = organizationId ? `org:${organizationId}` : userId;
      const row = inMemoryStorage.serviceCredits.get(key);
      return row ? parseFloat(row.balance) : 0;
    }
  }

  async getServiceCreditsRecord(userId, organizationId = null) {
    if (this.useSupabase) {
      let query = supabase.from('service_credits').select('*');
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      } else {
        query = query.eq('user_id', userId).is('organization_id', null);
      }
      const { data, error } = await query.single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      const key = organizationId ? `org:${organizationId}` : userId;
      return inMemoryStorage.serviceCredits.get(key) || null;
    }
  }

  async addServiceCredits(userId, amount, reason = 'partner_onboarding', organizationId = null, isPartnerAppchain = false) {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) throw new Error('Invalid amount');

    if (this.useSupabase) {
      const existing = await this.getServiceCreditsRecord(userId, organizationId);
      const newBalance = (existing ? parseFloat(existing.balance) : 0) + amt;
      const row = {
        user_id: organizationId ? null : userId,
        organization_id: organizationId || null,
        balance: newBalance,
        is_partner_appchain: isPartnerAppchain,
        updated_at: new Date().toISOString()
      };
      if (existing) {
        const { data, error } = await supabase
          .from('service_credits')
          .update(row)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('service_credits')
          .insert([{ ...row }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } else {
      const key = organizationId ? `org:${organizationId}` : userId;
      const row = inMemoryStorage.serviceCredits.get(key) || {
        balance: 0,
        isPartnerAppchain: false
      };
      row.balance = (parseFloat(row.balance) || 0) + amt;
      row.isPartnerAppchain = isPartnerAppchain || row.isPartnerAppchain;
      inMemoryStorage.serviceCredits.set(key, row);
      return row;
    }
  }

  async applyServiceCreditsToInvoice(invoiceId, amount, userId) {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) throw new Error('Invalid amount');

    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    const invoiceUserId = invoice.user_id || invoice.userId;
    if (invoiceUserId !== userId) throw new Error('Unauthorized');

    const balance = await this.getServiceCreditsBalance(userId);
    const amountDue = parseFloat(invoice.amount_due ?? invoice.amountDue ?? invoice.total ?? 0);
    const toApply = Math.min(amt, balance, amountDue);
    if (toApply <= 0) throw new Error('No credits to apply or invoice already covered');

    if (this.useSupabase) {
      const record = await this.getServiceCreditsRecord(userId);
      if (!record) throw new Error('No service credits record');
      await supabase
        .from('service_credits')
        .update({
          balance: parseFloat(record.balance) - toApply,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);

      await supabase
        .from('invoices')
        .update({
          service_credits_applied: (parseFloat(invoice.service_credits_applied) || 0) + toApply,
          amount_due: amountDue - toApply,
          amount_paid: (parseFloat(invoice.amount_paid) || 0) + toApply,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);
    } else {
      const key = userId;
      const row = inMemoryStorage.serviceCredits.get(key);
      if (row) row.balance = Math.max(0, (parseFloat(row.balance) || 0) - toApply);
      const inv = inMemoryStorage.invoices.get(invoiceId);
      if (inv) {
        inv.service_credits_applied = (parseFloat(inv.service_credits_applied) || 0) + toApply;
        inv.amount_due = (parseFloat(inv.amount_due) || inv.amountDue || 0) - toApply;
        inv.amount_paid = (parseFloat(inv.amount_paid) || 0) + toApply;
      }
    }
    return { applied: toApply, newAmountDue: amountDue - toApply };
  }

  async getUserPaymentHistory(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } else {
      if (!inMemoryStorage.payments) {
        inMemoryStorage.payments = new Map();
      }
      return Array.from(inMemoryStorage.payments.values())
        .filter(p => p.userId === userId || p.user_id === userId);
    }
  }

  async getUserUsageRecords(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('usage_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } else {
      if (!inMemoryStorage.usage) {
        inMemoryStorage.usage = new Map();
      }
      return Array.from(inMemoryStorage.usage.values())
        .filter(u => u.userId === userId || u.user_id === userId);
    }
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  async getNotifications(userId, options = {}) {
    const { unreadOnly = false, limit = 50, offset = 0 } = options;
    
    if (this.useSupabase) {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);
      
      if (unreadOnly) {
        query = query.eq('is_read', false);
      }
      
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } else {
      if (!inMemoryStorage.notifications) {
        inMemoryStorage.notifications = new Map();
      }
      let notifications = Array.from(inMemoryStorage.notifications.values())
        .filter(n => n.userId === userId || n.user_id === userId);
      
      if (unreadOnly) {
        notifications = notifications.filter(n => !n.isRead && !n.is_read);
      }
      
      notifications.sort((a, b) => {
        const aTime = new Date(a.created_at || a.createdAt || 0);
        const bTime = new Date(b.created_at || b.createdAt || 0);
        return bTime - aTime;
      });
      
      return notifications.slice(offset, offset + limit);
    }
  }

  async getUnreadNotificationCount(userId) {
    if (this.useSupabase) {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (error) throw error;
      return count || 0;
    } else {
      if (!inMemoryStorage.notifications) {
        inMemoryStorage.notifications = new Map();
      }
      return Array.from(inMemoryStorage.notifications.values())
        .filter(n => (n.userId === userId || n.user_id === userId) && !n.isRead && !n.is_read).length;
    }
  }

  async createNotification(notificationData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      if (!inMemoryStorage.notifications) {
        inMemoryStorage.notifications = new Map();
      }
      const id = notificationData.id || require('uuid').v4();
      const notification = {
        ...notificationData,
        id,
        created_at: new Date().toISOString(),
        is_read: false,
        isRead: false
      };
      inMemoryStorage.notifications.set(id, notification);
      return notification;
    }
  }

  async markNotificationAsRead(notificationId, userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      if (!inMemoryStorage.notifications) {
        inMemoryStorage.notifications = new Map();
      }
      const notification = inMemoryStorage.notifications.get(notificationId);
      if (notification && (notification.userId === userId || notification.user_id === userId)) {
        notification.isRead = true;
        notification.is_read = true;
        notification.readAt = new Date().toISOString();
        notification.read_at = notification.readAt;
        inMemoryStorage.notifications.set(notificationId, notification);
      }
      return notification;
    }
  }

  async markAllNotificationsAsRead(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();
      
      if (error) throw error;
      return data || [];
    } else {
      if (!inMemoryStorage.notifications) {
        inMemoryStorage.notifications = new Map();
      }
      const updated = [];
      for (const [id, notification] of inMemoryStorage.notifications.entries()) {
        if ((notification.userId === userId || notification.user_id === userId) && !notification.isRead && !notification.is_read) {
          notification.isRead = true;
          notification.is_read = true;
          notification.readAt = new Date().toISOString();
          notification.read_at = notification.readAt;
          inMemoryStorage.notifications.set(id, notification);
          updated.push(notification);
        }
      }
      return updated;
    }
  }

  async deleteNotification(notificationId, userId) {
    if (this.useSupabase) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return { success: true };
    } else {
      if (!inMemoryStorage.notifications) {
        inMemoryStorage.notifications = new Map();
      }
      const notification = inMemoryStorage.notifications.get(notificationId);
      if (notification && (notification.userId === userId || notification.user_id === userId)) {
        inMemoryStorage.notifications.delete(notificationId);
        return { success: true };
      }
      throw new Error('Notification not found');
    }
  }

  // ============================================================================
  // ORGANIZATIONS & WHITE-LABEL
  // ============================================================================

  async createOrganization(orgData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('organizations')
        .insert([orgData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      if (!inMemoryStorage.organizations) {
        inMemoryStorage.organizations = new Map();
      }
      const id = orgData.id || require('uuid').v4();
      const org = {
        ...orgData,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      inMemoryStorage.organizations.set(id, org);
      return org;
    }
  }

  async getOrganizationById(orgId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      if (!inMemoryStorage.organizations) {
        inMemoryStorage.organizations = new Map();
      }
      return inMemoryStorage.organizations.get(orgId);
    }
  }

  async getOrganizationByDomain(domain) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('custom_domain', domain)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      if (!inMemoryStorage.organizations) {
        inMemoryStorage.organizations = new Map();
      }
      return Array.from(inMemoryStorage.organizations.values())
        .find(org => org.custom_domain === domain && org.is_active !== false);
    }
  }

  async getUserOrganizations(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .or(`owner_id.eq.${userId},members.cs.{${userId}}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } else {
      if (!inMemoryStorage.organizations) {
        inMemoryStorage.organizations = new Map();
      }
      return Array.from(inMemoryStorage.organizations.values())
        .filter(org => org.owner_id === userId || (org.members && org.members.includes(userId)));
    }
  }

  async updateOrganization(orgId, updates) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('organizations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', orgId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      if (!inMemoryStorage.organizations) {
        inMemoryStorage.organizations = new Map();
      }
      const org = inMemoryStorage.organizations.get(orgId);
      if (org) {
        const updated = { ...org, ...updates, updated_at: new Date().toISOString() };
        inMemoryStorage.organizations.set(orgId, updated);
        return updated;
      }
      return null;
    }
  }

  async getWhiteLabelSettings(orgId) {
    const org = await this.getOrganizationById(orgId);
    if (!org) return null;

    return {
      branding: {
        logo: org.logo_url || null,
        favicon: org.favicon_url || null,
        companyName: org.name || null,
        supportEmail: org.support_email || null,
      },
      colors: {
        primary: org.primary_color || '#a855f7',
        secondary: org.secondary_color || '#ec4899',
        accent: org.accent_color || '#06b6d4',
        background: org.background_color || '#030014',
      },
      domain: org.custom_domain || null,
      termsOfService: org.terms_of_service_url || null,
      customCss: org.custom_css || null,
    };
  }

  // ============================================================================
  // HEALTH MONITORING
  // ============================================================================

  async createHealthCheck(chainId, healthData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_health_checks')
        .insert([{
          chain_id: chainId,
          status: healthData.status,
          health_score: healthData.score,
          rpc_status: healthData.checks?.rpc?.status,
          rpc_response_time_ms: healthData.checks?.rpc?.responseTime,
          rpc_block_number: healthData.checks?.rpc?.blockNumber,
          block_production_status: healthData.checks?.blocks?.status,
          current_block: healthData.checks?.blocks?.currentBlock,
          block_time_seconds: healthData.checks?.blocks?.blockTime,
          validator_status: healthData.checks?.validators?.status,
          total_validators: healthData.checks?.validators?.total,
          active_validators: healthData.checks?.validators?.active,
          performance_status: healthData.checks?.performance?.status,
          tps: healthData.checks?.performance?.tps,
          network_status: healthData.checks?.network?.status,
          issues: healthData.issues || [],
          severity: healthData.severity || 'info'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // In-memory storage for health checks
      if (!inMemoryStorage.healthChecks) {
        inMemoryStorage.healthChecks = new Map();
      }
      const id = require('uuid').v4();
      const check = {
        id,
        chain_id: chainId,
        ...healthData,
        checked_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      inMemoryStorage.healthChecks.set(id, check);
      return check;
    }
  }

  async getHealthChecks(chainId, limit = 100) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_health_checks')
        .select('*')
        .eq('chain_id', chainId)
        .order('checked_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } else {
      if (!inMemoryStorage.healthChecks) {
        return [];
      }
      return Array.from(inMemoryStorage.healthChecks.values())
        .filter(h => h.chain_id === chainId)
        .sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at))
        .slice(0, limit);
    }
  }

  async createHealthIncident(chainId, incidentData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_health_incidents')
        .insert([{
          chain_id: chainId,
          type: incidentData.type,
          severity: incidentData.severity,
          status: incidentData.status || 'open',
          title: incidentData.title || incidentData.description,
          description: incidentData.description,
          health_data: incidentData.healthData || {},
          recovery_actions: incidentData.recoveryActions || []
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // In-memory storage
      if (!inMemoryStorage.healthIncidents) {
        inMemoryStorage.healthIncidents = new Map();
      }
      const id = incidentData.id || require('uuid').v4();
      const incident = {
        id,
        chain_id: chainId,
        ...incidentData,
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      inMemoryStorage.healthIncidents.set(id, incident);
      return incident;
    }
  }

  async getHealthIncidents(chainId, options = {}) {
    const { limit = 50, status, severity } = options;
    
    if (this.useSupabase) {
      let query = supabase
        .from('chain_health_incidents')
        .select('*')
        .eq('chain_id', chainId)
        .order('detected_at', { ascending: false })
        .limit(limit);
      
      if (status) {
        query = query.eq('status', status);
      }
      if (severity) {
        query = query.eq('severity', severity);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      if (!inMemoryStorage.healthIncidents) {
        return [];
      }
      let incidents = Array.from(inMemoryStorage.healthIncidents.values())
        .filter(i => i.chain_id === chainId);
      
      if (status) {
        incidents = incidents.filter(i => i.status === status);
      }
      if (severity) {
        incidents = incidents.filter(i => i.severity === severity);
      }
      
      return incidents
        .sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at))
        .slice(0, limit);
    }
  }

  async updateUptimeTracking(chainId, uptimeData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_uptime_tracking')
        .upsert([{
          chain_id: chainId,
          total_uptime_seconds: uptimeData.totalUptime,
          total_downtime_seconds: uptimeData.totalDowntime,
          uptime_percentage: uptimeData.uptimePercentage,
          current_status: uptimeData.lastStatus,
          last_status_change: uptimeData.statusChanges?.[uptimeData.statusChanges.length - 1]?.timestamp,
          total_status_changes: uptimeData.statusChanges?.length || 0,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'chain_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // In-memory storage
      if (!inMemoryStorage.uptimeTracking) {
        inMemoryStorage.uptimeTracking = new Map();
      }
      const tracking = {
        chain_id: chainId,
        ...uptimeData,
        updated_at: new Date().toISOString()
      };
      inMemoryStorage.uptimeTracking.set(chainId, tracking);
      return tracking;
    }
  }

  async getUptimeTracking(chainId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('chain_uptime_tracking')
        .select('*')
        .eq('chain_id', chainId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      if (!inMemoryStorage.uptimeTracking) {
        return null;
      }
      return inMemoryStorage.uptimeTracking.get(chainId) || null;
    }
  }
}

  // ============================================================================
  // BRIDGE TRANSACTIONS
  // ============================================================================

  async createBridgeTransaction(data) {
    if (this.useSupabase) {
      const { data: row, error } = await supabase
        .from('bridge_transactions')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return row;
    } else {
      const id = data.id || require('uuid').v4();
      const tx = { ...data, id, created_at: data.created_at || new Date().toISOString() };
      if (!inMemoryStorage.bridgeTransactions) inMemoryStorage.bridgeTransactions = new Map();
      inMemoryStorage.bridgeTransactions.set(id, tx);
      return tx;
    }
  }

  async getBridgeTransactions(userId, { chainId, status, limit = 50, offset = 0 } = {}) {
    if (this.useSupabase) {
      let query = supabase
        .from('bridge_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (chainId) query = query.or(`source_chain_id.eq.${chainId},destination_chain_id.eq.${chainId}`);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      if (!inMemoryStorage.bridgeTransactions) return [];
      let txs = Array.from(inMemoryStorage.bridgeTransactions.values())
        .filter(tx => tx.user_id === userId);
      if (chainId) txs = txs.filter(tx => tx.source_chain_id === chainId || tx.destination_chain_id === chainId);
      if (status) txs = txs.filter(tx => tx.status === status);
      txs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return txs.slice(offset, offset + limit);
    }
  }

  async updateBridgeTransaction(id, updates) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('bridge_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      if (!inMemoryStorage.bridgeTransactions) return null;
      const existing = inMemoryStorage.bridgeTransactions.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates };
      inMemoryStorage.bridgeTransactions.set(id, updated);
      return updated;
    }
  }

  // ============================================================================
  // API KEYS
  // ============================================================================

  async createApiKey(data) {
    if (this.useSupabase) {
      const { data: row, error } = await supabase
        .from('api_keys')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return row;
    } else {
      const id = data.id || require('uuid').v4();
      const key = { ...data, id, created_at: new Date().toISOString() };
      if (!inMemoryStorage.apiKeys) inMemoryStorage.apiKeys = new Map();
      inMemoryStorage.apiKeys.set(id, key);
      return key;
    }
  }

  async getApiKeysByUser(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, scopes, is_active, last_used_at, created_at, expires_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      if (!inMemoryStorage.apiKeys) return [];
      return Array.from(inMemoryStorage.apiKeys.values())
        .filter(k => k.user_id === userId)
        .map(({ key_hash, ...rest }) => rest); // don't expose hash
    }
  }

  async getApiKeyByHash(keyHash) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      if (!inMemoryStorage.apiKeys) return null;
      return Array.from(inMemoryStorage.apiKeys.values())
        .find(k => k.key_hash === keyHash && k.is_active);
    }
  }

  async revokeApiKey(id, userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('api_keys')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      if (!inMemoryStorage.apiKeys) return null;
      const key = inMemoryStorage.apiKeys.get(id);
      if (!key || key.user_id !== userId) return null;
      key.is_active = false;
      key.revoked_at = new Date().toISOString();
      return key;
    }
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  async createWebhook(data) {
    if (this.useSupabase) {
      const { data: row, error } = await supabase
        .from('webhooks')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return row;
    } else {
      const id = data.id || require('uuid').v4();
      const wh = { ...data, id, created_at: new Date().toISOString() };
      if (!inMemoryStorage.webhooks) inMemoryStorage.webhooks = new Map();
      inMemoryStorage.webhooks.set(id, wh);
      return wh;
    }
  }

  async getWebhooksByUser(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      if (!inMemoryStorage.webhooks) return [];
      return Array.from(inMemoryStorage.webhooks.values()).filter(w => w.user_id === userId);
    }
  }

  async getWebhookById(id) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      if (!inMemoryStorage.webhooks) return null;
      return inMemoryStorage.webhooks.get(id) || null;
    }
  }

  async updateWebhook(id, updates) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      if (!inMemoryStorage.webhooks) return null;
      const existing = inMemoryStorage.webhooks.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
      inMemoryStorage.webhooks.set(id, updated);
      return updated;
    }
  }

  async deleteWebhook(id, userId) {
    if (this.useSupabase) {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      return true;
    } else {
      if (!inMemoryStorage.webhooks) return false;
      const wh = inMemoryStorage.webhooks.get(id);
      if (!wh || wh.user_id !== userId) return false;
      inMemoryStorage.webhooks.delete(id);
      return true;
    }
  }

  async getActiveWebhooksForEvent(eventType) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('is_active', true)
        .contains('events', [eventType]);
      if (error) throw error;
      return data || [];
    } else {
      if (!inMemoryStorage.webhooks) return [];
      return Array.from(inMemoryStorage.webhooks.values())
        .filter(w => w.is_active && w.events && w.events.includes(eventType));
    }
  }
}

const dbService = new DatabaseService();

// Export both the service and in-memory storage for development
module.exports = dbService;
module.exports.inMemoryStorage = inMemoryStorage;

