const request = require('supertest');
const { app } = require('../src/app');
const Roadmap = require('../src/models/Roadmap');
const { createTestUser, createTestRoadmap, generateTestToken, createAuthHeaders } = require('./helpers/testHelpers');
const { setupTestDB } = require('./helpers/testSetup');

describe('Roadmap API', () => {
  setupTestDB();
  let user;
  let token;

  beforeEach(async () => {
    const testUser = await createTestUser();
    user = testUser.user;
    token = testUser.token;
  });

  describe('GET /api/roadmaps', () => {
    it('should get all roadmaps for user', async () => {
      const roadmap = await createTestRoadmap(user._id);

      const response = await request(app)
        .get('/api/roadmaps')
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]._id.toString()).toBe(roadmap._id.toString());
    });
  });

  describe('POST /api/roadmaps', () => {
    it('should create a new roadmap', async () => {
      const roadmapData = {
        title: 'Test Roadmap',
        description: 'Test Description',
        levels: [
          {
            levelId: 1,
            title: 'Level 1',
            description: 'Level 1 Description',
            modules: [
              {
                moduleId: '1.1',
                title: 'Module 1.1',
                description: 'Module 1.1 Description'
              }
            ]
          }
        ]
      };

      const response = await request(app)
        .post('/api/roadmaps')
        .set(createAuthHeaders(token))
        .send(roadmapData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('title', roadmapData.title);
      expect(response.body.levels).toHaveLength(1);
      expect(response.body.levels[0].modules).toHaveLength(1);
    });
  });

  describe('GET /api/roadmaps/:id', () => {
    it('should get a specific roadmap', async () => {
      const roadmap = await createTestRoadmap(user._id);

      const response = await request(app)
        .get(`/api/roadmaps/${roadmap._id}`)
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body._id.toString()).toBe(roadmap._id.toString());
    });

    it('should return 404 for non-existent roadmap', async () => {
      const response = await request(app)
        .get('/api/roadmaps/60d21b4667d0d8992e610c85')
        .set(createAuthHeaders(token));

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/roadmaps/:id', () => {
    it('should update a roadmap', async () => {
      const roadmap = await createTestRoadmap(user._id);
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description'
      };

      const response = await request(app)
        .patch(`/api/roadmaps/${roadmap._id}`)
        .set(createAuthHeaders(token))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', updateData.title);
      expect(response.body).toHaveProperty('description', updateData.description);
    });
  });

  describe('DELETE /api/roadmaps/:id', () => {
    it('should delete a roadmap', async () => {
      const roadmap = await createTestRoadmap(user._id);

      const response = await request(app)
        .delete(`/api/roadmaps/${roadmap._id}`)
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Roadmap deleted successfully');

      const deletedRoadmap = await Roadmap.findById(roadmap._id);
      expect(deletedRoadmap).toBeNull();
    });
  });
}); 