const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Resource = require('../../src/models/Resource');
const jwt = require('jsonwebtoken');

// Store original environment
const originalEnv = process.env;

// Set test environment variables
const testEnv = {
  ...originalEnv,
  NODE_ENV: 'test',
  JWT_SECRET: 'test-secret-key',
  PORT: '3001'
};

// Get the base MongoDB URI and append test database name
const baseMongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const testDbName = 'personalized-roadmap-test';
const testMongoUri = `${baseMongoUri}/${testDbName}`;

// Database connection management
let isConnected = false;

const setupTestDB = () => {
  beforeAll(async () => {
    try {
      // Set test environment
      process.env = testEnv;

      // Disconnect from any existing connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      // Connect to test database
      await mongoose.connect(testMongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      
      isConnected = true;
      console.log('Connected to test database');
    } catch (error) {
      console.error('Test database connection error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (isConnected) {
      await mongoose.disconnect();
      isConnected = false;
      console.log('Disconnected from test database');
    }
    // Restore original environment
    process.env = originalEnv;
  });

  beforeEach(async () => {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    console.log('Test database cleared');
  });
};

const createTestUser = async () => {
  const timestamp = Date.now();
  const user = await User.create({
    email: `test${timestamp}@example.com`,
    password: 'password123',
    name: `Test User ${timestamp}`
  });

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { user, token };
};

const createTestResource = async (userId) => {
  const timestamp = Date.now();
  return Resource.create({
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
};

module.exports = {
  setupTestDB,
  createTestUser,
  createTestResource
}; 