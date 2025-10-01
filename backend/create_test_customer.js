import mongoose from 'mongoose';
import User from './models/User.js';
import Customer from './models/Customer.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/auracare', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestCustomer = async () => {
  await connectDB();
  
  try {
    const testEmail = 'customer@test.com';
    const testPassword = 'password123';
    const testName = 'Test Customer';
    
    // Check if customer already exists
    const existingUser = await User.findOne({ email: testEmail });
    const existingCustomer = await Customer.findOne({ email: testEmail });
    
    if (existingUser || existingCustomer) {
      console.log('✅ Test customer already exists');
      console.log('User exists:', !!existingUser);
      console.log('Customer exists:', !!existingCustomer);
      return;
    }
    
    console.log('Creating test customer...');
    
    // Create user in User collection
    const user = await User.create({
      name: testName,
      email: testEmail,
      password: testPassword,
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
      password: testPassword,
      type: 'customer',
      isActive: true
    });
    
    console.log('✅ Customer created:', {
      id: customer._id,
      email: customer.email
    });
    
    console.log('\n🎉 Test customer created successfully!');
    console.log('Login credentials:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('Role: Customer');
    
  } catch (error) {
    console.error('❌ Error creating test customer:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createTestCustomer();
