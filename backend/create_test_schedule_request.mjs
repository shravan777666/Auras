import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ScheduleRequest from './models/ScheduleRequest.js';
import Staff from './models/Staff.js';
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

const createTestScheduleRequest = async () => {
  try {
    await connectDB();

    // Find our test salon
    const testSalon = await Salon.findOne({ email: 'api-test-salon@example.com' });
    if (!testSalon) {
      console.log('Test salon not found');
      return;
    }
    
    console.log('Found test salon:', testSalon.salonName);
    
    // Find a staff member for this salon
    const staffMember = await Staff.findOne({ assignedSalon: testSalon._id });
    if (!staffMember) {
      console.log('No staff member found for this salon, creating one...');
      
      // Create a test staff member
      const testStaff = await Staff.create({
        name: 'Test Staff for API Salon',
        email: 'test-staff-for-api-salon@example.com',
        assignedSalon: testSalon._id,
        position: 'Hair Stylist',
        approvalStatus: 'approved',
        setupCompleted: true
      });
      
      console.log('Created test staff member:', testStaff.name);
      
      // Create a pending schedule request for this staff member
      const scheduleRequest = await ScheduleRequest.create({
        staffId: testStaff._id,
        salonId: testSalon._id,
        type: 'leave',
        leave: {
          startDate: '2025-10-15',
          endDate: '2025-10-16',
          reason: 'Personal Leave',
          notes: 'Family event'
        },
        status: 'pending'
      });
      
      console.log('✅ Created test schedule request:', scheduleRequest._id);
    } else {
      console.log('Found staff member:', staffMember.name);
      
      // Create a pending schedule request for this staff member
      const scheduleRequest = await ScheduleRequest.create({
        staffId: staffMember._id,
        salonId: testSalon._id,
        type: 'leave',
        leave: {
          startDate: '2025-10-15',
          endDate: '2025-10-16',
          reason: 'Personal Leave',
          notes: 'Family event'
        },
        status: 'pending'
      });
      
      console.log('✅ Created test schedule request:', scheduleRequest._id);
    }
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
};

createTestScheduleRequest();