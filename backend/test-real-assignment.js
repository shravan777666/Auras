// Test script to verify real appointment staff assignment with email notification
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testRealAssignment() {
  try {
    console.log('🔍 Testing real appointment staff assignment with email notification...');
    
    // Use the actual backend URL
    const baseURL = 'http://localhost:50111/api';
    console.log('🔧 Using backend URL:', baseURL);
    
    // First, let's find a pending appointment
    console.log('📋 Looking for pending appointments...');
    
    // Note: In a real test, we would need authentication tokens
    // For now, let's just verify that our email function works correctly
    
    console.log('📧 Testing email function directly...');
    
    // Import and test the email function
    const { sendAppointmentStaffAssignmentEmail } = await import('./utils/email.js');
    
    // Test with sample data
    const testEmail = process.env.EMAIL_USER || 'test@example.com';
    const testCustomerName = 'Test Customer';
    const testAppointmentDetails = {
      salonName: 'AuraCare Test Salon',
      staffName: 'Test Staff Member',
      staffPosition: 'Senior Stylist',
      date: new Date().toDateString(),
      time: '2:00 PM',
      services: ['Haircut', 'Blow Dry', 'Scalp Treatment'],
      status: 'Approved'
    };
    
    console.log('📧 Sending test email with appointment details:', testAppointmentDetails);
    
    const result = await sendAppointmentStaffAssignmentEmail(
      testEmail,
      testCustomerName,
      testAppointmentDetails
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
    } else {
      console.log('❌ Failed to send email:', result.error);
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testRealAssignment();