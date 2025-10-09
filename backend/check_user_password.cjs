// Check the actual password for the test user
const { MongoClient } = require('mongodb');

async function checkUserPassword() {
  const uri = "mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare";
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to the database
    await client.connect();
    console.log("Connected successfully to MongoDB");
    
    const db = client.db('auracare');
    
    // Find the test user
    const user = await db.collection('users').findOne({ 
      email: 'test-salon-owner@example.com'
    });
    
    if (user) {
      console.log('User found:');
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Type:', user.type);
      console.log('- Password (hashed):', user.password ? user.password.substring(0, 20) + '...' : 'NULL');
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

checkUserPassword();