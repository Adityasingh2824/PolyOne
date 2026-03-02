const request = require('supertest');
const { app } = require('../../src/server');
const jwt = require('jsonwebtoken');

describe('Bridge Routes', () => {
  let authToken;

  beforeAll(() => {
    authToken = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only', { expiresIn: '1h' });
  });

  describe('GET /api/bridge/transactions', () => {
    it('should return 401 without auth', async () => {
      await request(app)
        .get('/api/bridge/transactions')
        .expect(401);
    });

    it('should return empty transactions list', async () => {
      const response = await request(app)
        .get('/api/bridge/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });
  });

  describe('POST /api/bridge/transaction', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/bridge/transaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 403 for non-existent source chain', async () => {
      const response = await request(app)
        .post('/api/bridge/transaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source_chain_id: 'non-existent',
          destination_chain_id: 'dest-chain',
          token_address: '0x0000000000000000000000000000000000000000',
          amount: 1.0,
          recipient_address: '0x1234567890abcdef1234567890abcdef12345678',
          tx_type: 'deposit'
        })
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/bridge/fees', () => {
    it('should return fee calculation', async () => {
      const response = await request(app)
        .get('/api/bridge/fees')
        .query({ amount: '100' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('baseFeePercentage');
      expect(response.body).toHaveProperty('calculatedFee');
    });
  });

  describe('GET /api/bridge/l2/adapters', () => {
    it('should return L2 adapters list', async () => {
      const response = await request(app)
        .get('/api/bridge/l2/adapters')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('adapters');
    });
  });
});
