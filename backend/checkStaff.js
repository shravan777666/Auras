import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

import mongoose from 'mongoose';
import Staff from './models/Staff.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const checkStaff = async () => {
  await connectDB();
  
  try {
    const staff = await Staff.find({}).select('name profilePicture profileImageUrl');
    console.log('Staff profile pictures:', JSON.stringify(staff, null, 2));
  } catch (error) {
    console.error('Error fetching staff:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

checkStaff();