import mongoose from 'mongoose';
import User from './models/User.js';
import Customer from './models/Customer.js';
import bcrypt from 'bcryptjs';

// Connect to MongoDB using the same connection as the server
const connectDB = async () => {
  try {
    // Use the same MongoDB URI as the server
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare';
    await mongoose.connect(mongoUri, {
      // Remove deprecated options
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createFreshTestCustomer = async () => {
  await connectDB();
  
  try {
    const testEmail = 'customer@test.com';
    const testPassword = 'password123';
    const testName = 'Test Customer';
    
    console.log('Creating fresh test customer...');
    
    // Delete existing user and customer records
    await User.deleteMany({ email: testEmail });
    await Customer.deleteMany({ email: testEmail });
    
    console.log('✅ Cleaned up existing test customer records');
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
    
    // Create user in User collection
    const user = await User.create({
      name: testName,
      email: testEmail,
      password: hashedPassword,
      type: 'customer',
      setupCompleted: true,
      isActive: true
    });
    
    console.log('✅ User created:', {
      id: user._id,
      email: user.email,
      type: user.type
    });
    
    // Create customer in Customer collection
    const customer = await Customer.create({
      _id: user._id,
      name: testName,
      email: testEmail,
      password: hashedPassword,
      type: 'customer',
      isActive: true
    });
    
    console.log('✅ Customer created:', {
      id: customer._id,
      email: customer.email
    });
    
    console.log('\n🎉 Fresh test customer created successfully!');
    console.log('Login credentials:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('Role: Customer');
    
  } catch (error) {
    console.error('❌ Error creating fresh test customer:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createFreshTestCustomer();