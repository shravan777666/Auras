import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServerInstance = null;

const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  try {
    if (!mongoUri) {
      console.warn('MONGODB_URI not set. Starting in-memory MongoDB for development...');
      memoryServerInstance = await MongoMemoryServer.create();
      mongoUri = memoryServerInstance.getUri();
    }

    // Try primary connection (Atlas or provided URI)
    await mongoose.connect(mongoUri, {
      dbName: process.env.DB_NAME || 'auracare',
      serverSelectionTimeoutMS: 8000
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Fallback to in-memory MongoDB if Atlas/remote is unreachable
    try {
      console.warn('⚠️ Falling back to in-memory MongoDB...');
      if (!memoryServerInstance) {
        memoryServerInstance = await MongoMemoryServer.create();
      }
      const memoryUri = memoryServerInstance.getUri();
      await mongoose.connect(memoryUri, {
        dbName: process.env.DB_NAME || 'auracare'
      });
      console.log('✅ In-memory MongoDB started and connected');
    } catch (memoryErr) {
      console.error('❌ Failed to start in-memory MongoDB:', memoryErr.message);
      process.exit(1);
    }
  }
};

export default connectDB;