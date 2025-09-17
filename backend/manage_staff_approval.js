import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Staff from './models/Staff.js';

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

const showUsage = () => {
  console.log('\n📋 Staff Approval Management Tool\n');
  console.log('Usage: node manage_staff_approval.js <command> [parameters]');
  console.log('\nCommands:');
  console.log('  list                           - Show all pending staff approvals');
  console.log('  approve <email>               - Approve a staff application');
  console.log('  reject <email> [reason]       - Reject a staff application with optional reason');
  console.log('  status <email>                - Check status of a staff application');
  console.log('\nExamples:');
  console.log('  node manage_staff_approval.js list');
  console.log('  node manage_staff_approval.js approve staff@example.com');
  console.log('  node manage_staff_approval.js reject staff@example.com "Incomplete profile"');
  console.log('  node manage_staff_approval.js status staff@example.com');
};

const listPendingStaff = async () => {
  const pendingStaff = await Staff.find({ approvalStatus: 'pending' })
    .select('name email position skills experience setupCompleted createdAt');
  
  if (pendingStaff.length === 0) {
    console.log('✅ No pending staff approvals');
    return;
  }
  
  console.log(`\n📋 ${pendingStaff.length} Pending Staff Application(s):\n`);
  pendingStaff.forEach((staff, i) => {
    console.log(`${i + 1}. ${staff.name || 'Unnamed Staff'}`);
    console.log(`   Email: ${staff.email}`);
    console.log(`   Position: ${staff.position || 'Not specified'}`);
    console.log(`   Skills: ${staff.skills?.join(', ') || 'Not specified'}`);
    console.log(`   Experience: ${staff.experience?.years || 0} years`);
    console.log(`   Setup Completed: ${staff.setupCompleted ? 'Yes' : 'No'}`);
    console.log(`   Applied: ${staff.createdAt?.toLocaleDateString() || 'Unknown'}`);
    console.log('');
  });
};

const approveStaff = async (email) => {
  const staff = await Staff.findOne({ email });
  if (!staff) {
    console.log(`❌ No staff found with email: ${email}`);
    return;
  }
  
  if (staff.approvalStatus === 'approved') {
    console.log(`✅ Staff ${email} is already approved`);
    return;
  }
  
  // Update staff status
  staff.approvalStatus = 'approved';
  staff.isVerified = true;
  staff.approvalDate = new Date();
  await staff.save();
  
  console.log(`✅ Approved staff: ${staff.name || 'Unnamed'} (${email})`);
  console.log('🎉 The staff member can now log in and access their dashboard!');
};

const rejectStaff = async (email, reason) => {
  const staff = await Staff.findOne({ email });
  if (!staff) {
    console.log(`❌ No staff found with email: ${email}`);
    return;
  }
  
  if (staff.approvalStatus === 'rejected') {
    console.log(`❌ Staff ${email} is already rejected`);
    return;
  }
  
  // Update staff status
  staff.approvalStatus = 'rejected';
  staff.rejectionReason = reason || 'No reason provided';
  staff.isVerified = false;
  await staff.save();
  
  console.log(`❌ Rejected staff: ${staff.name || 'Unnamed'} (${email})`);
  console.log(`📝 Reason: ${staff.rejectionReason}`);
};

const checkStatus = async (email) => {
  const staff = await Staff.findOne({ email })
    .populate('assignedSalon', 'salonName')
    .populate('user', 'name email setupCompleted');
  
  if (!staff) {
    console.log(`❌ No staff found with email: ${email}`);
    return;
  }
  
  console.log(`\n📊 Staff Status for ${email}:`);
  console.log(`Name: ${staff.name || 'Not set'}`);
  console.log(`Position: ${staff.position || 'Not set'}`);
  console.log(`Status: ${staff.approvalStatus}`);
  console.log(`Verified: ${staff.isVerified}`);
  console.log(`Active: ${staff.isActive}`);
  console.log(`Setup Completed: ${staff.setupCompleted}`);
  console.log(`User Setup Completed: ${staff.user?.setupCompleted || 'Unknown'}`);
  console.log(`Skills: ${staff.skills?.join(', ') || 'None specified'}`);
  console.log(`Experience: ${staff.experience?.years || 0} years`);
  console.log(`Assigned Salon: ${staff.assignedSalon?.salonName || 'None'}`);
  
  if (staff.rejectionReason) {
    console.log(`Rejection Reason: ${staff.rejectionReason}`);
  }
  
  if (staff.approvalDate) {
    console.log(`Approved On: ${staff.approvalDate.toLocaleString()}`);
  }
  
  console.log(`Applied: ${staff.createdAt?.toLocaleString() || 'Unknown'}`);
  console.log(`Last Updated: ${staff.updatedAt?.toLocaleString() || 'Unknown'}`);
};

const main = async () => {
  await connectDB();
  
  const command = process.argv[2];
  const email = process.argv[3];
  const reason = process.argv[4];
  
  try {
    switch (command) {
      case 'list':
        await listPendingStaff();
        break;
      case 'approve':
        if (!email) {
          console.log('❌ Email is required for approve command');
          showUsage();
          process.exit(1);
        }
        await approveStaff(email);
        break;
      case 'reject':
        if (!email) {
          console.log('❌ Email is required for reject command');
          showUsage();
          process.exit(1);
        }
        await rejectStaff(email, reason);
        break;
      case 'status':
        if (!email) {
          console.log('❌ Email is required for status command');
          showUsage();
          process.exit(1);
        }
        await checkStatus(email);
        break;
      default:
        console.log(`❌ Unknown command: ${command || 'none'}`);
        showUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

main();
