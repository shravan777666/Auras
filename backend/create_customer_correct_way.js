import mongoose from 'mongoose';
import User from './models/User.js';
import Customer from './models/Customer.js';

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare';

const createTestCustomerCorrectWay = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
    
    const testEmail = 'customer@test.com';
    const testPassword = 'password123';
    const testName = 'Test Customer';
    
    console.log('Creating test customer the correct way (letting pre-save hook hash password)...');
    
    // Delete existing user and customer records
    await User.deleteMany({ email: testEmail });
    await Customer.deleteMany({ email: testEmail });
    
    console.log('✅ Cleaned up existing test customer records');
    
    // Create user with PLAIN TEXT password - the pre-save hook will hash it automatically
    const user = await User.create({
      name: testName,
      email: testEmail,
      password: testPassword, // Plain text - will be hashed by pre-save hook
      type: 'customer',
      setupCompleted: true,
      isActive: true
    });
    
    console.log('✅ User created:', {
      id: user._id,
      email: user.email,
      type: user.type,
      passwordHash: user.password.substring(0, 30) + '...'
    });
    
    // Verify the password was hashed by checking if it's a bcrypt hash
    const isBcryptHash = user.password.startsWith('$2b$') || user.password.startsWith('$2a$') || user.password.startsWith('$2y$');
    console.log(`Password is bcrypt hash: ${isBcryptHash}`);
    
    // Create customer in Customer collection (also with plain text password)
    const customer = await Customer.create({
      _id: user._id,
      name: testName,
      email: testEmail,
      password: testPassword, // Plain text - assuming Customer model also has pre-save hook
      type: 'customer',
      isActive: true
    });
    
    console.log('✅ Customer created:', {
      id: customer._id,
      email: customer.email
    });
    
    // Verify the saved password works by testing login
    console.log('\nTesting login with created credentials...');
    
    // Find the user and test password comparison
    const savedUser = await User.findOne({ email: testEmail }).select('+password');
    
    // Import bcrypt to test
    const bcrypt = (await import('bcryptjs')).default;
    const isMatch = await bcrypt.compare(testPassword, savedUser.password);
    console.log(`Password verification result: ${isMatch}`);
    
    if (isMatch) {
      console.log('\n🎉 Test customer created successfully with working password!');
      console.log('Login credentials:');
      console.log('Email:', testEmail);
      console.log('Password:', testPassword);
      console.log('Role: Customer');
    } else {
      console.log('❌ Password verification failed!');
    }
    
  } catch (error) {
    console.error('❌ Error creating test customer:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createTestCustomerCorrectWay();