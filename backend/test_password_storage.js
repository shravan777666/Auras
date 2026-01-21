import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare';

const testPasswordStorage = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
    
    const email = 'customer@test.com';
    const testPassword = 'password123';
    
    console.log(`\n🔍 Checking password storage for ${email}\n`);
    
    // Find the user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('User found:', {
      id: user._id,
      email: user.email,
      password: user.password ? user.password.substring(0, 30) + '...' : 'NO PASSWORD'
    });
    
    if (user.password) {
      console.log('\nTesting password comparison:');
      
      // Test with the expected password
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log(`Password '${testPassword}' matches: ${isMatch}`);
      
      // Test with a wrong password
      const isMatchWrong = await bcrypt.compare('wrongpassword', user.password);
      console.log(`Password 'wrongpassword' matches: ${isMatchWrong}`);
      
      // If password doesn't match, let's see what the stored password actually is
      if (!isMatch) {
        console.log('\nStored password analysis:');
        console.log(`Full stored password: ${user.password}`);
        console.log(`Password length: ${user.password.length}`);
        
        // Check if it looks like a bcrypt hash
        const isBcryptHash = user.password.startsWith('$2b$') || user.password.startsWith('$2a$') || user.password.startsWith('$2y$');
        console.log(`Is bcrypt hash: ${isBcryptHash}`);
        
        // If it's not a bcrypt hash, it might be stored as plaintext
        if (!isBcryptHash) {
          console.log(`Password stored as plaintext: ${user.password === testPassword}`);
        }
      }
    } else {
      console.log('❌ No password stored for user');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Test completed');
  }
};

testPasswordStorage();