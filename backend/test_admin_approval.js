import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Salon from './models/Salon.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

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

// Test function to simulate salon approval
async function testSalonApproval() {
  try {
    await connectDB();
    
    // Create a test salon if it doesn't exist
    let testSalon = await Salon.findOne({ email: 'test-salon@example.com' });
    
    if (!testSalon) {
      console.log('Creating test salon...');
      testSalon = new Salon({
        salonName: 'Test Salon',
        ownerName: 'Test Owner',
        email: 'test-salon@example.com',
        password: 'password123',
        contactNumber: '+1234567890',
        salonAddress: '123 Test Street, Test City',
        businessHours: {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: { open: '10:00', close: '16:00' },
          sunday: { open: '10:00', close: '16:00' }
        },
        approvalStatus: 'pending',
        isVerified: false,
        setupCompleted: true,
        isActive: true
      });
      
      await testSalon.save();
      console.log('✅ Test salon created');
    } else {
      console.log('✅ Test salon already exists');
    }
    
    console.log('Test salon ID:', testSalon._id);
    console.log('Test salon approval status:', testSalon.approvalStatus);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testSalonApproval();