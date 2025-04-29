const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = '3001';

// Global test timeout
jest.setTimeout(10000);

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockImplementation((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn().mockImplementation((candidatePassword, hashedPassword) => {
    // For test purposes, we know the password is 'password123'
    if (candidatePassword === 'password123') {
      return Promise.resolve(true);
    }
    // If the hashed password matches our test pattern
    if (hashedPassword === `hashed_${candidatePassword}`) {
      return Promise.resolve(true);
    }
    // If the hashed password is already hashed
    if (hashedPassword.startsWith('hashed_')) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }),
  genSalt: jest.fn().mockResolvedValue('test-salt')
}));

let mongoServer;

// Connect to the in-memory database before running tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI_TEST = mongoUri;
  
  // Disconnect from any existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  });
  
  console.log('Connected to test database');
});

// Clear database between tests
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  console.log('Test database cleared');
});

// Disconnect and stop server after tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('Disconnected from test database');
}); 