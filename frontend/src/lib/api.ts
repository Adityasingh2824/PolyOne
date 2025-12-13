import axios from 'axios';

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiClient = {
  // Health check
  health: () => api.get('/api/health'),

  // Authentication
  auth: {
    signup: (data: { email: string; password: string; username: string }) =>
      api.post('/api/auth/signup', data),
    login: (data: { email: string; password: string }) =>
      api.post('/api/auth/login', data),
    logout: () => api.post('/api/auth/logout'),
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
};

export default api;

