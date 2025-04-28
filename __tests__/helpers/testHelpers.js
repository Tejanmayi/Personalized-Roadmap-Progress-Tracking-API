const User = require('../../src/models/User');
const Roadmap = require('../../src/models/Roadmap');
const jwt = require('jsonwebtoken');

// Create a test user
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  };

  const user = new User({ ...defaultUser, ...userData });
  await user.save();
  return user;
};

// Create a test roadmap
const createTestRoadmap = async (user, roadmapData = {}) => {
  const defaultRoadmap = {
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

  const roadmap = new Roadmap({
    ...defaultRoadmap,
    ...roadmapData,
    user: user._id
  });
  await roadmap.save();
  return roadmap;
};

// Generate a test token
const generateTestToken = (user) => {
  if (process.env.NODE_ENV === 'test') {
    return jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET);
  }
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
};

// Create test request headers
const createAuthHeaders = (token) => {
  return {
    Authorization: `Bearer ${token}`
  };
};

// Simulate load test
const simulateLoad = async (fn, iterations = 100) => {
  const startTime = Date.now();
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const iterationStart = Date.now();
    await fn();
    const iterationTime = Date.now() - iterationStart;
    results.push(iterationTime);
  }

  const totalTime = Date.now() - startTime;
  const averageTime = results.reduce((a, b) => a + b, 0) / results.length;
  const maxTime = Math.max(...results);
  const minTime = Math.min(...results);

  return {
    totalTime,
    averageTime,
    maxTime,
    minTime,
    iterations
  };
};

module.exports = {
  createTestUser,
  createTestRoadmap,
  generateTestToken,
  createAuthHeaders,
  simulateLoad
}; 