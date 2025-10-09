// Simple MongoDB test script to check schedule requests
const { MongoClient, ObjectId } = require('mongodb');

async function checkScheduleRequests() {
  const uri = "mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare";
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to the database
    await client.connect();
    console.log("Connected successfully to MongoDB");
    
    const db = client.db('auracare');
    
    // Get the salon and its staff
    const salonId = new ObjectId('68cceb54faf3e420e3dae255');
    console.log(`\n=== Checking salon with ID: ${salonId} ===`);
    
    const salon = await db.collection('salons').findOne({ _id: salonId });
    if (!salon) {
      console.log('Salon not found');
      return;
    }
    
    console.log(`Found salon: ${salon.salonName}`);
    console.log(`Staff IDs: ${salon.staff}`);
    
    // Check schedule requests for this salon
    console.log('\n=== Checking schedule requests ===');
    
    // Method 1: Using salonId field
    const requestsBySalonId = await db.collection('schedulerequests').find({ 
      salonId: salonId,
      status: 'pending'
    }).toArray();
    
    console.log(`Found ${requestsBySalonId.length} requests using salonId`);
    requestsBySalonId.forEach((req, index) => {
      console.log(`${index + 1}. ${req.type} - Staff: ${req.staffId} - Created: ${req.createdAt}`);
    });
    
    // Method 2: Using staff-based approach
    console.log('\n=== Checking requests by staff ID ===');
    if (salon.staff && salon.staff.length > 0) {
      // Convert staff IDs to ObjectIds
      const staffObjectIds = salon.staff.map(id => new ObjectId(id));
      
      const requestsByStaffId = await db.collection('schedulerequests').find({ 
        staffId: { $in: staffObjectIds },
        status: 'pending'
      }).toArray();
      
      console.log(`Found ${requestsByStaffId.length} requests using staffId`);
      requestsByStaffId.forEach((req, index) => {
        console.log(`${index + 1}. ${req.type} - Staff: ${req.staffId} - Created: ${req.createdAt}`);
      });
      
      // Let's also check all requests to see what we have
      console.log('\n=== All requests (regardless of status) ===');
      const allRequests = await db.collection('schedulerequests').find({ 
        staffId: { $in: staffObjectIds }
      }).toArray();
      
      console.log(`Found ${allRequests.length} total requests for salon staff`);
      allRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.type} - Status: ${req.status} - Staff: ${req.staffId} - Salon: ${req.salonId} - Created: ${req.createdAt}`);
      });
    } else {
      console.log('No staff found in salon');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

checkScheduleRequests();