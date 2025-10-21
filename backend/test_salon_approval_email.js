import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendSalonApprovalEmail, sendSalonRejectionEmail } from './config/email.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function testSalonApprovalEmail() {
  try {
    console.log('Testing salon approval email...');
    
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration not found. Please set EMAIL_USER and EMAIL_PASS in your .env file.');
      return;
    }
    
    console.log('Sending approval email to test@example.com...');
    const approvalResult = await sendSalonApprovalEmail(
      'test@example.com',
      'Test Salon',
      'Test Owner'
    );
    
    console.log('Approval email result:', approvalResult);
    
    console.log('Sending rejection email to test@example.com...');
    const rejectionResult = await sendSalonRejectionEmail(
      'test@example.com',
      'Test Salon',
      'Test Owner',
      'Incomplete documentation provided'
    );
    
    console.log('Rejection email result:', rejectionResult);
    
  } catch (error) {
    console.error('Error testing salon approval emails:', error);
  }
}

testSalonApprovalEmail();