// Test script to verify environment variables
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('=== Environment Variables Test ===');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || '❌ Not set');
console.log('PORT:', process.env.PORT || '❌ Not set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ Not set');

if (process.env.GOOGLE_CALLBACK_URL) {
  console.log('✅ GOOGLE_CALLBACK_URL is properly configured');
} else {
  console.log('❌ GOOGLE_CALLBACK_URL is missing - this will cause OAuth issues');
}

console.log('=== Test Complete ===');