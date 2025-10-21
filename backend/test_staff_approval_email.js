import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendStaffApprovalNotificationEmail } from './config/email.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function testStaffApprovalEmail() {
  try {
    console.log('Testing staff approval notification email...');
    
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration not found. Please set EMAIL_USER and EMAIL_PASS in your .env file.');
      return;
    }
    
    console.log('Sending staff approval notification email to test@example.com...');
    const result = await sendStaffApprovalNotificationEmail(
      'test@example.com',
      'Test Salon',
      'John Doe',
      'Hair Stylist'
    );
    
    console.log('Staff approval notification email result:', result);
    
  } catch (error) {
    console.error('Error testing staff approval notification email:', error);
  }
}

testStaffApprovalEmail();