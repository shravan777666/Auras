import './server.js';
import Staff from './models/Staff.js';
import User from './models/User.js';

const checkStaffStatus = async () => {
  try {
    console.log('🔍 Checking staff statuses...');
    
    const users = await User.find({ type: 'staff' });
    console.log(`📊 Total staff users: ${users.length}`);
    
    for (let user of users) {
      const staff = await Staff.findOne({ user: user._id });
      console.log(`👤 User: ${user.email}`);
      console.log(`   - Setup Completed: ${user.setupCompleted}`);
      console.log(`   - Staff Approval Status: ${staff?.approvalStatus || 'none'}`);
      console.log(`   - Staff Profile Exists: ${!!staff}`);
      console.log('---');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

setTimeout(checkStaffStatus, 2000);