import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Salon from './models/Salon.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'auracare'
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const createFreshTestSalonOwner = async () => {
  try {
    await connectDB();

    // Delete existing test user if it exists
    const existingUser = await User.findOne({ email: 'fresh-test-salon@example.com' });
    if (existingUser) {
      await User.deleteOne({ email: 'fresh-test-salon@example.com' });
      console.log('Deleted existing test user');
    }

    // Delete existing test salon if it exists
    const existingSalon = await Salon.findOne({ email: 'fresh-test-salon@example.com' });
    if (existingSalon) {
      await Salon.deleteOne({ email: 'fresh-test-salon@example.com' });
      console.log('Deleted existing test salon');
    }

    // Create a new user with a known password
    const password = 'FreshTest@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Creating fresh test salon owner user...');
    const testUser = await User.create({
      name: 'Fresh Test Salon Owner',
      email: 'fresh-test-salon@example.com',
      password: hashedPassword,
      type: 'salon',
      setupCompleted: true
    });
    console.log('✅ Fresh test salon owner user created');

    // Create test salon
    console.log('Creating fresh test salon...');
    const testSalon = await Salon.create({
      ownerId: testUser._id,
      email: 'fresh-test-salon@example.com',
      salonName: 'Fresh Test Salon',
      contactNumber: '+1234567890',
      businessHours: {
        openTime: '09:00',
        closeTime: '18:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      },
      isActive: true,
      isVerified: true,
      setupCompleted: true,
      approvalStatus: 'approved'
    });
    console.log('✅ Fresh test salon created');

    console.log('\n🎉 Fresh test salon owner created successfully!');
    console.log('📧 Email: fresh-test-salon@example.com');
    console.log('🔒 Password: FreshTest@123');
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
};

createFreshTestSalonOwner();