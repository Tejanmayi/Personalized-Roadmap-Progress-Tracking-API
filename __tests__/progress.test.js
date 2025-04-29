const request = require('supertest');
const { app } = require('../src/app');
const Roadmap = require('../src/models/Roadmap');
const { createTestUser, createTestRoadmap, generateTestToken, createAuthHeaders } = require('./helpers/testHelpers');
const { setupTestDB } = require('./helpers/testSetup');

describe('Progress Tracking', () => {
  setupTestDB();
  let user;
  let token;
  let roadmap;

  beforeEach(async () => {
    const testUser = await createTestUser();
    user = testUser.user;
    token = testUser.token;
    roadmap = await createTestRoadmap(user._id);
  });

  describe('PATCH /api/progress/:roadmapId/levels/:levelId/modules/:moduleId', () => {
    it('should update module progress', async () => {
      const levelId = 1;
      const moduleId = '1.1';
      const progressData = {
        completionStatus: true,
        timeSpent: 120,
        userNotes: 'Completed basic concepts'
      };

      const response = await request(app)
        .patch(`/api/progress/${roadmap._id}/levels/${levelId}/modules/${moduleId}`)
        .set(createAuthHeaders(token))
        .send(progressData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.module).toHaveProperty('completionStatus', true);
      expect(response.body.module).toHaveProperty('timeSpent', 120);
      expect(response.body.module).toHaveProperty('userNotes', 'Completed basic concepts');
    });

    it('should return 404 for non-existent module', async () => {
      const response = await request(app)
        .patch(`/api/progress/${roadmap._id}/levels/1/modules/999`)
        .set(createAuthHeaders(token))
        .send({
          completionStatus: true,
          timeSpent: 120
        });

      expect(response.status).toBe(404);
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
      expect(response.body).toHaveProperty('levels');
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