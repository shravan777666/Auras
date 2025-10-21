import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendOTPEmail } from './config/email.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the current directory (backend)
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Checking email configuration:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS set:', !!process.env.EMAIL_PASS);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);

async function testEmail() {
  try {
    console.log('\nTesting email sending...');
    console.log('Calling sendOTPEmail with:', {
      email: 'test@example.com',
      otp: '123456',
      userType: 'customer'
    });
    
    const result = await sendOTPEmail('test@example.com', '123456', 'customer');
    console.log('Email result:', result);
  } catch (error) {
    console.error('Email error:', error);
  }
}

testEmail();