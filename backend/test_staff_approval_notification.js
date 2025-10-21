import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendStaffApprovalEmail, sendStaffApprovalNotificationEmail } from './config/email.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function testStaffApprovalNotifications() {
  try {
    console.log('Testing staff approval notification emails...');
    
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration not found. Please set EMAIL_USER and EMAIL_PASS in your .env file.');
      return;
    }
    
    console.log('Sending staff approval email to test@example.com...');
    const staffResult = await sendStaffApprovalEmail(
      'test@example.com',
      'John Doe',
      'Test Salon',
      'Hair Stylist'
    );
    
    console.log('Staff approval email result:', staffResult);
    
    console.log('Sending staff approval notification email to salon owner...');
    const ownerResult = await sendStaffApprovalNotificationEmail(
      'owner@testsalon.com',
      'Test Salon',
      'John Doe',
      'Hair Stylist'
    );
    
    console.log('Staff approval notification email result:', ownerResult);
    
  } catch (error) {
    console.error('Error testing staff approval notification emails:', error);
  }
}

testStaffApprovalNotifications();