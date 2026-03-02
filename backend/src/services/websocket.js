const WebSocket = require('ws');
const { websocketConnections } = require('./metrics');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      perMessageDeflate: false
    });
    
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.chainSubscriptions = new Map(); // chainId -> Set of WebSocket connections
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      ws.clientId = clientId;
      
      console.log(`🔌 WebSocket client connected: ${clientId}`);
      websocketConnections.inc();
      
      // Send welcome message
      this.send(ws, {
        type: 'connected',
        clientId,
        timestamp: new Date().toISOString()
      });

      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        console.log(`🔌 WebSocket client disconnected: ${clientId}`);
        websocketConnections.dec();
        this.removeClient(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.removeClient(ws);
      });
    });
  }

  generateClientId() {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        this.handleSubscribe(ws, data);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(ws, data);
        break;
      case 'ping':
        this.send(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      default:
        this.sendError(ws, `Unknown message type: ${data.type}`);
    }
  }

  handleSubscribe(ws, data) {
    const { userId, chainId } = data;
    
    if (userId) {
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(ws);
      ws.userId = userId;
    }
    
    if (chainId) {
      if (!this.chainSubscriptions.has(chainId)) {
        this.chainSubscriptions.set(chainId, new Set());
      }
      this.chainSubscriptions.get(chainId).add(ws);
      
      if (!ws.subscriptions) {
        ws.subscriptions = new Set();
      }
      ws.subscriptions.add(chainId);
    }
    
    this.send(ws, {
      type: 'subscribed',
      userId,
      chainId,
      timestamp: new Date().toISOString()
    });
  }

  handleUnsubscribe(ws, data) {
    const { userId, chainId } = data;
    
    if (userId && ws.userId === userId) {
      const userClients = this.clients.get(userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(userId);
        }
      }
      delete ws.userId;
    }
    
    if (chainId && ws.subscriptions) {
      ws.subscriptions.delete(chainId);
      const chainClients = this.chainSubscriptions.get(chainId);
      if (chainClients) {
        chainClients.delete(ws);
        if (chainClients.size === 0) {
          this.chainSubscriptions.delete(chainId);
        }
      }
    }
    
    this.send(ws, {
      type: 'unsubscribed',
      userId,
      chainId,
      timestamp: new Date().toISOString()
    });
  }

  removeClient(ws) {
    // Remove from user subscriptions
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
      }
    }
    
    // Remove from chain subscriptions
    if (ws.subscriptions) {
      ws.subscriptions.forEach(chainId => {
        const chainClients = this.chainSubscriptions.get(chainId);
        if (chainClients) {
          chainClients.delete(ws);
          if (chainClients.size === 0) {
            this.chainSubscriptions.delete(chainId);
          }
        }
      });
    }
  }

  // Broadcast to all clients subscribed to a user
  broadcastToUser(userId, message) {
    const clients = this.clients.get(userId);
    if (clients) {
      clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          this.send(ws, message);
        }
      });
    }
  }

  // Broadcast to all clients subscribed to a chain
  broadcastToChain(chainId, message) {
    const clients = this.chainSubscriptions.get(chainId);
    if (clients) {
      clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          this.send(ws, message);
        }
      });
    }
  }

  // Broadcast to all connected clients
  broadcast(message) {
    this.wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        this.send(ws, message);
      }
    });
  }

  send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  }

  sendError(ws, message) {
    this.send(ws, {
      type: 'error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Helper methods for common events
  notifyChainStatusChange(chainId, status, data = {}) {
    this.broadcastToChain(chainId, {
      type: 'chain_status_change',
      chainId,
      status,
      data,
      timestamp: new Date().toISOString()
    });
  }

  notifyChainDeployment(chainId, status, progress = null) {
    this.broadcastToChain(chainId, {
      type: 'chain_deployment',
      chainId,
      status,
      progress,
      timestamp: new Date().toISOString()
    });
  }

  notifyNotification(userId, notification) {
    this.broadcastToUser(userId, {
      type: 'notification',
      notification,
      timestamp: new Date().toISOString()
    });
  }

  notifyValidatorChange(chainId, validatorId, action) {
    this.broadcastToChain(chainId, {
      type: 'validator_change',
      chainId,
      validatorId,
      action,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = WebSocketService;



















