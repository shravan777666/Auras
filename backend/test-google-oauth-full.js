import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import passport from './config/passport.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Google OAuth Full Test');
console.log('======================');

// Check environment variables
console.log('Environment Variables:');
console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('- GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('- GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'Using default');
console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? 'SET' : 'NOT SET');

// Check if Google strategy is registered
console.log('\nPassport Strategies:');
const strategies = passport._strategies || {};
console.log('- Available strategies:', Object.keys(strategies));

if (strategies.google) {
  console.log('✅ Google OAuth strategy is registered');
} else {
  console.log('❌ Google OAuth strategy is NOT registered');
}

// Test URL construction
console.log('\nURL Construction:');
const backendUrl = 'http://localhost:5011';
const authUrl = `${backendUrl}/api/auth/google?role=customer`;
const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${backendUrl}/api/auth/google/callback`;

console.log('- Authorization URL:', authUrl);
console.log('- Callback URL:', callbackUrl);

console.log('\nExpected Google OAuth URLs:');
console.log('- Auth endpoint: /api/auth/google');
console.log('- Callback endpoint: /api/auth/google/callback');
console.log('- Failure endpoint: /api/auth/google/failure');