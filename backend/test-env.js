import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Current directory:', __dirname);

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
console.log('🔍 Looking for .env file at:', envPath);
console.log('📁 .env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 .env file size:', envContent.length, 'bytes');
    console.log('📄 .env file first 200 characters:');
    console.log(envContent.substring(0, 200));
    
    // Check for specific variables
    const lines = envContent.split('\n');
    console.log('\n🔍 Checking for specific variables:');
    
    const varsToCheck = ['PORT', 'MONGODB_URI', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
    varsToCheck.forEach(varName => {
      const found = lines.find(line => line.trim().startsWith(varName + '='));
      if (found) {
        console.log(`✅ ${varName}: Found (${found.substring(0, varName.length + 10)}...)`);
      } else {
        console.log(`❌ ${varName}: Not found`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error reading .env file:', error);
  }
}

// Try loading with dotenv
console.log('\n🔧 Loading with dotenv...');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Dotenv error:', result.error);
} else {
  console.log('✅ Dotenv loaded successfully');
}

// Check environment variables
console.log('\n🔧 Environment Variables After Loading:');
console.log('PORT:', process.env.PORT || 'Not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
