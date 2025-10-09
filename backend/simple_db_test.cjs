// Simple MongoDB test script
const { MongoClient } = require('mongodb');

async function testDatabaseConnection() {
  const uri = "mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare";
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to the database
    await client.connect();
    console.log("Connected successfully to MongoDB");
    
    const db = client.db('auracare');
    
    // Test 1: Find salon by ownerId
    const salonOwnerId = '68cceb53faf3e420e3dae253';
    console.log(`\n=== Testing salon lookup for owner ID: ${salonOwnerId} ===`);
    
    const salon = await db.collection('salons').findOne({ ownerId: salonOwnerId });
    if (salon) {
      console.log(`✅ Found salon: ${salon.salonName} (${salon._id})`);
      
      // Test 2: Find schedule requests for this salon
      console.log('\n=== Testing schedule requests for salon ===');
      
      // Method 1: Using salonId field
      const requestsBySalonId = await db.collection('schedulerequests').find({ 
        salonId: salon._id,
        status: 'pending'
      }).toArray();
      
      console.log(`Found ${requestsBySalonId.length} requests using salonId`);
      
      // Method 2: Using staff-based approach
      console.log('\n=== Testing staff-based approach ===');
      const staffMembers = await db.collection('staffs').find({ assignedSalon: salon._id }).toArray();
      console.log(`Found ${staffMembers.length} staff members in salon`);
      
      const staffIds = staffMembers.map(staff => staff._id);
      console.log('Staff IDs:', staffIds);
      
      if (staffIds.length > 0) {
        const requestsByStaffId = await db.collection('schedulerequests').find({ 
          staffId: { $in: staffIds },
          status: 'pending'
        }).toArray();
        
        console.log(`Found ${requestsByStaffId.length} requests using staffId`);
        console.log('Requests:', requestsByStaffId);
      }
    } else {
      console.log('❌ Salon not found by ownerId');
      
      // Try to find user and then salon by email
      const user = await db.collection('users').findOne({ _id: salonOwnerId });
      if (user && user.type === 'salon') {
        console.log(`Found user: ${user.name} (${user.email})`);
        const salonByEmail = await db.collection('salons').findOne({ email: user.email });
        if (salonByEmail) {
          console.log(`✅ Found salon by email: ${salonByEmail.salonName} (${salonByEmail._id})`);
        } else {
          console.log('❌ Salon not found by email');
        }
      } else {
        console.log('❌ User not found or not a salon');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

testDatabaseConnection();