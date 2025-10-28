import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';
import Customer from './models/Customer.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDatabasePaths() {
  console.log('🔍 Checking Database Paths...\n');
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Check Staff
    console.log('👤 STAFF RECORDS:\n');
    const staff = await Staff.find({}).limit(10);
    staff.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name}`);
      console.log(`   Profile Picture: ${s.profilePicture || 'None'}`);
      console.log(`   Government ID: ${s.documents?.governmentId || 'None'}`);
      console.log('');
    });

    // Check Salons
    console.log('\n🏢 SALON RECORDS:\n');
    const salons = await Salon.find({}).limit(10);
    salons.forEach((s, i) => {
      console.log(`${i + 1}. ${s.salonName || 'Unnamed'}`);
      console.log(`   Logo: ${s.documents?.salonLogo || 'None'}`);
      console.log(`   Business License: ${s.documents?.businessLicense || 'None'}`);
      if (s.documents?.salonImages && s.documents.salonImages.length > 0) {
        console.log(`   Images: ${s.documents.salonImages.length} files`);
        s.documents.salonImages.forEach((img, idx) => {
          console.log(`      ${idx + 1}. ${img}`);
        });
      } else {
        console.log(`   Images: None`);
      }
      console.log('');
    });

    // Check Customers
    console.log('\n👥 CUSTOMER RECORDS:\n');
    const customers = await Customer.find({}).limit(10);
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name}`);
      console.log(`   Profile Picture: ${c.profilePicture || 'None'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabasePaths();
