import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Staff from './models/Staff.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auracare';

const debugStaffLogin = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    const email = 'staff@test.com';
    const password = 'password123';
    const userType = 'staff';
    
    console.log(`\n🔍 Debugging login for: ${email}`);
    
    // Check central User model with EXACT same query as auth controller
    console.log('🔍 Testing exact auth controller query...');
    const user = await User.findOne({ email, type: userType, isActive: true });
    console.log('👤 User found by auth query:', user ? {
      id: user._id,
      name: user.name,
      email: user.email,
      type: user.type,
      setupCompleted: user.setupCompleted,
      isActive: user.isActive,
      hasPassword: !!user.password
    } : 'NOT FOUND');
    
    // Also check without isActive filter
    const userWithoutActive = await User.findOne({ email, type: userType });
    console.log('👤 User without isActive filter:', userWithoutActive ? {
      id: userWithoutActive._id,
      name: userWithoutActive.name,
      email: userWithoutActive.email,
      type: userWithoutActive.type,
      isActive: userWithoutActive.isActive
    } : 'NOT FOUND');
    
    // Check Staff model
    const staff = await Staff.findOne({ email, isActive: true });
    console.log('👨‍💼 Staff profile:', staff ? {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      approvalStatus: staff.approvalStatus,
      setupCompleted: staff.setupCompleted,
      isActive: staff.isActive,
      hasPassword: !!staff.password,
      userRef: staff.user
    } : 'NOT FOUND');
    
    if (user) {
      console.log('\n🔐 Testing password verification with User model...');
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password match:', isMatch);
    }
    
    if (staff && staff.password) {
      console.log('\n🔐 Testing password verification with Staff model...');
      const isMatch = await bcrypt.compare(password, staff.password);
      console.log('Password match:', isMatch);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugStaffLogin();