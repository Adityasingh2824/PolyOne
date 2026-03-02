import axios from 'axios';

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('authToken');
      localStorage.removeItem('authToken');
      // Only redirect to login if they were using email auth (had a token)
      // Wallet-only users have no token; don't force them to login page
      if (hadToken) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiClient = {
  // Health check
  healthCheck: () => api.get('/api/health'),

  // Authentication
  auth: {
    signup: (data: { name: string; email: string; password: string; company?: string }) =>
      api.post('/api/auth/signup', data),
    login: (data: { email: string; password: string }) =>
      api.post('/api/auth/login', data),
    logout: () => api.post('/api/auth/logout'),
    refreshToken: (refreshToken: string) =>
      api.post('/api/auth/refresh-token', { refreshToken }),
  },

  // Chains
  chains: {
    getAll: (walletAddress?: string) =>
      api.get('/api/chains', {
        params: walletAddress ? { walletAddress } : {},
      }),
    getById: (id: string) => api.get(`/api/chains/${id}`),
    create: (data: {
      name: string;
      chainType: string;
      rollupType: string;
      gasToken: string;
      validatorAccess?: string;
      initialValidators: string;
      blockchainTxHash?: string;
      blockchainChainId?: number;
      walletAddress?: string;
    }) => api.post('/api/chains/create', data),
    update: (id: string, data: any) => api.put(`/api/chains/${id}`, data),
    delete: (id: string) => api.delete(`/api/chains/${id}`),
    pause: (id: string) => api.post(`/api/chains/${id}/pause`),
    resume: (id: string) => api.post(`/api/chains/${id}/resume`),
    backup: (id: string) => api.post(`/api/chains/${id}/backup`),
    restore: (id: string, backupId: string) =>
      api.post(`/api/chains/${id}/restore`, { backupId }),
    upgrade: (id: string, version: string) =>
      api.post(`/api/chains/${id}/upgrade`, { version }),
    getUpgrades: (id: string) => api.get(`/api/chains/${id}/upgrades`),
    completeUpgrade: (id: string, upgradeId: string) =>
      api.post(`/api/chains/${id}/upgrades/${upgradeId}/complete`),
    rollbackUpgrade: (id: string, upgradeId: string) =>
      api.post(`/api/chains/${id}/upgrades/${upgradeId}/rollback`),
    scale: (id: string, validatorCount: number) =>
      api.post(`/api/chains/${id}/scale`, { validatorCount }),
  },

  // Validators
  validators: {
    getByChain: (chainId: string) => api.get(`/api/validators/chain/${chainId}`),
    add: (chainId: string, data: any) =>
      api.post(`/api/validators/chain/${chainId}/add`, data),
    remove: (chainId: string, validatorId: string) =>
      api.post(`/api/validators/chain/${chainId}/remove/${validatorId}`),
    stake: (validatorId: string, amount: number) =>
      api.post(`/api/validators/${validatorId}/stake`, { amount }),
    reward: (validatorId: string, amount: number) =>
      api.post(`/api/validators/${validatorId}/distribute-rewards`, { amount }),
    performance: (validatorId: string) =>
      api.get(`/api/validators/${validatorId}/performance`),
  },

  // Bridge
  bridge: {
    getTransactions: (params?: any) =>
      api.get('/api/bridge/transactions', { params }),
    initiateBridge: (data: any) => api.post('/api/bridge/initiate', data),
    claimBridge: (transactionId: string, proof: string) =>
      api.post('/api/bridge/claim', { transactionId, proof }),
    getL2Adapters: () => api.get('/api/bridge/l2/adapters'),
    getL2Status: (chainId: string, l2: string) =>
      api.get('/api/bridge/l2/status', { params: { chainId, l2 } }),
    setupL2: (chainId: string, l2: string) =>
      api.post('/api/bridge/l2/setup', { chain_id: chainId, l2 }),
    transferToL2: (chainId: string, l2: string, data: { amount: number; recipient: string; token?: string; private_key?: string }) =>
      api.post('/api/bridge/l2/transfer', { chain_id: chainId, l2, ...data }),
  },

  // Liquidity (shared liquidity primitives)
  liquidity: {
    getPools: () => api.get('/api/liquidity/pools'),
    getPoolBalance: (tokenAddress: string, destinationChainId: number) =>
      api.get('/api/liquidity/pools/balance', { params: { token_address: tokenAddress, destination_chain_id: destinationChainId } }),
  },

  // Analytics
  analytics: {
    getChainAnalytics: (chainId: string, params?: any) =>
      api.get(`/api/analytics/chains/${chainId}`, { params }),
    getTransactionAnalytics: (chainId: string, params?: any) =>
      api.get(`/api/analytics/chains/${chainId}/transactions`, { params }),
    getGasAnalytics: (chainId: string, params?: any) =>
      api.get(`/api/analytics/chains/${chainId}/gas`, { params }),
  },

  // Billing
  billing: {
    getPlans: () => api.get('/api/billing/plans'),
    getSubscriptions: () => api.get('/api/billing/subscriptions'),
    subscribe: (planId: string, autoRenew: boolean) =>
      api.post('/api/billing/subscribe', { planId, autoRenew }),
    getInvoices: () => api.get('/api/billing/invoices'),
    payInvoice: (invoiceId: string) =>
      api.post(`/api/billing/invoices/${invoiceId}/pay`),
    getServiceCredits: (organizationId?: string) =>
      api.get('/api/billing/service-credits', { params: organizationId ? { organization_id: organizationId } : {} }),
    applyCreditsToInvoice: (invoiceId: string, amount: number) =>
      api.post(`/api/billing/invoices/${invoiceId}/apply-credits`, { amount }),
    addServiceCredits: (data: { user_id: string; amount: number; reason?: string; is_partner_appchain?: boolean; organization_id?: string }) =>
      api.post('/api/billing/service-credits/add', data),
    checkout: (planId: string, successUrl?: string, cancelUrl?: string) =>
      api.post('/api/billing/checkout', { planId, successUrl, cancelUrl }),
  },

  // Notifications
  notifications: {
    getAll: (params?: { unreadOnly?: boolean; limit?: number; offset?: number }) =>
      api.get('/api/notifications', { params }),
    getUnreadCount: () => api.get('/api/notifications/unread/count'),
    markAsRead: (notificationId: string) =>
      api.patch(`/api/notifications/${notificationId}/read`),
    markAllAsRead: () => api.patch('/api/notifications/read-all'),
    delete: (notificationId: string) => api.delete(`/api/notifications/${notificationId}`),
  },

  // Templates
  templates: {
    getAll: (params?: { category?: string; isOfficial?: boolean; isCommunity?: boolean; search?: string; minRating?: number }) =>
      api.get('/api/templates', { params }),
    getById: (templateId: string) => api.get(`/api/templates/${templateId}`),
    getByCategory: (category: string) => api.get(`/api/templates/category/${category}`),
    getPopular: (limit?: number) => api.get('/api/templates/popular', { params: { limit } }),
    getFeatured: () => api.get('/api/templates/featured'),
    create: (data: any) => api.post('/api/templates', data),
    rate: (templateId: string, rating: number, review?: string) =>
      api.post(`/api/templates/${templateId}/rate`, { rating, review }),
    getReviews: (templateId: string, limit?: number) =>
      api.get(`/api/templates/${templateId}/reviews`, { params: { limit } }),
    deploy: (templateId: string, data: {
      name: string;
      gasToken?: string;
      initialValidators?: number;
      walletAddress?: string;
      blockchainTxHash?: string;
      blockchainChainId?: number;
    }) => api.post(`/api/templates/${templateId}/deploy`, data),
  },

  // Health Monitoring
  health: {
    getStatus: (chainId: string) => api.get(`/api/health/${chainId}/status`),
    performCheck: (chainId: string) => api.post(`/api/health/${chainId}/check`),
    startMonitoring: (chainId: string, config?: any) => api.post(`/api/health/${chainId}/start`, config),
    stopMonitoring: (chainId: string) => api.post(`/api/health/${chainId}/stop`),
    getUptime: (chainId: string) => api.get(`/api/health/${chainId}/uptime`),
    getIncidents: (chainId: string, params?: { limit?: number; status?: string }) => 
      api.get(`/api/health/${chainId}/incidents`, { params }),
    getThresholds: (chainId: string) => api.get(`/api/health/${chainId}/thresholds`),
    updateThresholds: (chainId: string, thresholds: any) => 
      api.put(`/api/health/${chainId}/thresholds`, { thresholds }),
    getHistory: (chainId: string, params?: { limit?: number; hours?: number }) => 
      api.get(`/api/health/${chainId}/history`, { params }),
  },

  // Contracts
  contracts: {
    getTemplates: (params?: { category?: string; search?: string; tag?: string }) =>
      api.get('/api/contracts/templates', { params }),
    getTemplate: (templateId: string) => api.get(`/api/contracts/templates/${templateId}`),
    getAll: (walletAddress?: string) =>
      api.get('/api/contracts', {
        params: walletAddress ? { walletAddress } : {},
      }),
    getById: (id: string) => api.get(`/api/contracts/${id}`),
    save: (data: {
      name: string;
      address: string;
      chainId: number;
      abi: any[];
      templateId?: string;
      constructorArgs?: any;
      txHash?: string;
      blockNumber?: number;
      isUpgradeable?: boolean;
      proxyAddress?: string;
      walletAddress?: string;
    }) => api.post('/api/contracts', data),
    update: (id: string, data: {
      name?: string;
      abi?: any[];
      proxyAddress?: string;
      implementationAddress?: string;
    }) => api.patch(`/api/contracts/${id}`, data),
    delete: (id: string) => api.delete(`/api/contracts/${id}`),
    saveAbi: (data: {
      name: string;
      abi: any[];
      description?: string;
      walletAddress?: string;
    }) => api.post('/api/contracts/abis', data),
    getAbis: (walletAddress?: string) =>
      api.get('/api/contracts/abis/list', {
        params: walletAddress ? { walletAddress } : {},
      }),
  },

  // API Keys
  apiKeys: {
    list: () => api.get('/api/api-keys'),
    create: (data: { name: string; scopes?: string[]; expires_in_days?: number }) =>
      api.post('/api/api-keys', data),
    revoke: (id: string) => api.delete(`/api/api-keys/${id}`),
  },

  // Webhooks
  webhooks: {
    list: () => api.get('/api/webhooks'),
    create: (data: { name: string; url: string; events: string[]; chain_id?: string }) =>
      api.post('/api/webhooks', data),
    update: (id: string, data: { name?: string; url?: string; events?: string[]; is_active?: boolean }) =>
      api.put(`/api/webhooks/${id}`, data),
    delete: (id: string) => api.delete(`/api/webhooks/${id}`),
  },

  // Organizations
  organizations: {
    getAll: () => api.get('/api/organizations'),
    getById: (orgId: string) => api.get(`/api/organizations/${orgId}`),
    create: (data: { name: string; slug?: string; description?: string }) =>
      api.post('/api/organizations', data),
    update: (orgId: string, data: any) => api.put(`/api/organizations/${orgId}`, data),
  },

  // White-Label
  whitelabel: {
    getSettings: (orgId: string) => api.get(`/api/whitelabel/${orgId}`),
    updateSettings: (orgId: string, data: {
      branding?: {
        logo?: string;
        favicon?: string;
        companyName?: string;
        supportEmail?: string;
      };
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
      };
      domain?: string;
      termsOfService?: string;
      customCss?: string;
    }) => api.put(`/api/whitelabel/${orgId}`, data),
    getByDomain: (domain: string) => api.get(`/api/whitelabel/domain/${domain}`),
    uploadAsset: (orgId: string, type: 'logo' | 'favicon', url: string) =>
      api.post(`/api/whitelabel/${orgId}/upload`, { type, url }),
  },
};

export default api;

