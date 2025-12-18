import { salonUpload } from './config/cloudinary.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple Express-like mock request object
const mockReq = {
  user: { id: 'test-user-id' },
  body: {},
  files: {}
};

// Create a simple Express-like mock response object
const mockRes = {
  status: function(code) {
    console.log(`HTTP Status: ${code}`);
    return this;
  },
  json: function(data) {
    console.log('Response Data:', JSON.stringify(data, null, 2));
    return this;
  }
};

// Create a simple mock next function
const mockNext = function() {
  console.log('Next function called');
};

// Test the salonUpload middleware
console.log('Testing salonUpload middleware for PDF files...');

// Create a test PDF file buffer
const pdfBuffer = Buffer.from('%PDF-1.4\n%äüöß\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Resources << >>\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000015 00000 n \n0000000060 00000 n \n0000000111 00000 n \n0000000231 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n327\n%%EOF', 'binary');

// Create a mock file object
const mockFile = {
  fieldname: 'businessLicense',
  originalname: 'test-business-license.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  buffer: pdfBuffer,
  size: pdfBuffer.length
};

console.log('Mock file created:', {
  fieldname: mockFile.fieldname,
  originalname: mockFile.originalname,
  mimetype: mockFile.mimetype,
  size: mockFile.size
});

// Test the middleware
const uploadMiddleware = salonUpload.fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'salonLogo', maxCount: 1 },
  { name: 'salonImages', maxCount: 5 }
]);

console.log('Calling upload middleware...');

// Wrap in async to handle promises
(async () => {
  try {
    // Simulate the middleware call
    uploadMiddleware(mockReq, mockRes, mockNext);
    console.log('Upload middleware called successfully');
  } catch (error) {
    console.error('Error calling upload middleware:', error);
  }
})();