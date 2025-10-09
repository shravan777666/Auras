import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Salon from './models/Salon.js';

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

const createTestSalonOwner = async () => {
  try {
    await connectDB();

    // Check if test salon owner already exists
    let testUser = await User.findOne({ email: 'test-salon-owner@example.com' });
    if (!testUser) {
      console.log('Creating test salon owner user...');
      testUser = await User.create({
        name: 'Test Salon Owner',
        email: 'test-salon-owner@example.com',
        password: 'Test@123',
        type: 'salon',
        setupCompleted: true
      });
      console.log('✅ Test salon owner user created');
    } else {
      console.log('Test salon owner user already exists');
    }

    // Check if test salon exists
    let testSalon = await Salon.findOne({ email: 'test-salon-owner@example.com' });
    if (!testSalon) {
      console.log('Creating test salon...');
      testSalon = await Salon.create({
        ownerId: testUser._id,
        email: 'test-salon-owner@example.com',
        salonName: 'Test Salon',
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
      console.log('✅ Test salon created');
    } else {
      console.log('Test salon already exists');
    }

    console.log('\n🎉 Test salon owner created successfully!');
    console.log('📧 Email: test-salon-owner@example.com');
    console.log('🔒 Password: Test@123');
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
};

createTestSalonOwner();