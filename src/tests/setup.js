import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Setup test database
beforeAll(async () => {
  const mongoURI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/bhargava-clinic-test';
  await mongoose.connect(mongoURI);
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});
