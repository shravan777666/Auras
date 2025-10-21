import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendOTPEmail } from './config/email.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the current directory (backend)
dotenv.config({ path: path.join(__dirname, '.env') });

async function testEmail() {
  try {
    console.log('Testing email sending...');
    const result = await sendOTPEmail('test@example.com', '123456', 'customer');
    console.log('Email result:', result);
  } catch (error) {
    console.error('Email error:', error);
  }
}

testEmail();