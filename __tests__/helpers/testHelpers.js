const User = require('../../src/models/User');
const Roadmap = require('../../src/models/Roadmap');
const Resource = require('../../src/models/Resource');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Create a test user
const createTestUser = async (userData = {}) => {
  const timestamp = Date.now();
  const defaultUser = {
    email: `test${timestamp}@example.com`,
    password: 'password123',
    name: `Test User ${timestamp}`
  };

  // Create user with plain password (will be hashed by pre-save hook)
  const user = new User({ 
    ...defaultUser, 
    ...userData
  });
  await user.save();

  // Generate token
  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token };
};

// Create a test roadmap
const createTestRoadmap = async (userId, roadmapData = {}) => {
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

  const roadmap = await Roadmap.create({
    ...defaultRoadmap,
    ...roadmapData,
    user: userId
  });
  return roadmap;
};

// Create a test resource
const createTestResource = async (userId) => {
  const timestamp = Date.now();
  const resource = await Resource.create({
    title: `Test Resource ${timestamp}`,
    description: `Test Description ${timestamp}`,
    type: 'video',
    url: `https://example.com/video/${timestamp}`,
    difficulty: 3,
    duration: 30,
    tags: ['test', 'video'],
    metadata: {
      author: userId
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
  });
  return resource;
};

// Generate a test token
const generateTestToken = (user) => {
  return jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Create test request headers
const createAuthHeaders = (token) => {
  return {
    Authorization: `Bearer ${token}`
  };
};

module.exports = {
  createTestUser,
  createTestRoadmap,
  createTestResource,
  generateTestToken,
  createAuthHeaders
}; 