import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';
import User from './models/User.js';
import { sendStaffApprovalEmail, sendStaffApprovalNotificationEmail } from './config/email.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function testStaffApprovalEmails() {
  try {
    console.log('=== Testing Staff Approval Email Functionality ===');
    
    // Check email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in your .env file.');
      return;
    }
    
    console.log('✅ Email configuration found');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'auracare'
    });
    console.log('✅ Connected to MongoDB');
    
    // Find a sample staff member for testing
    const staff = await Staff.findOne({ email: { $exists: true, $ne: null } });
    if (!staff) {
      console.log('⚠️ No staff members with email found in database.');
      return;
    }
    
    console.log('Found staff member for testing:', {
      id: staff._id,
      name: staff.name,
      email: staff.email
    });
    
    // Find assigned salon if exists
    let salonName = 'Test Salon';
    let position = 'Staff';
    
    if (staff.assignedSalon) {
      const salon = await Salon.findById(staff.assignedSalon);
      if (salon) {
        salonName = salon.salonName || salonName;
        position = staff.position || position;
      }
    }
    
    // Test sending email to staff member
    console.log('\n--- Testing Staff Approval Email ---');
    try {
      const staffEmailResult = await sendStaffApprovalEmail(
        staff.email,
        staff.name || 'Staff Member',
        salonName,
        position
      );
      
      if (staffEmailResult.success) {
        console.log('✅ Staff approval email sent successfully!');
        console.log('Message ID:', staffEmailResult.messageId);
      } else {
        console.log('❌ Failed to send staff approval email:', staffEmailResult.error);
      }
    } catch (error) {
      console.log('❌ Exception while sending staff approval email:', error.message);
    }
    
    // Test sending notification to salon owner (using staff email for testing)
    console.log('\n--- Testing Salon Owner Notification Email ---');
    try {
      const ownerEmailResult = await sendStaffApprovalNotificationEmail(
        staff.email, // Using staff email for testing
        salonName,
        staff.name || 'Staff Member',
        position
      );
      
      if (ownerEmailResult.success) {
        console.log('✅ Salon owner notification email sent successfully!');
        console.log('Message ID:', ownerEmailResult.messageId);
      } else {
        console.log('❌ Failed to send salon owner notification email:', ownerEmailResult.error);
      }
    } catch (error) {
      console.log('❌ Exception while sending salon owner notification email:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testStaffApprovalEmails();