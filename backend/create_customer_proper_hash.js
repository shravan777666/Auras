import mongoose from 'mongoose';
import User from './models/User.js';
import Customer from './models/Customer.js';
import bcrypt from 'bcryptjs';

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare';

const createTestCustomerWithProperHash = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
    
    const testEmail = 'customer@test.com';
    const testPassword = 'password123';
    const testName = 'Test Customer';
    
    console.log('Creating test customer with proper password hashing...');
    
    // Delete existing user and customer records
    await User.deleteMany({ email: testEmail });
    await Customer.deleteMany({ email: testEmail });
    
    console.log('✅ Cleaned up existing test customer records');
    
    // Hash the password properly
    console.log('Hashing password...');
    const saltRounds = 12; // Use higher rounds for better security
    const salt = await bcrypt.genSalt(saltRounds);
    console.log(`Generated salt: ${salt}`);
    
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    console.log(`Hashed password: ${hashedPassword.substring(0, 30)}...`);
    
    // Verify the hash works before saving
    console.log('Verifying hash...');
    const verification = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`Password verification: ${verification}`);
    
    if (!verification) {
      console.log('❌ Password verification failed before saving!');
      return;
    }
    
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
    
    // Verify the saved password works
    console.log('\nVerifying saved password...');
    const savedUser = await User.findOne({ email: testEmail }).select('+password');
    const savedVerification = await bcrypt.compare(testPassword, savedUser.password);
    console.log(`Saved password verification: ${savedVerification}`);
    
    if (savedVerification) {
      console.log('\n🎉 Test customer created successfully with working password!');
      console.log('Login credentials:');
      console.log('Email:', testEmail);
      console.log('Password:', testPassword);
      console.log('Role: Customer');
    } else {
      console.log('❌ Saved password verification failed!');
    }
    
  } catch (error) {
    console.error('❌ Error creating test customer:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createTestCustomerWithProperHash();