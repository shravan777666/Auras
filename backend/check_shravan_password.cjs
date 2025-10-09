// Check if we can find the password for the Shravan user
const { MongoClient } = require('mongodb');

async function checkShravanPassword() {
  const uri = "mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare";
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to the database
    await client.connect();
    console.log("Connected successfully to MongoDB");
    
    const db = client.db('auracare');
    
    // Find the Shravan user
    const user = await db.collection('users').findOne({ 
      email: 'shravan@gmail.com'
    });
    
    if (user) {
      console.log('Shravan user found:');
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Type:', user.type);
      console.log('- Setup completed:', user.setupCompleted);
      console.log('- Password (hashed):', user.password ? user.password.substring(0, 20) + '...' : 'NULL');
    } else {
      console.log('Shravan user not found');
    }
    
    // Check if the salon is approved
    const salon = await db.collection('salons').findOne({ 
      email: 'shravan@gmail.com'
    });
    
    if (salon) {
      console.log('\nShravan salon found:');
      console.log('- Name:', salon.salonName);
      console.log('- Approval status:', salon.approvalStatus);
      console.log('- Setup completed:', salon.setupCompleted);
      console.log('- Is verified:', salon.isVerified);
    } else {
      console.log('\nShravan salon not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

checkShravanPassword();