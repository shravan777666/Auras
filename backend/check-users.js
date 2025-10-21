import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the current directory (backend)
dotenv.config({ path: path.join(__dirname, '.env') });

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  type: String,
  isActive: Boolean,
  setupCompleted: Boolean
});

const User = mongoose.model('User', userSchema);

// Customer Schema
const customerSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  type: String,
  isActive: Boolean
});

const Customer = mongoose.model('Customer', customerSchema);

const checkUsers = async () => {
  try {
    console.log('Connecting to database...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'auracare',
      serverSelectionTimeoutMS: 8000
    });
    
    console.log('✅ Connected to database');
    
    // Check users in User collection
    console.log('\n--- Users in User collection ---');
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.type}) - Active: ${user.isActive}`);
    });
    
    // Check users in Customer collection
    console.log('\n--- Users in Customer collection ---');
    const customers = await Customer.find({});
    console.log(`Found ${customers.length} customers:`);
    customers.forEach(customer => {
      console.log(`- ${customer.email} (${customer.type}) - Active: ${customer.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

checkUsers();