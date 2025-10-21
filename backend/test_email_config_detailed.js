import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function testEmailConfiguration() {
  console.log('=== Email Configuration Test ===');
  
  // Check environment variables
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET (using default)');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email configuration is incomplete. Please set EMAIL_USER and EMAIL_PASS in your .env file.');
    return;
  }
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  try {
    // Verify transporter configuration
    console.log('Verifying email transporter...');
    await transporter.verify();
    console.log('✅ Email transporter verified successfully!');
    
    // Test sending a simple email
    console.log('Sending test email...');
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: 'AuraCare Email Configuration Test',
      text: 'This is a test email to verify that the email configuration is working correctly.'
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Email configuration test failed:', error.message);
    
    // Provide specific error guidance
    if (error.code === 'EAUTH') {
      console.log('🔐 Authentication failed. Check your EMAIL_USER and EMAIL_PASS values.');
      console.log('   Note: For Gmail, you may need to use an App Password instead of your regular password.');
    } else if (error.code === 'ECONNECTION') {
      console.log('🌐 Connection failed. Check your internet connection and firewall settings.');
    } else if (error.code === 'EDNS') {
      console.log('🌐 DNS resolution failed. Check your network settings.');
    } else {
      console.log('❓ Unexpected error. Please check the error message above.');
    }
  }
}

testEmailConfiguration();