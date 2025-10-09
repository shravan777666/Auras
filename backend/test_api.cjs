// Test the API endpoint directly
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

async function testAPIEndpoint() {
  const uri = "mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare";
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to the database
    await client.connect();
    console.log("Connected successfully to MongoDB");
    
    const db = client.db('auracare');
    
    // Get a salon owner user
    const userId = '68cceb53faf3e420e3dae255'; // This is actually the salon ID, not user ID
    console.log(`\n=== Looking for salon owner user ===`);
    
    // Let's find the actual user ID from the salon ownerId field
    const salon = await db.collection('salons').findOne({ 
      ownerId: new ObjectId('68cceb53faf3e420e3dae253')
    });
    
    if (!salon) {
      console.log('Salon not found');
      return;
    }
    
    console.log(`Found salon: ${salon.salonName}`);
    console.log(`Owner ID from salon: ${salon.ownerId}`);
    
    // Now let's create a JWT token for this user
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(salon.ownerId.toString())
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Create a JWT token (this is just for testing, not the real secret)
    const token = jwt.sign(
      { 
        id: user._id.toString(),
        email: user.email,
        type: user.type
      },
      '86ed8b0db49bca766733daa44efefd552f6282642483b72ef2ee389ea057a754e4839c1a0ebdc0b0e9fd397d8eb20bdfa2293d975002cb10a89256fa1c8b4d95',
      { expiresIn: '7d' }
    );
    
    console.log(`\nGenerated token: ${token}`);
    
    console.log('\n=== Testing salon lookup logic ===');
    // Test the salon lookup logic
    let foundSalon = await db.collection('salons').findOne({ ownerId: new ObjectId(user._id.toString()) });
    console.log(`Found salon by ownerId: ${!!foundSalon}`);
    
    if (!foundSalon) {
      console.log('Trying fallback method...');
      foundSalon = await db.collection('salons').findOne({ email: user.email });
      console.log(`Found salon by email: ${!!foundSalon}`);
    }
    
    if (foundSalon) {
      console.log(`✅ Found salon: ${foundSalon.salonName} (${foundSalon._id})`);
      
      // Test the schedule request query
      console.log('\n=== Testing schedule request query ===');
      
      // Method 1: Using salonId field
      const requestsBySalonId = await db.collection('schedulerequests').find({ 
        salonId: new ObjectId(foundSalon._id.toString()),
        status: 'pending'
      }).toArray();
      
      console.log(`Found ${requestsBySalonId.length} requests using salonId`);
      
      if (requestsBySalonId.length > 0) {
        console.log('Requests found with salonId approach');
      } else {
        // Method 2: Using staff-based approach
        console.log('\n=== Testing staff-based approach ===');
        const staffMembers = await db.collection('staffs').find({ assignedSalon: new ObjectId(foundSalon._id.toString()) }).toArray();
        console.log(`Found ${staffMembers.length} staff members in salon`);
        
        const staffIds = staffMembers.map(staff => new ObjectId(staff._id.toString()));
        console.log('Staff IDs:', staffIds);
        
        if (staffIds.length > 0) {
          const requestsByStaffId = await db.collection('schedulerequests').find({ 
            staffId: { $in: staffIds },
            status: 'pending'
          }).toArray();
          
          console.log(`Found ${requestsByStaffId.length} requests using staffId`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

testAPIEndpoint();