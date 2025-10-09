import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Salon from './models/Salon.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const showUsage = () => {
  console.log('\n📋 Salon Approval Management Tool\n');
  console.log('Usage: node manage_salon_approval.js <command> [parameters]');
  console.log('\nCommands:');
  console.log('  list                           - Show all pending salon approvals');
  console.log('  approve <email>               - Approve a salon registration');
  console.log('  reject <email> [reason]       - Reject a salon registration with optional reason');
  console.log('  status <email>                - Check status of a salon registration');
  console.log('\nExamples:');
  console.log('  node manage_salon_approval.js list');
  console.log('  node manage_salon_approval.js approve testsalon@example.com');
  console.log('  node manage_salon_approval.js reject testsalon@example.com "Incomplete documentation"');
  console.log('  node manage_salon_approval.js status testsalon@example.com');
};

const listPendingSalons = async () => {
  const pendingSalons = await Salon.find({ approvalStatus: 'pending' })
    .select('salonName ownerName email createdAt');
  
  if (pendingSalons.length === 0) {
    console.log('✅ No pending salon approvals');
    return;
  }
  
  console.log(`\n📋 ${pendingSalons.length} Pending Salon Approval(s):\n`);
  pendingSalons.forEach((salon, i) => {
    console.log(`${i + 1}. ${salon.salonName || 'Unnamed Salon'}`);
    console.log(`   Owner: ${salon.ownerName || 'Not specified'}`);
    console.log(`   Email: ${salon.email}`);
    console.log(`   Registered: ${salon.createdAt?.toLocaleDateString() || 'Unknown'}`);
    console.log('');
  });
};

const listAllSalons = async () => {
  const allSalons = await Salon.find({})
    .select('salonName ownerName email approvalStatus createdAt');
  
  if (allSalons.length === 0) {
    console.log('✅ No salons found in the database');
    return;
  }
  
  console.log(`\n📋 ${allSalons.length} Total Salon(s) in Database:\n`);
  allSalons.forEach((salon, i) => {
    console.log(`${i + 1}. ${salon.salonName || 'Unnamed Salon'}`);
    console.log(`   Owner: ${salon.ownerName || 'Not specified'}`);
    console.log(`   Email: ${salon.email}`);
    console.log(`   Status: ${salon.approvalStatus}`);
    console.log(`   Registered: ${salon.createdAt?.toLocaleDateString() || 'Unknown'}`);
    console.log('');
  });
};

const approveSalon = async (email) => {
  const salon = await Salon.findOne({ email });
  if (!salon) {
    console.log(`❌ No salon found with email: ${email}`);
    return;
  }
  
  if (salon.approvalStatus === 'approved') {
    console.log(`✅ Salon ${email} is already approved`);
    return;
  }
  
  // Update salon status
  salon.approvalStatus = 'approved';
  salon.isVerified = true;
  await salon.save();
  
  console.log(`✅ Approved salon: ${salon.salonName || 'Unnamed'} (${email})`);
  console.log('🎉 The salon owner can now log in!');
};

const rejectSalon = async (email, reason) => {
  const salon = await Salon.findOne({ email });
  if (!salon) {
    console.log(`❌ No salon found with email: ${email}`);
    return;
  }
  
  if (salon.approvalStatus === 'rejected') {
    console.log(`❌ Salon ${email} is already rejected`);
    return;
  }
  
  // Update salon status
  salon.approvalStatus = 'rejected';
  salon.rejectionReason = reason || 'No reason provided';
  salon.isVerified = false;
  await salon.save();
  
  console.log(`❌ Rejected salon: ${salon.salonName || 'Unnamed'} (${email})`);
  console.log(`📝 Reason: ${salon.rejectionReason}`);
};

const checkStatus = async (email) => {
  const salon = await Salon.findOne({ email });
  if (!salon) {
    console.log(`❌ No salon found with email: ${email}`);
    return;
  }
  
  console.log(`\n📊 Salon Status for ${email}:`);
  console.log(`Name: ${salon.salonName || 'Not set'}`);
  console.log(`Owner: ${salon.ownerName || 'Not set'}`);
  console.log(`Status: ${salon.approvalStatus}`);
  console.log(`Verified: ${salon.isVerified}`);
  console.log(`Active: ${salon.isActive}`);
  console.log(`Setup Completed: ${salon.setupCompleted}`);
  if (salon.rejectionReason) {
    console.log(`Rejection Reason: ${salon.rejectionReason}`);
  }
  console.log(`Created: ${salon.createdAt?.toLocaleString() || 'Unknown'}`);
};

const main = async () => {
  await connectDB();
  
  const command = process.argv[2];
  const email = process.argv[3];
  const reason = process.argv[4];
  
  try {
    switch (command) {
      case 'list':
        await listPendingSalons();
        break;
      case 'list-all':
        await listAllSalons();
        break;
      case 'approve':
        if (!email) {
          console.log('❌ Email is required for approve command');
          showUsage();
          process.exit(1);
        }
        await approveSalon(email);
        break;
      case 'reject':
        if (!email) {
          console.log('❌ Email is required for reject command');
          showUsage();
          process.exit(1);
        }
        await rejectSalon(email, reason);
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
