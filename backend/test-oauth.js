// Quick test script to verify Google OAuth configuration
import dotenv from 'dotenv';
import passport from './config/passport.js';

dotenv.config();

console.log('=== Google OAuth Configuration Test ===\n');

console.log('Environment Variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'Using default');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Using default');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Set' : '❌ Not set');

console.log('\nServer Configuration:');
console.log('Backend Port:', process.env.PORT || '5006');
console.log('Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:3002');

console.log('\nGoogle OAuth URLs:');
console.log('Auth Initiate:', `http://localhost:${process.env.PORT || '5006'}/auth/google?role=customer`);
console.log('Callback URL:', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5006/auth/google/callback');

console.log('\nNext Steps:');
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.log('❌ Missing Google OAuth credentials');
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Create OAuth 2.0 Client ID');
  console.log('3. Add redirect URI: http://localhost:5006/auth/google/callback');
  console.log('4. Update your .env file with the credentials');
} else {
  console.log('✅ Google OAuth credentials configured');
  console.log('✅ Ready to test OAuth flow');
}

console.log('\n=== Test Complete ===');
