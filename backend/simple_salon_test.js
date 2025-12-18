import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import Salon from './models/Salon.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function simpleSalonTest() {
  console.log('🔍 Simple Salon Test...\n');
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Get all active salons with completed setup and approved status
    const salons = await Salon.find({ 
      isActive: true, 
      setupCompleted: true,
      approvalStatus: 'approved'
    })
    .select('salonName salonAddress contactNumber latitude longitude')
    .lean();
    
    console.log('📊 Total Salons Found:', salons.length);
    
    // Filter for Shravan and Amal specifically
    const targetSalons = salons.filter(salon => 
      salon.salonName === 'Shravan' || salon.salonName === 'Amal'
    );
    
    console.log('\n🎯 Target Salons:');
    targetSalons.forEach(salon => {
      console.log(`\n🏢 ${salon.salonName}:`);
      console.log(`   Latitude: ${salon.latitude}`);
      console.log(`   Longitude: ${salon.longitude}`);
      console.log(`   Salon Address:`, salon.salonAddress);
      console.log(`   Contact Number: ${salon.contactNumber}`);
    });
    
    // Test our coordinate extraction logic
    console.log('\n🔄 Testing Coordinate Extraction Logic:');
    targetSalons.forEach(salon => {
      console.log(`\n🏢 ${salon.salonName}:`);
      
      // Extract coordinates - first check dedicated fields, then salonAddress for backward compatibility
      let lat = null;
      let lng = null;
      
      // Check dedicated latitude/longitude fields first
      if (typeof salon.latitude === 'number' && !isNaN(salon.latitude) &&
          salon.latitude >= -90 && salon.latitude <= 90) {
        lat = salon.latitude;
      }
      
      if (typeof salon.longitude === 'number' && !isNaN(salon.longitude) &&
          salon.longitude >= -180 && salon.longitude <= 180) {
        lng = salon.longitude;
      }
      
      // If not found in dedicated fields, check salonAddress for backward compatibility
      if ((lat === null || lng === null) && 
          salon.salonAddress && typeof salon.salonAddress === 'object') {
        // Check for coordinates in various possible formats within salonAddress
        const addrLat = salon.salonAddress.latitude || salon.salonAddress.lat || null;
        const addrLng = salon.salonAddress.longitude || salon.salonAddress.lng || null;
        
        // Convert to numbers if they're strings
        let parsedLat = addrLat;
        let parsedLng = addrLng;
        
        if (typeof parsedLat === 'string') parsedLat = parseFloat(parsedLat);
        if (typeof parsedLng === 'string') parsedLng = parseFloat(parsedLng);
        
        // Validate that they are valid numbers and within ranges
        if (lat === null && 
            typeof parsedLat === 'number' && !isNaN(parsedLat) &&
            parsedLat >= -90 && parsedLat <= 90) {
          lat = parsedLat;
        }
        
        if (lng === null && 
            typeof parsedLng === 'number' && !isNaN(parsedLng) &&
            parsedLng >= -180 && parsedLng <= 180) {
          lng = parsedLng;
        }
      }
      
      console.log(`   Extracted Latitude: ${lat}`);
      console.log(`   Extracted Longitude: ${lng}`);
      
      if (lat && lng) {
        console.log(`   ✅ Has valid coordinates`);
      } else {
        console.log(`   ❌ Missing valid coordinates`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

simpleSalonTest();