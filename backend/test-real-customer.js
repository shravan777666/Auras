import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the current directory (backend)
dotenv.config({ path: path.join(__dirname, '.env') });

async function testForgotPasswordRequest() {
  try {
    console.log('Testing forgot password request with existing customer...');
    const response = await axios.post('http://localhost:5010/api/forgot-password/request-reset', {
      email: 'rono@gmail.com',
      userType: 'customer'
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testForgotPasswordRequest();