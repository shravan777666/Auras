import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServerInstance = null;

const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  try {
    if (!mongoUri) {
      // Start in-memory MongoDB for local/dev use when no URI provided
      console.warn('MONGODB_URI not set. Starting in-memory MongoDB for development...');
      memoryServerInstance = await MongoMemoryServer.create();
      mongoUri = memoryServerInstance.getUri();
    }

    await mongoose.connect(mongoUri, {
      dbName: process.env.DB_NAME || 'auracare'
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

export default connectDB;