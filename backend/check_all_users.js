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

const checkAllUsers = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('📋 Finding all users...');
    const users = await User.find({});
    console.log(`👥 Total users: ${users.length}`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in the database.');
      return;
    }
    
    for (let user of users) {
      console.log(`\n👤 User: ${user.name} (${user.email})`);
      console.log(`   Type: ${user.type}`);
      console.log(`   Setup Completed: ${user.setupCompleted}`);
      
      if (user.type === 'staff') {
        const staff = await Staff.findOne({ user: user._id });
        if (staff) {
          console.log(`   Staff Profile: ✅ Found`);
          console.log(`   Approval Status: ${staff.approvalStatus}`);
        } else {
          console.log(`   Staff Profile: ❌ Missing`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

checkAllUsers();