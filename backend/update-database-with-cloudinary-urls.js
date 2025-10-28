import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import connectDB from './config/database.js';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';
import Customer from './models/Customer.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Load the mapping file
const mappingFile = path.join(__dirname, 'cloudinary-urls-mapping.json');
const urlMappings = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));

// Create lookup maps for quick access
const staffProfilePictures = {};
const staffGovernmentIds = {};
const salonLogos = {};
const salonImages = [];
const businessLicenses = {};
const customerProfilePictures = {};

// Organize mappings by type
urlMappings.forEach(mapping => {
  const filename = path.basename(mapping.localPath);
  
  if (filename.startsWith('profilePicture-') && mapping.folder.includes('staff')) {
    // Extract timestamp from filename
    const timestamp = filename.match(/profilePicture-(\d+)/)?.[1];
    if (timestamp) {
      staffProfilePictures[timestamp] = mapping.cloudinaryUrl;
    }
  } else if (filename.startsWith('governmentId-')) {
    const timestamp = filename.match(/governmentId-(\d+)/)?.[1];
    if (timestamp) {
      staffGovernmentIds[timestamp] = mapping.cloudinaryUrl;
    }
  } else if (filename.startsWith('salonLogo-')) {
    const timestamp = filename.match(/salonLogo-(\d+)/)?.[1];
    if (timestamp) {
      salonLogos[timestamp] = mapping.cloudinaryUrl;
    }
  } else if (filename.startsWith('salonImages-')) {
    salonImages.push({
      filename,
      timestamp: filename.match(/salonImages-(\d+)/)?.[1],
      url: mapping.cloudinaryUrl
    });
  } else if (filename.startsWith('businessLicense-')) {
    const timestamp = filename.match(/businessLicense-(\d+)/)?.[1];
    if (timestamp) {
      businessLicenses[timestamp] = mapping.cloudinaryUrl;
    }
  } else if (filename.startsWith('profilePicture-') && mapping.folder.includes('customer')) {
    const customerId = filename.match(/profilePicture-([a-f0-9]+)-/)?.[1];
    if (customerId) {
      customerProfilePictures[customerId] = mapping.cloudinaryUrl;
    }
  }
});

// Update staff records
async function updateStaffRecords() {
  console.log('\n👤 Updating Staff Records...\n');
  
  const allStaff = await Staff.find({});
  console.log(`Found ${allStaff.length} staff members in database`);
  
  let updatedCount = 0;
  
  for (const staff of allStaff) {
    let updated = false;
    
    // Check profile picture (handle both / and \ in paths)
    if (staff.profilePicture && (staff.profilePicture.startsWith('uploads/') || staff.profilePicture.startsWith('uploads\\'))) {
      // Try to match by timestamp in filename
      const match = staff.profilePicture.match(/profilePicture-(\d+)/);
      if (match && staffProfilePictures[match[1]]) {
        console.log(`  📸 Updating profile picture for: ${staff.name}`);
        console.log(`     Old: ${staff.profilePicture}`);
        console.log(`     New: ${staffProfilePictures[match[1]]}`);
        staff.profilePicture = staffProfilePictures[match[1]];
        updated = true;
      }
    }
    
    // Check government ID (handle both / and \ in paths)
    if (staff.documents?.governmentId && (staff.documents.governmentId.startsWith('uploads/') || staff.documents.governmentId.startsWith('uploads\\'))) {
      const match = staff.documents.governmentId.match(/governmentId-(\d+)/);
      if (match && staffGovernmentIds[match[1]]) {
        console.log(`  📄 Updating government ID for: ${staff.name}`);
        console.log(`     Old: ${staff.documents.governmentId}`);
        console.log(`     New: ${staffGovernmentIds[match[1]]}`);
        staff.documents.governmentId = staffGovernmentIds[match[1]];
        updated = true;
      }
    }
    
    if (updated) {
      await staff.save();
      updatedCount++;
      console.log(`  ✅ ${staff.name} updated\n`);
    }
  }
  
  console.log(`✅ Staff Update Complete: ${updatedCount} records updated\n`);
}

// Update salon records
async function updateSalonRecords() {
  console.log('\n🏢 Updating Salon Records...\n');
  
  const allSalons = await Salon.find({});
  console.log(`Found ${allSalons.length} salons in database`);
  
  let updatedCount = 0;
  
  for (const salon of allSalons) {
    let updated = false;
    
    if (!salon.documents) {
      continue;
    }
    
    // Check salon logo (handle both / and \ in paths)
    if (salon.documents.salonLogo && (salon.documents.salonLogo.startsWith('uploads/') || salon.documents.salonLogo.startsWith('uploads\\'))) {
      const match = salon.documents.salonLogo.match(/salonLogo-(\d+)/);
      if (match && salonLogos[match[1]]) {
        console.log(`  🖼️ Updating salon logo for: ${salon.salonName}`);
        console.log(`     Old: ${salon.documents.salonLogo}`);
        console.log(`     New: ${salonLogos[match[1]]}`);
        salon.documents.salonLogo = salonLogos[match[1]];
        updated = true;
      }
    }
    
    // Check business license (handle both / and \ in paths)
    if (salon.documents.businessLicense && (salon.documents.businessLicense.startsWith('uploads/') || salon.documents.businessLicense.startsWith('uploads\\'))) {
      const match = salon.documents.businessLicense.match(/businessLicense-(\d+)/);
      if (match && businessLicenses[match[1]]) {
        console.log(`  📄 Updating business license for: ${salon.salonName}`);
        console.log(`     Old: ${salon.documents.businessLicense}`);
        console.log(`     New: ${businessLicenses[match[1]]}`);
        salon.documents.businessLicense = businessLicenses[match[1]];
        updated = true;
      }
    }
    
    // Check salon images (handle both / and \ in paths)
    if (salon.documents.salonImages && Array.isArray(salon.documents.salonImages)) {
      const newImages = [];
      let imagesUpdated = false;
      
      for (const imagePath of salon.documents.salonImages) {
        if (imagePath.startsWith('uploads/') || imagePath.startsWith('uploads\\')) {
          const match = imagePath.match(/salonImages-(\d+)/);
          if (match) {
            const matchingImage = salonImages.find(img => img.timestamp === match[1]);
            if (matchingImage) {
              console.log(`  🖼️ Updating salon image for: ${salon.salonName}`);
              console.log(`     Old: ${imagePath}`);
              console.log(`     New: ${matchingImage.url}`);
              newImages.push(matchingImage.url);
              imagesUpdated = true;
            } else {
              newImages.push(imagePath);
            }
          } else {
            newImages.push(imagePath);
          }
        } else {
          newImages.push(imagePath);
        }
      }
      
      if (imagesUpdated) {
        salon.documents.salonImages = newImages;
        updated = true;
      }
    }
    
    if (updated) {
      await salon.save();
      updatedCount++;
      console.log(`  ✅ ${salon.salonName} updated\n`);
    }
  }
  
  console.log(`✅ Salon Update Complete: ${updatedCount} records updated\n`);
}

// Update customer records
async function updateCustomerRecords() {
  console.log('\n👥 Updating Customer Records...\n');
  
  const allCustomers = await Customer.find({});
  console.log(`Found ${allCustomers.length} customers in database`);
  
  let updatedCount = 0;
  
  for (const customer of allCustomers) {
    if (customer.profilePicture && customer.profilePicture.startsWith('uploads/')) {
      const customerId = customer._id.toString();
      if (customerProfilePictures[customerId]) {
        console.log(`  📸 Updating profile picture for: ${customer.name}`);
        console.log(`     Old: ${customer.profilePicture}`);
        console.log(`     New: ${customerProfilePictures[customerId]}`);
        customer.profilePicture = customerProfilePictures[customerId];
        await customer.save();
        updatedCount++;
        console.log(`  ✅ ${customer.name} updated\n`);
      }
    }
  }
  
  console.log(`✅ Customer Update Complete: ${updatedCount} records updated\n`);
}

// Main update function
async function updateAllRecords() {
  console.log('🚀 Starting Database Update with Cloudinary URLs...');
  console.log('================================================\n');
  
  console.log(`📋 Loaded ${urlMappings.length} URL mappings`);
  console.log(`   Staff Profile Pictures: ${Object.keys(staffProfilePictures).length}`);
  console.log(`   Staff Government IDs: ${Object.keys(staffGovernmentIds).length}`);
  console.log(`   Salon Logos: ${Object.keys(salonLogos).length}`);
  console.log(`   Salon Images: ${salonImages.length}`);
  console.log(`   Business Licenses: ${Object.keys(businessLicenses).length}`);
  console.log(`   Customer Profile Pictures: ${Object.keys(customerProfilePictures).length}`);
  
  try {
    // Connect to database
    await connectDB();
    console.log('\n✅ Connected to MongoDB\n');

    // Run updates
    await updateStaffRecords();
    await updateSalonRecords();
    await updateCustomerRecords();

    console.log('\n================================================');
    console.log('✅ Database Update Complete!');
    console.log('================================================');
    console.log('\n🎉 All local file paths have been replaced with Cloudinary URLs!');
    console.log('🌐 Your images should now appear on the hosted website.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

// Run update
updateAllRecords();
