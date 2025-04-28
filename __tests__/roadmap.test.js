const request = require('supertest');
const { app } = require('../src/app');
const Roadmap = require('../src/models/Roadmap');
const { createTestUser, createTestRoadmap, generateTestToken, createAuthHeaders } = require('./helpers/testHelpers');

describe('Roadmap API', () => {
  let user;
  let token;
  let roadmap;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateTestToken(user);
    roadmap = await createTestRoadmap(user);
  });

  describe('GET /api/roadmaps', () => {
    it('should get all roadmaps for user', async () => {
      const response = await request(app)
        .get('/api/roadmaps')
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/roadmaps', () => {
    it('should create a new roadmap', async () => {
      const newRoadmap = {
        title: 'New Roadmap',
        description: 'Test roadmap',
        levels: [
          {
            levelId: 1,
            title: 'Level 1',
            modules: [
              {
                moduleId: '1.1',
                title: 'Module 1.1'
              }
            ]
          }
        ]
      };

      const response = await request(app)
        .post('/api/roadmaps')
        .set(createAuthHeaders(token))
        .send(newRoadmap);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('title', 'New Roadmap');
      expect(response.body).toHaveProperty('user', user._id.toString());
    });
  });

  describe('GET /api/roadmaps/:id', () => {
    it('should get a specific roadmap', async () => {
      const response = await request(app)
        .get(`/api/roadmaps/${roadmap._id}`)
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', roadmap._id.toString());
      expect(response.body).toHaveProperty('title', roadmap.title);
    });
  });

  describe('PATCH /api/roadmaps/:id', () => {
    it('should update a roadmap', async () => {
      const update = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .patch(`/api/roadmaps/${roadmap._id}`)
        .set(createAuthHeaders(token))
        .send(update);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated Title');
    });
  });

  describe('DELETE /api/roadmaps/:id', () => {
    it('should delete a roadmap', async () => {
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