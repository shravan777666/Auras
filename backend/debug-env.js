// debug-env.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 DEBUGGING ENVIRONMENT VARIABLES');
console.log('===================================');

// Check current directory
console.log('Current directory:', __dirname);

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
console.log('Looking for .env at:', envPath);

if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists at:', envPath);
  
  // Read and display .env content (mask secrets)
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n📄 .env file content:');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        const displayValue = key.includes('SECRET') || key.includes('PASSWORD') 
          ? '***' + value.slice(-4) 
          : value;
        console.log(`   ${key.trim()}: ${displayValue}`);
      }
    }
  });
} else {
  console.log('❌ .env file NOT found at:', envPath);
  console.log('Files in current directory:');
  fs.readdirSync(__dirname).forEach(file => {
    console.log('   -', file);
  });
}

console.log('\n🔧 LOADING ENVIRONMENT VARIABLES...');
dotenv.config({ path: envPath });

console.log('\n📋 LOADED ENVIRONMENT VARIABLES:');
console.log('PORT:', process.env.PORT || 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || '❌ Not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');

console.log('\n===================================');