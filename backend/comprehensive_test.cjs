// Comprehensive test to understand why the Pending Schedule Requests card is empty
const { MongoClient, ObjectId } = require('mongodb');

async function comprehensiveTest() {
  const uri = "mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare";
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to the database
    await client.connect();
    console.log("✅ Connected successfully to MongoDB");
    
    const db = client.db('auracare');
    
    console.log('\n=== Step 1: Check if user is a salon owner ===');
    const userId = '68cceb53faf3e420e3dae253'; // This is the Shravan user ID
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(userId)
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email}) - Type: ${user.type}`);
    console.log(`Setup completed: ${user.setupCompleted}`);
    
    console.log('\n=== Step 2: Check if salon exists and is approved ===');
    const salon = await db.collection('salons').findOne({ ownerId: new ObjectId(userId) });
    
    if (!salon) {
      console.log('❌ Salon not found by ownerId, trying email lookup...');
      const salonByEmail = await db.collection('salons').findOne({ email: user.email });
      if (salonByEmail) {
        console.log(`✅ Found salon by email: ${salonByEmail.salonName}`);
      } else {
        console.log('❌ Salon not found by email either');
        return;
      }
    } else {
      console.log(`✅ Found salon: ${salon.salonName} (${salon._id})`);
      console.log(`Approval status: ${salon.approvalStatus}`);
      console.log(`Setup completed: ${salon.setupCompleted}`);
      console.log(`Is verified: ${salon.isVerified}`);
    }
    
    console.log('\n=== Step 3: Check staff members in this salon ===');
    const staffMembers = await db.collection('staffs').find({ 
      assignedSalon: new ObjectId(salon._id.toString())
    }).toArray();
    
    console.log(`Found ${staffMembers.length} staff members:`);
    staffMembers.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.name} (${staff.email}) - ID: ${staff._id}`);
    });
    
    console.log('\n=== Step 4: Check pending schedule requests ===');
    // Method 1: Using salonId (new approach)
    const requestsBySalonId = await db.collection('schedulerequests').find({ 
      salonId: new ObjectId(salon._id.toString()),
      status: 'pending'
    }).toArray();
    
    console.log(`Found ${requestsBySalonId.length} requests using salonId approach:`);
    requestsBySalonId.forEach((req, index) => {
      console.log(`${index + 1}. Type: ${req.type}, Staff: ${req.staffId}, Created: ${req.createdAt}`);
    });
    
    // Method 2: Using staffId (fallback approach)
    if (staffMembers.length > 0) {
      const staffIds = staffMembers.map(staff => new ObjectId(staff._id.toString()));
      const requestsByStaffId = await db.collection('schedulerequests').find({ 
        staffId: { $in: staffIds },
        status: 'pending'
      }).toArray();
      
      console.log(`\nFound ${requestsByStaffId.length} requests using staffId approach:`);
      requestsByStaffId.forEach((req, index) => {
        console.log(`${index + 1}. Type: ${req.type}, Staff: ${req.staffId}, Created: ${req.createdAt}`);
      });
    }
    
    console.log('\n=== Step 5: Detailed request information ===');
    if (requestsBySalonId.length > 0) {
      const request = requestsBySalonId[0];
      console.log('First request details:');
      console.log('- ID:', request._id);
      console.log('- Type:', request.type);
      console.log('- Status:', request.status);
      console.log('- Staff ID:', request.staffId);
      console.log('- Salon ID:', request.salonId);
      console.log('- Created At:', request.createdAt);
      
      if (request.type === 'leave') {
        console.log('- Leave Details:', request.leave);
      }
    }
    
    console.log('\n=== Step 6: Verify staff details for the request ===');
    if (requestsBySalonId.length > 0) {
      const request = requestsBySalonId[0];
      const staff = await db.collection('staffs').findOne({ 
        _id: new ObjectId(request.staffId.toString())
      });
      
      if (staff) {
        console.log('Staff details:');
        console.log('- Name:', staff.name);
        console.log('- Position:', staff.position);
        console.log('- Assigned Salon:', staff.assignedSalon);
      } else {
        console.log('❌ Staff not found for this request');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

comprehensiveTest();