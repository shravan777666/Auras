import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Staff from './models/Staff.js';
import User from './models/User.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auracare';

const createTestStaff = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    // Check if staff user already exists
    const existingUser = await User.findOne({ email: 'staff@test.com' });
    if (existingUser) {
      console.log('👤 Staff user already exists');
      const staff = await Staff.findOne({ user: existingUser._id });
      if (staff) {
        console.log('📋 Staff profile exists, approving...');
        staff.approvalStatus = 'approved';
        staff.approvalDate = new Date();
        await staff.save();
        console.log('✅ Staff approved successfully');
      } else {
        console.log('❌ Staff profile missing, creating...');
        const newStaff = await Staff.create({
          name: existingUser.name,
          email: existingUser.email,
          user: existingUser._id,
          approvalStatus: 'approved',
          approvalDate: new Date(),
          setupCompleted: true
        });
        console.log('✅ Staff profile created and approved');
      }
      return;
    }
    
    console.log('👤 Creating test staff user...');
    
    // Create User for authentication
    const staffUser = await User.create({
      name: 'Test Staff',
      email: 'staff@test.com',
      password: 'password123',
      type: 'staff',
      setupCompleted: true
    });
    
    console.log('✅ Staff user created');
    
    // Create Staff profile
    const staffProfile = await Staff.create({
      name: 'Test Staff',
      email: 'staff@test.com',
      user: staffUser._id,
      contactNumber: '+1234567890',
      position: 'Hair Stylist',
      experience: {
        years: 3,
        description: 'Experienced hair stylist with modern techniques'
      },
      skills: ['Hair Cutting', 'Hair Coloring', 'Hair Styling'],
      specialization: 'Hair Care',
      approvalStatus: 'approved',
      approvalDate: new Date(),
      setupCompleted: true,
      availability: {
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: {
          startTime: '09:00',
          endTime: '17:00'
        }
      }
    });
    
    console.log('✅ Staff profile created and approved');
    console.log('\n🎉 Test staff created successfully!');
    console.log('📧 Email: staff@test.com');
    console.log('🔒 Password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

createTestStaff();