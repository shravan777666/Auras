import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'auracare'
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
      type: 'admin' 
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      type: 'admin',
      setupCompleted: true,
      isActive: true
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Type: ${adminUser.type}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
