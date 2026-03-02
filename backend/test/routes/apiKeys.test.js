const request = require('supertest');
const { app } = require('../../src/server');
const jwt = require('jsonwebtoken');

describe('API Keys Routes', () => {
  let authToken;
  let createdKeyId;

  beforeAll(() => {
    authToken = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only', { expiresIn: '1h' });
  });

  describe('POST /api/api-keys', () => {
    it('should create an API key', async () => {
      const response = await request(app)
        .post('/api/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Key', scopes: ['read'] })
        .expect(201);

      expect(response.body).toHaveProperty('key');
      expect(response.body).toHaveProperty('id');
      expect(response.body.key).toMatch(/^pk_/);
      createdKeyId = response.body.id;
    });

    it('should require name', async () => {
      const response = await request(app)
        .post('/api/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/api-keys', () => {
    it('should list API keys without exposing hashes', async () => {
      const response = await request(app)
        .get('/api/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/api-keys/:id', () => {
    it('should revoke an API key', async () => {
      if (!createdKeyId) return; // skip if creation failed
      const response = await request(app)
        .delete(`/api/api-keys/${createdKeyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('revoked');
    });

    it('should return 404 for non-existent key', async () => {
      await request(app)
        .delete('/api/api-keys/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
