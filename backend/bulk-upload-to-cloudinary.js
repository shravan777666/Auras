import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzbjcacnn',
  api_key: process.env.CLOUDINARY_API_KEY || '876578995275917',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'X5ELAMbkjO6-VOEMcAgc_0CNsfw',
});

// Upload file to Cloudinary
async function uploadToCloudinary(localFilePath, folder) {
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: 'auto'
    });
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Failed to upload ${path.basename(localFilePath)}:`, error.message);
    return null;
  }
}

// Get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Determine Cloudinary folder based on file path
function getCloudinaryFolder(filePath) {
  if (filePath.includes('staff')) return 'auracare/staff';
  if (filePath.includes('salon') || filePath.includes('licenses') || filePath.includes('images')) return 'auracare/salons';
  if (filePath.includes('customers')) return 'auracare/customers';
  return 'auracare/misc';
}

// Main upload function
async function bulkUploadToCloudinary() {
  console.log('🚀 Starting Bulk Upload to Cloudinary...');
  console.log('================================================\n');

  const uploadsDir = path.join(__dirname, 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    console.error('❌ Uploads directory not found!');
    process.exit(1);
  }

  // Get all files
  const allFiles = getAllFiles(uploadsDir);
  console.log(`📂 Found ${allFiles.length} files to upload\n`);

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  const uploadedUrls = [];

  for (const filePath of allFiles) {
    const relativePath = path.relative(__dirname, filePath);
    const fileName = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;

    // Skip very small files (likely test files)
    if (fileSize < 50 && fileName.includes('test')) {
      console.log(`⏭️ Skipping test file: ${fileName}`);
      skippedCount++;
      continue;
    }

    // Determine folder
    const folder = getCloudinaryFolder(filePath);
    
    console.log(`📤 Uploading: ${relativePath} (${fileSize} bytes)`);
    console.log(`   Target folder: ${folder}`);

    const cloudinaryUrl = await uploadToCloudinary(filePath, folder);

    if (cloudinaryUrl) {
      successCount++;
      uploadedUrls.push({
        localPath: relativePath,
        cloudinaryUrl: cloudinaryUrl,
        folder: folder
      });
      console.log(`   ✅ Success: ${cloudinaryUrl}\n`);
    } else {
      failCount++;
      console.log(`   ❌ Failed\n`);
    }
  }

  console.log('\n================================================');
  console.log('📊 Upload Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   ⏭️ Skipped: ${skippedCount}`);
  console.log(`   📦 Total: ${allFiles.length}`);
  console.log('================================================\n');

  // Save mapping to file
  const mappingFile = path.join(__dirname, 'cloudinary-urls-mapping.json');
  fs.writeFileSync(mappingFile, JSON.stringify(uploadedUrls, null, 2));
  console.log(`💾 URL mapping saved to: ${mappingFile}\n`);

  // Display uploaded URLs by category
  console.log('🔗 Uploaded URLs by Category:\n');
  
  const staffUrls = uploadedUrls.filter(u => u.folder.includes('staff'));
  const salonUrls = uploadedUrls.filter(u => u.folder.includes('salons'));
  const customerUrls = uploadedUrls.filter(u => u.folder.includes('customers'));

  if (staffUrls.length > 0) {
    console.log(`\n👤 STAFF (${staffUrls.length} files):`);
    staffUrls.forEach(u => {
      console.log(`   ${path.basename(u.localPath)}`);
      console.log(`   → ${u.cloudinaryUrl}\n`);
    });
  }

  if (salonUrls.length > 0) {
    console.log(`\n🏢 SALONS (${salonUrls.length} files):`);
    salonUrls.forEach(u => {
      console.log(`   ${path.basename(u.localPath)}`);
      console.log(`   → ${u.cloudinaryUrl}\n`);
    });
  }

  if (customerUrls.length > 0) {
    console.log(`\n👥 CUSTOMERS (${customerUrls.length} files):`);
    customerUrls.forEach(u => {
      console.log(`   ${path.basename(u.localPath)}`);
      console.log(`   → ${u.cloudinaryUrl}\n`);
    });
  }

  console.log('\n✅ All uploads complete!');
  console.log('Next step: Update your database records with these new Cloudinary URLs\n');
}

// Run bulk upload
bulkUploadToCloudinary()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
