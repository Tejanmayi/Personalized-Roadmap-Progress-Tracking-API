const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const setupTestEnv = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.PORT = '3001';

  // Create in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;

  // Disconnect from any existing connection
  await mongoose.disconnect();
  
  // Connect to MongoDB
  await mongoose.connect(mongoUri);
};

const teardownTestEnv = async () => {
  // Disconnect from MongoDB
  await mongoose.disconnect();
  await mongoServer.stop();
};

const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

module.exports = {
  setupTestEnv,
  teardownTestEnv,
  clearDatabase
}; 