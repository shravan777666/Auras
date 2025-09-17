import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Salon from './models/Salon.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'auracare'
    });
    console.log('✅ MongoDB connected for debugging');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const checkDatabase = async () => {
  await connectDB();
  
  console.log('\n=== DATABASE DEBUG INFO ===\n');
  
  // Check Users collection
  console.log('👥 USERS COLLECTION:');
  const users = await User.find({}).select('name email type isActive setupCompleted createdAt');
  console.log(`Total users: ${users.length}`);
  
  if (users.length > 0) {
    console.log('\nUser records:');
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name || 'No name'} (${user.email}) - Type: ${user.type} - Active: ${user.isActive} - Setup: ${user.setupCompleted}`);
    });
  } else {
    console.log('No users found in database');
  }
  
  // Check specifically for salon type users
  console.log('\n🏪 SALON TYPE USERS:');
  const salonUsers = await User.find({ type: 'salon' }).select('name email isActive setupCompleted');
  console.log(`Total salon users: ${salonUsers.length}`);
  
  if (salonUsers.length > 0) {
    salonUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name || 'No name'} (${user.email}) - Active: ${user.isActive} - Setup: ${user.setupCompleted}`);
    });
  }
  
  // Check Salons collection
  console.log('\n🏪 SALONS COLLECTION:');
  const salons = await Salon.find({}).select('salonName ownerName email approvalStatus isActive isVerified setupCompleted createdAt');
  console.log(`Total salons: ${salons.length}`);
  
  if (salons.length > 0) {
    console.log('\nSalon records:');
    salons.forEach((salon, i) => {
      console.log(`${i + 1}. ${salon.salonName || 'No salon name'} - Owner: ${salon.ownerName || 'No owner name'} (${salon.email}) - Status: ${salon.approvalStatus} - Active: ${salon.isActive} - Verified: ${salon.isVerified}`);
    });
  } else {
    console.log('No salons found in database');
  }
  
  // Check for common login issues
  console.log('\n🔍 POTENTIAL LOGIN ISSUES:');
  
  // Check for salon users without corresponding salon profiles
  for (const salonUser of salonUsers) {
    const correspondingSalon = await Salon.findOne({ email: salonUser.email });
    if (!correspondingSalon) {
      console.log(`❌ Salon user ${salonUser.email} has NO corresponding salon profile`);
    } else if (correspondingSalon.approvalStatus !== 'approved') {
      console.log(`⚠️  Salon user ${salonUser.email} has salon profile but status is: ${correspondingSalon.approvalStatus}`);
    } else {
      console.log(`✅ Salon user ${salonUser.email} has approved salon profile`);
    }
  }
  
  // Check for inactive users
  const inactiveUsers = await User.find({ isActive: false });
  if (inactiveUsers.length > 0) {
    console.log(`⚠️  Found ${inactiveUsers.length} inactive users`);
  }
  
  console.log('\n=== END DEBUG INFO ===\n');
  
  mongoose.disconnect();
  process.exit(0);
};

checkDatabase().catch((error) => {
  console.error('Debug script error:', error);
  mongoose.disconnect();
  process.exit(1);
});
