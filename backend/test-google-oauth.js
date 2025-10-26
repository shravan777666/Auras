import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Google OAuth Configuration Test');
console.log('================================');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'Using default');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'SET' : 'NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Using default');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Check if required environment variables are set
const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('\n❌ Missing required environment variables:');
  missingVars.forEach(varName => console.log(`  - ${varName}`));
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set');
}

console.log('\nOAuth URLs:');
console.log('Authorization URL:', `https://accounts.google.com/o/oauth2/auth`);
console.log('Callback URL:', process.env.GOOGLE_CALLBACK_URL || `http://localhost:5011/api/auth/google/callback`);