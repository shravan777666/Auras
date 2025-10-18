import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServerInstance = null;

const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('********************************************************************************');
    console.warn('** WARNING: MONGODB_URI is not set.                                           **');
    console.warn('** Using a temporary, in-memory database. Data will NOT be saved.             **');
    console.warn('** To connect to a real database, set the MONGODB_URI environment variable.   **');
    console.warn('********************************************************************************');
    
    try {
      memoryServerInstance = await MongoMemoryServer.create();
      mongoUri = memoryServerInstance.getUri();
      await mongoose.connect(mongoUri, {
        dbName: process.env.DB_NAME || 'auracare-temp',
      });
      console.log('✅ In-memory MongoDB connected.');
    } catch (err) {
      console.error('❌ Failed to start in-memory MongoDB:', err.message);
      process.exit(1);
    }

  } else {
    // MONGODB_URI is set, so we expect to connect to it.
    try {
      await mongoose.connect(mongoUri, {
        dbName: process.env.DB_NAME || 'auracare',
        serverSelectionTimeoutMS: 8000
      });
      console.log('✅ MongoDB connected successfully to the database specified by MONGODB_URI.');
    } catch (err) {
      console.error('********************************************************************************');
      console.error('** FATAL: Could not connect to the MongoDB database specified by MONGODB_URI. **');
      console.error(`** URI: ${mongoUri}                                                        **`);
      console.error(`** Error: ${err.message}                                                    **`);
      console.error('** Please check your MONGODB_URI environment variable and database status.    **');
      console.error('********************************************************************************');
      process.exit(1);
    }
  }
};

export default connectDB;