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

const approveTestSalon = async () => {
  try {
    await connectDB();

    // Find the test salon
    const testSalon = await Salon.findOne({ email: 'api-test-salon@example.com' });
    if (testSalon) {
      console.log('Found test salon:', testSalon.salonName);
      
      // Approve the salon
      testSalon.approvalStatus = 'approved';
      testSalon.isVerified = true;
      testSalon.setupCompleted = true;
      await testSalon.save();
      
      console.log('✅ Test salon approved');
      
      // Also update the user
      const testUser = await User.findById(testSalon.ownerId);
      if (testUser) {
        testUser.setupCompleted = true;
        await testUser.save();
        console.log('✅ Test user updated');
      }
    } else {
      console.log('Test salon not found');
    }
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
};

approveTestSalon();