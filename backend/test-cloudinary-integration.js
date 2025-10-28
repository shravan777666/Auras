import { cloudinary, customerUpload, staffUpload, salonUpload } from './config/cloudinary.js';
import fs from 'fs';
import path from 'path';

// Test Cloudinary integration
console.log('Testing Cloudinary integration...');

// Test 1: Cloudinary connection
cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connection successful!');
    console.log('Cloudinary Info:', result);
  })
  .catch(error => {
    console.error('❌ Cloudinary connection failed:', error.message);
  });

// Test 2: Upload configuration
console.log('Testing upload configuration...');
// Log multer upload configurations
console.log('Customer storage type:', customerUpload.constructor.name);
console.log('Staff storage type:', staffUpload.constructor.name);
console.log('Salon storage type:', salonUpload.constructor.name);

// Test 3: Test Cloudinary upload directly
const testDirectUpload = async () => {
  try {
    // Create a simple test image buffer
    const svgContent = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#4F46E5"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
          Test
        </text>
      </svg>
    `;
    
    const buffer = Buffer.from(svgContent, 'utf8');
    
    // Upload directly to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/svg+xml;base64,${buffer.toString('base64')}`,
      {
        folder: 'auracare/test',
        public_id: `test_image_${Date.now()}`,
        overwrite: true
      }
    );
    
    console.log('✅ Direct upload successful!');
    console.log('Upload result:', {
      url: result.secure_url,
      public_id: result.public_id
    });
    
    // Test deletion
    const deleteResult = await cloudinary.uploader.destroy(result.public_id);
    console.log('✅ Test image deletion successful!');
    console.log('Delete result:', deleteResult);
  } catch (error) {
    console.error('❌ Direct upload test failed:', error.message);
  }
};

// Run tests
setTimeout(() => {
  testDirectUpload();
}, 1000);