const request = require('supertest');
const { app } = require('../src/app');
const User = require('../src/models/User');
const { createTestUser, generateTestToken, createAuthHeaders } = require('./helpers/testHelpers');
const { setupTestDB } = require('./helpers/testSetup');

describe('Authentication', () => {
  setupTestDB();

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('name', userData.name);
      expect(response.body.user).toHaveProperty('userId');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not register a user with existing email', async () => {
      const { user } = await createTestUser();

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: user.email,
          password: 'password123',
          name: 'Another User'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const { user } = await createTestUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', user.email);
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const { user, token } = await createTestUser();

      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('email', user.email);
    });

    it('should not get user with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeaders('invalid-token'));

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Please authenticate.');
    });

    it('should not get user without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Please authenticate.');
    });
  });

  describe('Rate Limiting', () => {
    it('should limit login attempts', async () => {
      const attempts = 101; // One more than the limit
      const responses = [];

      for (let i = 0; i < attempts; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          });
        responses.push(response);
      }

      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body).toHaveProperty('message', 'Too many requests');
    });
  });
}); 