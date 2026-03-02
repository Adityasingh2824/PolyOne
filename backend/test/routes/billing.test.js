const request = require('supertest');
const { app } = require('../../src/server');
const jwt = require('jsonwebtoken');

describe('Billing Routes', () => {
  let authToken;

  beforeAll(() => {
    authToken = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only', { expiresIn: '1h' });
  });

  describe('GET /api/billing/plans', () => {
    it('should return subscription plans', async () => {
      const response = await request(app)
        .get('/api/billing/plans')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/billing/subscriptions', () => {
    it('should return user subscriptions (possibly empty)', async () => {
      const response = await request(app)
        .get('/api/billing/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/billing/subscribe', () => {
    it('should require planId', async () => {
      const response = await request(app)
        .post('/api/billing/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Plan ID');
    });
  });

  describe('GET /api/billing/invoices', () => {
    it('should return user invoices (possibly empty)', async () => {
      const response = await request(app)
        .get('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/billing/service-credits', () => {
    it('should return service credits balance', async () => {
      const response = await request(app)
        .get('/api/billing/service-credits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('balance');
    });
  });

  describe('POST /api/billing/checkout', () => {
    it('should return 501 when Stripe is not configured', async () => {
      const response = await request(app)
        .post('/api/billing/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ planId: '1' })
        .expect(501);

      expect(response.body.message).toContain('Stripe');
    });
  });
});
