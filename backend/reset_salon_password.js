import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Salon from './models/Salon.js';
import bcrypt from 'bcryptjs';

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

const resetPassword = async () => {
  await connectDB();
  
  const email = process.argv[2];
  const newPassword = process.argv[3];
  
  if (!email || !newPassword) {
    console.log('Usage: node reset_salon_password.js <email> <new_password>');
    console.log('Example: node reset_salon_password.js shravanachu7@gmail.com newpassword123');
    process.exit(1);
  }
  
  try {
    // Find the user
    const user = await User.findOne({ email, type: 'salon' });
    if (!user) {
      console.log(`❌ No salon user found with email: ${email}`);
      process.exit(1);
    }
    
    console.log(`✅ Found salon user: ${user.name} (${user.email})`);
    
    // Update user password
    user.password = newPassword; // This will be hashed by the pre-save hook
    await user.save();
    console.log(`✅ Updated User password for ${user.email}`);
    
    // Also update Salon password if it exists (for consistency)
    const salon = await Salon.findOne({ email });
    if (salon) {
      salon.password = newPassword; // This will be hashed by the pre-save hook
      await salon.save();
      console.log(`✅ Updated Salon password for ${salon.email}`);
    } else {
      console.log(`⚠️ No Salon record found for ${email}`);
    }
    
    console.log(`\n🎉 Password reset completed for ${email}`);
    console.log(`You can now login with:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log(`UserType: salon`);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

resetPassword();
