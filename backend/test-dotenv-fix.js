// test-dotenv-fix.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 TESTING DOTENV AFTER REINSTALL');
console.log('=================================');

const envPath = path.join(__dirname, '.env');
console.log('Loading from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.log('❌ Dotenv error:', result.error);
} else {
  console.log('✅ Dotenv loaded successfully');
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || 'Not set');
  console.log('PORT:', process.env.PORT || 'Not set');
}