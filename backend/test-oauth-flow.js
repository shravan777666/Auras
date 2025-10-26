import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('OAuth Flow Test');
console.log('===============');

// Environment Variables
console.log('Environment Configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
console.log('- GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'Not set');

// URLs
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3008';
const backendUrl = 'http://localhost:5011';
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || `${backendUrl}/api/auth/google/callback`;

console.log('\nURL Configuration:');
console.log('- Frontend URL:', frontendUrl);
console.log('- Backend URL:', backendUrl);
console.log('- Google Callback URL:', googleCallbackUrl);

// Expected OAuth Flow URLs
console.log('\nExpected OAuth Flow:');
console.log('1. Frontend initiates OAuth: GET /api/auth/google?role=customer');
console.log('2. Backend redirects to Google OAuth');
console.log('3. Google redirects to callback: GET /api/auth/google/callback');
console.log('4. Backend redirects to frontend: GET /auth/callback?token=...&user=...');
console.log('5. Frontend processes token and redirects to dashboard');

// Production vs Development Check
if (process.env.NODE_ENV === 'production') {
  console.log('\n⚠️  Production Environment Check:');
  console.log('  Make sure the following URLs are configured in Google Cloud Console:');
  console.log('  - Authorized JavaScript origins:', frontendUrl);
  console.log('  - Authorized redirect URIs:', googleCallbackUrl);
  console.log('  - Frontend URL matches your hosted domain');
} else {
  console.log('\n🔧 Development Environment Check:');
  console.log('  Using default development URLs');
}

console.log('\n✅ OAuth Flow Test Complete');