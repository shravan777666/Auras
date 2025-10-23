// Debug script to check salon-user relationships
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

async function debugSalonUserRelationship() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Find all salon users
    const salonUsers = await db.collection('users').find({ type: 'salon' }).toArray();
    console.log('Found', salonUsers.length, 'salon users');
    
    for (const user of salonUsers) {
      console.log('\nUser:', {
        id: user._id,
        email: user.email,
        type: user.type
      });
      
      // Try to find salon by user field
      const salonByUser = await db.collection('salons').findOne({ user: user._id });
      console.log('Salon by user field:', salonByUser ? salonByUser._id : 'Not found');
      
      // Try to find salon by ownerId field
      const salonByOwnerId = await db.collection('salons').findOne({ ownerId: user._id });
      console.log('Salon by ownerId field:', salonByOwnerId ? salonByOwnerId._id : 'Not found');
      
      // Try to find any salon associated with this user
      const anySalon = await db.collection('salons').findOne({
        $or: [
          { user: user._id },
          { ownerId: user._id }
        ]
      });
      
      if (anySalon) {
        console.log('Found associated salon:', {
          id: anySalon._id,
          salonName: anySalon.salonName,
          email: anySalon.email,
          user: anySalon.user,
          ownerId: anySalon.ownerId
        });
      } else {
        console.log('No associated salon found for this user');
      }
    }
    
  } catch (error) {
    console.error('Error debugging salon-user relationships:', error);
  } finally {
    await client.close();
  }
}

debugSalonUserRelationship();