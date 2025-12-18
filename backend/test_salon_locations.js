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

// Import the getSalonLocationsPublic function directly
import { getSalonLocationsPublic } from './controllers/salonController.js';

// Mock Express request and response objects
const mockReq = {
  query: {}
};

const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    this.data = data;
    return this;
  }
};

async function testSalonLocations() {
  console.log('🔍 Testing Salon Locations API...\n');
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Call the function directly
    try {
      await getSalonLocationsPublic(mockReq, mockRes);
      
      if (mockRes.data && mockRes.data.success) {
        console.log('✅ API Response Success:', mockRes.data.message);
        console.log('📊 Total Salons Found:', mockRes.data.data.length);
        
        // Filter for Shravan and Amal specifically
        const targetSalons = mockRes.data.data.filter(salon => 
          salon.name === 'Shravan' || salon.name === 'Amal'
        );
        
        console.log('\n🎯 Target Salons:');
        targetSalons.forEach(salon => {
          console.log(`\n🏢 ${salon.name}:`);
          console.log(`   Latitude: ${salon.lat}`);
          console.log(`   Longitude: ${salon.lng}`);
          console.log(`   Address: ${salon.address}`);
          console.log(`   Phone: ${salon.phone}`);
          
          if (salon.lat && salon.lng) {
            console.log(`   ✅ Has valid coordinates`);
          } else {
            console.log(`   ❌ Missing valid coordinates`);
          }
        });
      } else {
        console.log('❌ API Error:', mockRes.data ? mockRes.data.message : 'Unknown error');
        console.log('Response data:', mockRes.data);
      }
    } catch (apiError) {
      console.log('❌ API Function Error:', apiError.message);
      console.log('Stack trace:', apiError.stack);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Database Connection Error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testSalonLocations();