const request = require('supertest');
const { app } = require('../../src/server');
const jwt = require('jsonwebtoken');

describe('Webhooks Routes', () => {
  let authToken;
  let createdWebhookId;

  beforeAll(() => {
    authToken = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only', { expiresIn: '1h' });
  });

  describe('POST /api/webhooks', () => {
    it('should create a webhook', async () => {
      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Webhook',
          url: 'https://example.com/webhook',
          events: ['chain.created', 'chain.deployed']
        })
        .expect(201);

      expect(response.body).toHaveProperty('webhook');
      expect(response.body.webhook).toHaveProperty('id');
      expect(response.body.webhook).toHaveProperty('secret');
      createdWebhookId = response.body.webhook.id;
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should reject invalid events', async () => {
      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Bad Webhook',
          url: 'https://example.com/webhook',
          events: ['invalid.event']
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid events');
    });
  });

  describe('GET /api/webhooks', () => {
    it('should list webhooks without exposing secrets', async () => {
      const response = await request(app)
        .get('/api/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('supported_events');
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).not.toHaveProperty('secret');
      }
    });
  });

  describe('PUT /api/webhooks/:id', () => {
    it('should update a webhook', async () => {
      if (!createdWebhookId) return;
      const response = await request(app)
        .put(`/api/webhooks/${createdWebhookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Webhook', is_active: false })
        .expect(200);

      expect(response.body.webhook.name).toBe('Updated Webhook');
    });
  });

  describe('DELETE /api/webhooks/:id', () => {
    it('should delete a webhook', async () => {
      if (!createdWebhookId) return;
      await request(app)
        .delete(`/api/webhooks/${createdWebhookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent webhook', async () => {
      await request(app)
        .delete('/api/webhooks/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
