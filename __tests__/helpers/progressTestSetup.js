const User = require('../../src/models/User');
const Roadmap = require('../../src/models/Roadmap');
const jwt = require('jsonwebtoken');

const createTestUser = async () => {
  const timestamp = Date.now();
  const user = await User.create({
    email: `progress_test${timestamp}@example.com`,
    password: 'password123',
    name: `Progress Test User ${timestamp}`
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { user, token };
};

const createTestRoadmap = async (userId) => {
  const timestamp = Date.now();
  return Roadmap.create({
    user: userId,
    title: `Progress Test Roadmap ${timestamp}`,
    description: `Progress Test Description ${timestamp}`,
    levels: [
      {
        levelId: 1,
        title: 'Level 1',
        description: 'First level',
        modules: [
          {
            moduleId: '1.1',
            title: 'Module 1.1',
            description: 'First module',
            completionStatus: 'not_started',
            timeSpent: 0,
            attempts: []
          }
        ],
        progress: 0
      }
    ],
    currentLevel: 1,
    currentModule: '1.1',
    overallProgress: 0,
    difficulty: 'beginner'
  });
};

module.exports = {
  createTestUser,
  createTestRoadmap
}; 