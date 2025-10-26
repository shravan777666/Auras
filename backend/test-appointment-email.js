import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendAppointmentConfirmation } from './utils/email.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function testAppointmentEmail() {
  try {
    console.log('Testing appointment confirmation email...');
    
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration not found. Please set EMAIL_USER and EMAIL_PASS in your .env file.');
      return;
    }
    
    console.log('Sending appointment confirmation email to test@example.com...');
    const result = await sendAppointmentConfirmation(
      'test@example.com',
      'John Doe',
      {
        salonName: 'Test Salon',
        date: '2024-01-15',
        time: '14:30',
        services: ['Hair Cut', 'Beard Trim'],
        totalAmount: 1500,
        pointsRedeemed: 100,
        discountFromPoints: 100
      }
    );
    
    console.log('Appointment confirmation email result:', result);
    
  } catch (error) {
    console.error('Error testing appointment confirmation email:', error);
  }
}

testAppointmentEmail();