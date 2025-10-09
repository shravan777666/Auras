// Simple MongoDB test script to explore data
const { MongoClient } = require('mongodb');

async function exploreDatabase() {
  const uri = "mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare";
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to the database
    await client.connect();
    console.log("Connected successfully to MongoDB");
    
    const db = client.db('auracare');
    
    // Check all salons and their ownerId fields
    console.log('\n=== All Salons ===');
    const salons = await db.collection('salons').find({}).toArray();
    console.log(`Found ${salons.length} salons:`);
    
    salons.forEach((salon, index) => {
      console.log(`${index + 1}. ${salon.salonName || 'No Name'} - Owner ID: ${salon.ownerId || 'NULL'} - Email: ${salon.email || 'NULL'}`);
    });
    
    // Check a specific salon
    console.log('\n=== Checking specific salon ===');
    const specificSalon = await db.collection('salons').findOne({ 
      salonName: 'Shravan' 
    });
    
    if (specificSalon) {
      console.log('Found Shravan salon:');
      console.log(JSON.stringify(specificSalon, null, 2));
    } else {
      console.log('Shravan salon not found');
    }
    
    // Check users
    console.log('\n=== Checking users ===');
    const users = await db.collection('users').find({ type: 'salon' }).toArray();
    console.log(`Found ${users.length} salon users:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No Name'} - ID: ${user._id} - Email: ${user.email || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

exploreDatabase();