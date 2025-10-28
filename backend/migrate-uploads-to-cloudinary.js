import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import connectDB from './config/database.js';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';
import Customer from './models/Customer.js';

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
    console.error(`❌ Failed to upload ${localFilePath}:`, error.message);
    return null;
  }
}

// Migrate staff uploads
async function migrateStaffUploads() {
  console.log('\n📂 Migrating Staff Uploads...\n');
  
  const staffDir = path.join(__dirname, 'uploads', 'staff');
  
  if (!fs.existsSync(staffDir)) {
    console.log('⚠️ No staff uploads directory found');
    return;
  }

  // Get all staff records with local file paths
  const staffMembers = await Staff.find({
    $or: [
      { profilePicture: { $regex: '^uploads/' } },
      { 'documents.governmentId': { $regex: '^uploads/' } }
    ]
  });

  console.log(`Found ${staffMembers.length} staff members with local file paths`);

  let successCount = 0;
  let failCount = 0;

  for (const staff of staffMembers) {
    console.log(`\n👤 Processing: ${staff.name} (${staff._id})`);
    
    let updated = false;

    // Migrate profile picture
    if (staff.profilePicture && staff.profilePicture.startsWith('uploads/')) {
      const localPath = path.join(__dirname, staff.profilePicture);
      
      if (fs.existsSync(localPath)) {
        console.log(`  📸 Uploading profile picture...`);
        const cloudinaryUrl = await uploadToCloudinary(localPath, 'auracare/staff');
        
        if (cloudinaryUrl) {
          staff.profilePicture = cloudinaryUrl;
          updated = true;
          console.log(`  ✅ Profile picture uploaded: ${cloudinaryUrl}`);
        } else {
          failCount++;
          console.log(`  ❌ Failed to upload profile picture`);
        }
      } else {
        console.log(`  ⚠️ Profile picture file not found locally: ${localPath}`);
      }
    }

    // Migrate government ID
    if (staff.documents && staff.documents.governmentId && staff.documents.governmentId.startsWith('uploads/')) {
      const localPath = path.join(__dirname, staff.documents.governmentId);
      
      if (fs.existsSync(localPath)) {
        console.log(`  📄 Uploading government ID...`);
        const cloudinaryUrl = await uploadToCloudinary(localPath, 'auracare/staff');
        
        if (cloudinaryUrl) {
          staff.documents.governmentId = cloudinaryUrl;
          updated = true;
          console.log(`  ✅ Government ID uploaded: ${cloudinaryUrl}`);
        } else {
          failCount++;
          console.log(`  ❌ Failed to upload government ID`);
        }
      } else {
        console.log(`  ⚠️ Government ID file not found locally: ${localPath}`);
      }
    }

    // Save updated staff record
    if (updated) {
      await staff.save();
      successCount++;
      console.log(`  💾 Database updated successfully`);
    }
  }

  console.log(`\n✅ Staff Migration Complete: ${successCount} migrated, ${failCount} failed`);
}

// Migrate salon uploads
async function migrateSalonUploads() {
  console.log('\n🏢 Migrating Salon Uploads...\n');
  
  const salonDir = path.join(__dirname, 'uploads', 'salons');
  
  if (!fs.existsSync(salonDir)) {
    console.log('⚠️ No salon uploads directory found');
    return;
  }

  // Get all salon records with local file paths
  const salons = await Salon.find({
    $or: [
      { 'documents.businessLicense': { $regex: '^uploads/' } },
      { 'documents.salonLogo': { $regex: '^uploads/' } },
      { 'documents.salonImages': { $regex: '^uploads/' } }
    ]
  });

  console.log(`Found ${salons.length} salons with local file paths`);

  let successCount = 0;
  let failCount = 0;

  for (const salon of salons) {
    console.log(`\n🏢 Processing: ${salon.salonName} (${salon._id})`);
    
    let updated = false;

    if (!salon.documents) {
      continue;
    }

    // Migrate business license
    if (salon.documents.businessLicense && salon.documents.businessLicense.startsWith('uploads/')) {
      const localPath = path.join(__dirname, salon.documents.businessLicense);
      
      if (fs.existsSync(localPath)) {
        console.log(`  📄 Uploading business license...`);
        const cloudinaryUrl = await uploadToCloudinary(localPath, 'auracare/salons');
        
        if (cloudinaryUrl) {
          salon.documents.businessLicense = cloudinaryUrl;
          updated = true;
          console.log(`  ✅ Business license uploaded: ${cloudinaryUrl}`);
        } else {
          failCount++;
        }
      } else {
        console.log(`  ⚠️ Business license file not found: ${localPath}`);
      }
    }

    // Migrate salon logo
    if (salon.documents.salonLogo && salon.documents.salonLogo.startsWith('uploads/')) {
      const localPath = path.join(__dirname, salon.documents.salonLogo);
      
      if (fs.existsSync(localPath)) {
        console.log(`  🖼️ Uploading salon logo...`);
        const cloudinaryUrl = await uploadToCloudinary(localPath, 'auracare/salons');
        
        if (cloudinaryUrl) {
          salon.documents.salonLogo = cloudinaryUrl;
          updated = true;
          console.log(`  ✅ Salon logo uploaded: ${cloudinaryUrl}`);
        } else {
          failCount++;
        }
      } else {
        console.log(`  ⚠️ Salon logo file not found: ${localPath}`);
      }
    }

    // Migrate salon images
    if (salon.documents.salonImages && Array.isArray(salon.documents.salonImages)) {
      const newImages = [];
      
      for (const imagePath of salon.documents.salonImages) {
        if (imagePath.startsWith('uploads/')) {
          const localPath = path.join(__dirname, imagePath);
          
          if (fs.existsSync(localPath)) {
            console.log(`  🖼️ Uploading salon image...`);
            const cloudinaryUrl = await uploadToCloudinary(localPath, 'auracare/salons');
            
            if (cloudinaryUrl) {
              newImages.push(cloudinaryUrl);
              console.log(`  ✅ Salon image uploaded: ${cloudinaryUrl}`);
            } else {
              failCount++;
            }
          } else {
            console.log(`  ⚠️ Salon image file not found: ${localPath}`);
          }
        } else {
          newImages.push(imagePath); // Keep existing Cloudinary URLs
        }
      }
      
      if (newImages.length > 0) {
        salon.documents.salonImages = newImages;
        updated = true;
      }
    }

    // Save updated salon record
    if (updated) {
      await salon.save();
      successCount++;
      console.log(`  💾 Database updated successfully`);
    }
  }

  console.log(`\n✅ Salon Migration Complete: ${successCount} migrated, ${failCount} failed`);
}

// Migrate customer uploads
async function migrateCustomerUploads() {
  console.log('\n👥 Migrating Customer Uploads...\n');
  
  const customerDir = path.join(__dirname, 'uploads', 'customers');
  
  if (!fs.existsSync(customerDir)) {
    console.log('⚠️ No customer uploads directory found');
    return;
  }

  // Get all customer records with local file paths
  const customers = await Customer.find({
    profilePicture: { $regex: '^uploads/' }
  });

  console.log(`Found ${customers.length} customers with local file paths`);

  let successCount = 0;
  let failCount = 0;

  for (const customer of customers) {
    console.log(`\n👤 Processing: ${customer.name} (${customer._id})`);
    
    if (customer.profilePicture && customer.profilePicture.startsWith('uploads/')) {
      const localPath = path.join(__dirname, customer.profilePicture);
      
      if (fs.existsSync(localPath)) {
        console.log(`  📸 Uploading profile picture...`);
        const cloudinaryUrl = await uploadToCloudinary(localPath, 'auracare/customers');
        
        if (cloudinaryUrl) {
          customer.profilePicture = cloudinaryUrl;
          await customer.save();
          successCount++;
          console.log(`  ✅ Profile picture uploaded: ${cloudinaryUrl}`);
          console.log(`  💾 Database updated successfully`);
        } else {
          failCount++;
        }
      } else {
        console.log(`  ⚠️ Profile picture file not found: ${localPath}`);
      }
    }
  }

  console.log(`\n✅ Customer Migration Complete: ${successCount} migrated, ${failCount} failed`);
}

// Main migration function
async function migrateAllUploads() {
  console.log('🚀 Starting Cloudinary Migration...');
  console.log('================================================\n');
  
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Run migrations
    await migrateStaffUploads();
    await migrateSalonUploads();
    await migrateCustomerUploads();

    console.log('\n================================================');
    console.log('✅ Migration Complete!');
    console.log('================================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAllUploads();
