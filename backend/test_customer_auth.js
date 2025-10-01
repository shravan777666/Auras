import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Customer from './models/Customer.js';
import User from './models/User.js';

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

const testCustomerAuth = async () => {
  await connectDB();
  
  try {
    // Check existing customers
    console.log('\n=== CHECKING EXISTING CUSTOMERS ===');
    const customers = await Customer.find({});
    console.log(`Found ${customers.length} customers in Customer collection`);
    
    customers.forEach((customer, index) => {
      console.log(`Customer ${index + 1}:`, {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        hasPassword: !!customer.password,
        passwordLength: customer.password ? customer.password.length : 0
      });
    });
    
    // Check users with customer type
    console.log('\n=== CHECKING USERS WITH CUSTOMER TYPE ===');
    const users = await User.find({ type: 'customer' });
    console.log(`Found ${users.length} users with type 'customer' in User collection`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        id: user._id,
        name: user.name,
        email: user.email,
        type: user.type,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        setupCompleted: user.setupCompleted
      });
    });
    
    // Create a test customer if none exist
    if (customers.length === 0 && users.length === 0) {
      console.log('\n=== CREATING TEST CUSTOMER ===');
      
      // Create in User collection first
      const testUser = await User.create({
        name: 'Test Customer',
        email: 'test@customer.com',
        password: 'password123',
        type: 'customer',
        setupCompleted: true
      });
      
      // Create in Customer collection
      const testCustomer = await Customer.create({
        _id: testUser._id,
        name: 'Test Customer',
        email: 'test@customer.com',
        password: 'password123'
      });
      
      console.log('✅ Test customer created:', {
        userId: testUser._id,
        customerId: testCustomer._id,
        email: testUser.email
      });
    }
    
    // Test password comparison
    if (customers.length > 0) {
      console.log('\n=== TESTING PASSWORD COMPARISON ===');
      const customer = customers[0];
      if (customer.password) {
        const testPassword = 'password123';
        const isMatch = await bcrypt.compare(testPassword, customer.password);
        console.log(`Password comparison for ${customer.email}:`, isMatch);
        
        // If password is not hashed, hash it
        if (customer.password === testPassword) {
          console.log('Password is not hashed, updating...');
          const salt = await bcrypt.genSalt(10);
          customer.password = await bcrypt.hash(testPassword, salt);
          await customer.save();
          console.log('✅ Password updated and hashed');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Test completed');
  }
};

testCustomerAuth();
