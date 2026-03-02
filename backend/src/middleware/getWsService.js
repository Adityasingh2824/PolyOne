// Helper to get WebSocket service from Express app
module.exports = (req) => {
  return req.app.get('wsService');
};



















