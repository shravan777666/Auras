import bcrypt from 'bcryptjs';

const testBcrypt = async () => {
  try {
    console.log('Testing bcrypt functionality...');
    
    const password = '123456';
    console.log(`Password to hash: ${password}`);
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log(`Hashed password: ${hashedPassword}`);
    
    // Verify the password
    const isMatch = await bcrypt.compare(password, hashedPassword);
    console.log(`Password match: ${isMatch}`);
    
    // Test with wrong password
    const isMatchWrong = await bcrypt.compare('wrongpassword', hashedPassword);
    console.log(`Wrong password match: ${isMatchWrong}`);
    
    console.log('Bcrypt test completed successfully');
  } catch (error) {
    console.error('Bcrypt test error:', error);
  }
};

testBcrypt();