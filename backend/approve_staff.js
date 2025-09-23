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

const approveStaff = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('📋 Finding all staff members...');
    const staffMembers = await Staff.find({});
    
    if (staffMembers.length === 0) {
      console.log('⚠️  No staff members found in the database.');
      return;
    }
    
    console.log(`👥 Found ${staffMembers.length} staff member(s):`);
    
    for (let staff of staffMembers) {
      console.log(`\n👤 Staff: ${staff.name} (${staff.email})`);
      console.log(`   Current status: ${staff.approvalStatus}`);
      
      if (staff.approvalStatus !== 'approved') {
        staff.approvalStatus = 'approved';
        staff.approvalDate = new Date();
        await staff.save();
        console.log('   ✅ Status updated to: approved');
      } else {
        console.log('   ✅ Already approved');
      }
    }
    
    console.log('\n🎉 All staff members have been approved!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

approveStaff();