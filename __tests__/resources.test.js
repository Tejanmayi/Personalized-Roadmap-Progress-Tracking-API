const request = require('supertest');
const { app } = require('../src/app');
const Resource = require('../src/models/Resource');
const { createTestUser, createTestResource, generateTestToken, createAuthHeaders } = require('./helpers/testHelpers');
const { setupTestDB } = require('./helpers/testSetup');

describe('Resource API', () => {
  setupTestDB();
  let user;
  let token;

  beforeEach(async () => {
    const testUser = await createTestUser();
    user = testUser.user;
    token = testUser.token;
  });

  describe('GET /api/resources', () => {
    it('should get all resources', async () => {
      const resource = await createTestResource(user._id);

      const response = await request(app)
        .get('/api/resources')
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.resources)).toBe(true);
      expect(response.body.resources.length).toBe(1);
      expect(response.body.resources[0]._id.toString()).toBe(resource._id.toString());
    });

    it('should filter resources by type', async () => {
      await createTestResource(user._id);

      const response = await request(app)
        .get('/api/resources?type=video')
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.resources)).toBe(true);
      expect(response.body.resources.length).toBe(1);
      expect(response.body.resources[0].type).toBe('video');
    });
  });

  describe('POST /api/resources', () => {
    it('should create a new resource', async () => {
      const resourceData = {
        title: 'Test Resource',
        description: 'Test Description',
        type: 'video',
        url: 'https://example.com/video',
        difficulty: 3,
        duration: 30,
        tags: ['test', 'video'],
        metadata: {
          author: user._id
        },
        usage: {
          totalViews: 0,
          averageRating: 1,
          completionRate: 0,
          averageTimeSpent: 0
        },
        analytics: {
          userFeedback: [],
          effectiveness: 0,
          difficultyRating: 1,
          mostCommonUseCases: [],
          relatedResources: []
        },
        status: 'active'
      };

      const response = await request(app)
        .post('/api/resources')
        .set(createAuthHeaders(token))
        .send(resourceData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('title', resourceData.title);
      expect(response.body).toHaveProperty('type', resourceData.type);
    });
  });

  describe('GET /api/resources/:id', () => {
    it('should get a specific resource', async () => {
      const resource = await createTestResource(user._id);

      const response = await request(app)
        .get(`/api/resources/${resource._id}`)
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body._id.toString()).toBe(resource._id.toString());
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/resources/60d21b4667d0d8992e610c85')
        .set(createAuthHeaders(token));

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/resources/:id', () => {
    it('should update a resource', async () => {
      const resource = await createTestResource(user._id);
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description'
      };

      const response = await request(app)
        .patch(`/api/resources/${resource._id}`)
        .set(createAuthHeaders(token))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', updateData.title);
      expect(response.body).toHaveProperty('description', updateData.description);
    });
  });

  describe('DELETE /api/resources/:id', () => {
    it('should delete a resource', async () => {
      const resource = await createTestResource(user._id);

      const response = await request(app)
        .delete(`/api/resources/${resource._id}`)
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Resource deleted successfully');

      const deletedResource = await Resource.findById(resource._id);
      expect(deletedResource).toBeNull();
    });
  });
});