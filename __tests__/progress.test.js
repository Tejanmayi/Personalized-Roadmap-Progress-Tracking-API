const request = require('supertest');
const { app } = require('../src/app');
const Roadmap = require('../src/models/Roadmap');
const { createTestUser, createTestRoadmap, generateTestToken, createAuthHeaders } = require('./helpers/testHelpers');

describe('Progress Tracking', () => {
  let user;
  let token;
  let roadmap;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateTestToken(user);
    roadmap = await createTestRoadmap(user);
  });

  describe('PATCH /api/progress/:roadmapId/levels/:levelId/modules/:moduleId', () => {
    it('should update module progress', async () => {
      const update = {
        completionStatus: true,
        timeSpent: 120,
        userNotes: 'Completed module'
      };

      const response = await request(app)
        .patch(`/api/progress/${roadmap._id}/levels/1/modules/1.1`)
        .set(createAuthHeaders(token))
        .send(update);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.module).toHaveProperty('completionStatus', true);
      expect(response.body.module).toHaveProperty('timeSpent', 120);
      expect(response.body.module).toHaveProperty('userNotes', 'Completed module');
    });

    it('should not update progress for non-existent module', async () => {
      const response = await request(app)
        .patch(`/api/progress/${roadmap._id}/levels/1/modules/999`)
        .set(createAuthHeaders(token))
        .send({ completionStatus: true });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/progress/:roadmapId/stats', () => {
    it('should get progress statistics', async () => {
      const response = await request(app)
        .get(`/api/progress/${roadmap._id}/stats`)
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('overallProgress');
      expect(response.body).toHaveProperty('currentLevel');
      expect(response.body).toHaveProperty('currentModule');
      expect(response.body.levels).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/progress/analytics', () => {
    it('should get user analytics', async () => {
      const response = await request(app)
        .get('/api/progress/analytics')
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalRoadmaps');
      expect(response.body).toHaveProperty('averageProgress');
      expect(response.body).toHaveProperty('totalTimeSpent');
      expect(response.body).toHaveProperty('completionRate');
    });
  });
}); 