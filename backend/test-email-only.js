// Simple test to verify email functionality without database dependencies
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import email utility
import { sendAppointmentStaffAssignmentEmail } from './utils/email.js';

async function testEmailOnly() {
  try {
    console.log('🔍 Testing email functionality only...');
    
    // Check if email configuration is available
    console.log('📧 Email configuration check:');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');
    console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || 'Using default');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Email configuration is incomplete. Please check .env file.');
      return;
    }
    
    // Test email data
    const testEmail = process.env.EMAIL_USER; // Send to the same email for testing
    const testCustomerName = 'Test Customer';
    const testAppointmentDetails = {
      salonName: 'Test Salon',
      staffName: 'Test Staff Member',
      staffPosition: 'Senior Stylist',
      date: new Date().toDateString(),
      time: '10:00 AM',
      services: ['Haircut', 'Blow Dry'],
      status: 'Approved'
    };
    
    console.log('📧 Sending test email to:', testEmail);
    console.log('📋 Appointment details:', testAppointmentDetails);
    
    // Send the email
    const result = await sendAppointmentStaffAssignmentEmail(
      testEmail,
      testCustomerName,
      testAppointmentDetails
    );
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
    } else {
      console.log('❌ Failed to send test email:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testEmailOnly();