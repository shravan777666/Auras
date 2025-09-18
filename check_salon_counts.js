// Quick script to check salon counts in the database
// This will help verify that our fix is working correctly

import mongoose from 'mongoose';
import Salon from './models/Salon.js';

// Connect to MongoDB (using the same connection string as the app)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auracare';

async function checkSalonCounts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Count all salons
    const totalSalons = await Salon.countDocuments({});
    console.log('🏢 Total salons in database:', totalSalons);
    
    // Count active salons (what we now show in dashboard)
    const activeSalons = await Salon.countDocuments({ isActive: true });
    console.log('✅ Active salons (isActive: true):', activeSalons);
    
    // Count approved salons (what we used to show)
    const approvedSalons = await Salon.countDocuments({ 
      isActive: true, 
      approvalStatus: 'approved' 
    });
    console.log('🏆 Approved salons (old count):', approvedSalons);
    
    // Count pending salons
    const pendingSalons = await Salon.countDocuments({ 
      isActive: true, 
      $or: [
        { approvalStatus: 'pending' },
        { approvalStatus: { $exists: false } },
        { approvalStatus: null }
      ]
    });
    console.log('⏳ Pending salons:', pendingSalons);
    
    // Show sample salon data
    const sampleSalons = await Salon.find({ isActive: true })
      .select('salonName email approvalStatus isActive')
      .limit(5)
      .lean();
    
    console.log('\n📋 Sample salon data:');
    sampleSalons.forEach((salon, index) => {
      console.log(`${index + 1}. ${salon.salonName} (${salon.email}) - Status: ${salon.approvalStatus || 'pending'}`);
    });
    
    console.log('\n🎯 VERIFICATION:');
    console.log(`Dashboard will now show: ${activeSalons} salons (ALL registered salons)`);
    console.log(`Previously showed: ${approvedSalons} salons (only approved salons)`);
    console.log(`Difference: +${activeSalons - approvedSalons} salons now included`);
    
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSalonCounts();