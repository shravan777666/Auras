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

const fixCustomerPasswords = async () => {
  await connectDB();
  
  try {
    console.log('\n=== FIXING CUSTOMER PASSWORDS ===');
    
    // Get all customers
    const customers = await Customer.find({});
    console.log(`Found ${customers.length} customers`);
    
    for (const customer of customers) {
      if (customer.password) {
        // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        const isHashed = customer.password.startsWith('$2');
        
        if (!isHashed) {
          console.log(`Fixing unhashed password for: ${customer.email}`);
          const salt = await bcrypt.genSalt(10);
          customer.password = await bcrypt.hash(customer.password, salt);
          await customer.save();
          console.log(`✅ Password hashed for: ${customer.email}`);
        } else {
          console.log(`✓ Password already hashed for: ${customer.email}`);
        }
      } else {
        console.log(`⚠️ No password found for: ${customer.email}`);
      }
    }
    
    // Also check User collection for customer type users
    console.log('\n=== CHECKING USER COLLECTION ===');
    const users = await User.find({ type: 'customer' });
    console.log(`Found ${users.length} customer users`);
    
    for (const user of users) {
      if (user.password) {
        const isHashed = user.password.startsWith('$2');
        if (!isHashed) {
          console.log(`Fixing unhashed password for user: ${user.email}`);
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          await user.save();
          console.log(`✅ User password hashed for: ${user.email}`);
        } else {
          console.log(`✓ User password already hashed for: ${user.email}`);
        }
      }
    }
    
    console.log('\n✅ Password fix completed');
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

fixCustomerPasswords();
