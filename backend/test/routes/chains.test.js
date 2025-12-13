const request = require('supertest');
const app = require('../../src/server');
const db = require('../../src/services/database');

describe('Chains Routes', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Create a test user and get token
    const userData = {
      email: 'chains-test@example.com',
      password: 'Test1234!',
      name: 'Chains Test User'
    };

    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    authToken = signupResponse.body.token;
    testUserId = signupResponse.body.user.id;
  });

  describe('GET /api/chains', () => {
    it('should return chains for authenticated user', async () => {
      const response = await request(app)
        .get('/api/chains')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('chains');
      expect(Array.isArray(response.body.chains)).toBe(true);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/chains')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/chains/create', () => {
    it('should create a new chain with valid data', async () => {
      const chainData = {
        name: 'Test Chain',
        chainType: 'rollup',
        rollupType: 'zk-rollup',
        gasToken: 'POL',
        validatorAccess: 'public',
        initialValidators: 3
      };

      const response = await request(app)
        .post('/api/chains/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chainData)
        .expect(201);

      expect(response.body).toHaveProperty('chainId');
      expect(response.body).toHaveProperty('chain');
    });

    it('should reject chain creation with missing required fields', async () => {
      const chainData = {
        name: 'Test Chain'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/chains/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chainData)
        .expect(400);

      expect(response.body.message).toContain('Missing required fields');
    });
  });
});

