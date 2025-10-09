// Test the actual backend API endpoint
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

async function testBackendAPI() {
  const uri = "mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare";
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to the database
    await client.connect();
    console.log("Connected successfully to MongoDB");
    
    const db = client.db('auracare');
    
    // Get the salon owner user
    const userId = '68cceb53faf3e420e3dae253';
    console.log(`\n=== Testing with user ID: ${userId} ===`);
    
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(userId)
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email}) - Type: ${user.type}`);
    
    // Create a JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(),
        email: user.email,
        type: user.type
      },
      '86ed8b0db49bca766733daa44efefd552f6282642483b72ef2ee389ea057a754e4839c1a0ebdc0b0e9fd397d8eb20bdfa2293d975002cb10a89256fa1c8b4d95',
      { expiresIn: '7d' }
    );
    
    console.log(`Generated token: ${token.substring(0, 20)}...`);
    
    // Simulate what the backend API would do
    console.log('\n=== Simulating backend API logic ===');
    
    // Find the salon
    let salon = await db.collection('salons').findOne({ ownerId: new ObjectId(userId) });
    console.log(`Found salon by ownerId: ${!!salon}`);
    
    if (!salon) {
      console.log('Trying fallback method...');
      salon = await db.collection('salons').findOne({ email: user.email });
      console.log(`Found salon by email: ${!!salon}`);
    }
    
    if (!salon) {
      console.log('❌ Salon not found');
      return;
    }
    
    console.log(`✅ Found salon: ${salon.salonName} (${salon._id})`);
    
    // Query for pending requests using salonId approach (the new efficient method)
    console.log('\n=== Querying for pending requests (salonId approach) ===');
    const requestsBySalonId = await db.collection('schedulerequests').find({ 
      salonId: new ObjectId(salon._id.toString()),
      status: 'pending'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
    
    console.log(`Found ${requestsBySalonId.length} requests using salonId`);
    
    // Populate staff information
    if (requestsBySalonId.length > 0) {
      console.log('\n=== Populating staff information ===');
      const staffIds = [...new Set(requestsBySalonId.map(req => req.staffId.toString()))];
      console.log('Staff IDs to populate:', staffIds);
      
      const staffMembers = await db.collection('staffs').find({ 
        _id: { $in: staffIds.map(id => new ObjectId(id)) }
      }).toArray();
      
      console.log(`Found ${staffMembers.length} staff members`);
      
      // Create a map for quick lookup
      const staffMap = {};
      staffMembers.forEach(staff => {
        staffMap[staff._id.toString()] = {
          _id: staff._id,
          name: staff.name,
          position: staff.position
        };
      });
      
      // Add staff information to requests
      const populatedRequests = requestsBySalonId.map(request => {
        const staffInfo = staffMap[request.staffId.toString()] || null;
        return {
          _id: request._id,
          type: request.type,
          status: request.status,
          createdAt: request.createdAt,
          staffId: staffInfo,
          blockTime: request.blockTime || {},
          leave: request.leave || {},
          shiftSwap: request.shiftSwap || {}
        };
      });
      
      console.log('\n=== Final response format ===');
      const response = {
        success: true,
        data: {
          items: populatedRequests,
          pagination: {
            page: 1,
            limit: 10,
            totalPages: 1,
            totalItems: populatedRequests.length
          }
        }
      };
      
      console.log(JSON.stringify(response, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

testBackendAPI();