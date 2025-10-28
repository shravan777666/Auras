import { cloudinary } from './config/cloudinary.js';

// Test Cloudinary configuration
console.log('Testing Cloudinary configuration...');

// Test Cloudinary connection
cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connection successful!');
    console.log('Cloudinary Info:', result);
  })
  .catch(error => {
    console.error('❌ Cloudinary connection failed:', error.message);
  });

// Test image upload
const testUpload = async () => {
  try {
    const result = await cloudinary.uploader.upload(
      'https://via.placeholder.com/150',
      {
        folder: 'auracare/test',
        public_id: 'test_image_' + Date.now(),
        overwrite: true
      }
    );
    console.log('✅ Test image upload successful!');
    console.log('Upload result:', result);
    
    // Test image deletion
    const deleteResult = await cloudinary.uploader.destroy(result.public_id);
    console.log('✅ Test image deletion successful!');
    console.log('Delete result:', deleteResult);
  } catch (error) {
    console.error('❌ Test upload failed:', error.message);
  }
};

// Run test
testUpload();