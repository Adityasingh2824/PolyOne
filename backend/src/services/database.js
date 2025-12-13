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
  notifications: new Map()
};

// Export inMemoryStorage for direct access in development
if (process.env.NODE_ENV === 'development') {
  module.exports.inMemoryStorage = inMemoryStorage;
}

class DatabaseService {
  constructor() {
    this.useSupabase = isSupabaseConfigured();
    if (!this.useSupabase) {
      // Only show warning if Supabase was partially configured
      // If completely empty, assume intentional use of in-memory storage
      const hasSupabaseVars = process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      if (hasSupabaseVars) {
        console.warn('⚠️  Database Service: Using in-memory storage (data will be lost on restart)');
      } else {
        console.log('📝 Database Service: Using in-memory storage (Supabase not configured)');
      }
    } else {
      console.log('✅ Database Service: Using Supabase');
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
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('chains')
          .insert([chainData])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating chain in Supabase:', error);
          throw error;
        }
        
        console.log('✅ Chain created in Supabase:', data.id, 'for user:', data.user_id);
        
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
          updated_at: chainData.updated_at || new Date().toISOString()
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
        
        return chain;
      }
    } catch (error) {
      console.error('❌ Error in createChain:', error);
      throw error;
    }
  }

  async getChainById(id) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('chains')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
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
}

const dbService = new DatabaseService();

// Export both the service and in-memory storage for development
module.exports = dbService;
module.exports.inMemoryStorage = inMemoryStorage;

