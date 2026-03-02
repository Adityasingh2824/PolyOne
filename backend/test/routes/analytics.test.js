const request = require('supertest');
const { app } = require('../../src/server');
const jwt = require('jsonwebtoken');

describe('Analytics Routes', () => {
  let authToken;

  beforeAll(() => {
    // Create a test JWT token
    authToken = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only', { expiresIn: '1h' });
  });

  describe('GET /api/analytics/transactions/:chainId', () => {
    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/analytics/transactions/some-chain-id')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 for non-existent chain', async () => {
      const response = await request(app)
        .get('/api/analytics/transactions/non-existent-chain')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('GET /api/analytics/gas/:chainId', () => {
    it('should return 401 without auth', async () => {
      await request(app)
        .get('/api/analytics/gas/some-chain-id')
        .expect(401);
    });
  });

  describe('GET /api/analytics/activity', () => {
    it('should return activity data with auth', async () => {
      const response = await request(app)
        .get('/api/analytics/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('activity');
      expect(response.body.activity).toHaveProperty('period');
    });
  });

  describe('GET /api/analytics/chains/:chainId', () => {
    it('should return 403 for non-existent chain', async () => {
      const response = await request(app)
        .get('/api/analytics/chains/non-existent-chain')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('POST /api/analytics/export', () => {
    it('should return 401 without auth', async () => {
      await request(app)
        .post('/api/analytics/export')
        .send({ export_type: 'transactions', format: 'csv', date_from: '2024-01-01', date_to: '2024-12-31' })
        .expect(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/analytics/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
    });
  });
});
