const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get the base MongoDB URI
    const baseMongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    
    // Determine database name based on environment
    let dbName;
    switch (process.env.NODE_ENV) {
      case 'test':
        dbName = 'personalized-roadmap-test';
        break;
      case 'production':
        dbName = 'personalized-roadmap-prod';
        break;
      default:
        dbName = 'personalized-roadmap-dev';
    }
    
    const mongoUri = `${baseMongoUri}/${dbName}`;

    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log(`Connected to MongoDB: ${dbName} (${process.env.NODE_ENV || 'development'} environment)`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 