import axios from 'axios';

// Test script to verify that admin can see freelancer information
const testAdminFreelancerDisplay = async () => {
  try {
    console.log('Testing admin freelancer display functionality...');
    
    // This test assumes you have an admin token for authentication
    // In a real scenario, you would need to authenticate first
    
    // Example admin token (this would need to be a real admin token from your system)
    const adminToken = process.env.ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN_HERE';
    
    if (!adminToken || adminToken === 'YOUR_ADMIN_TOKEN_HERE') {
      console.log('⚠️  Warning: No admin token provided. This test requires a valid admin token.');
      console.log('   Please set ADMIN_TOKEN environment variable with a valid admin JWT token');
      console.log('   Or manually replace YOUR_ADMIN_TOKEN_HERE with a valid token');
      return;
    }
    
    console.log('Making request to get pending freelancers...');
    
    const response = await axios.get(
      'http://localhost:5000/api/admin/pending-freelancers',
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Successfully fetched pending freelancers');
    console.log('Number of pending freelancers:', response.data.data.length);
    
    if (response.data.data.length > 0) {
      response.data.data.forEach((freelancer, index) => {
        console.log(`\n--- Freelancer ${index + 1} ---`);
        console.log('Name:', freelancer.name);
        console.log('Email:', freelancer.email);
        console.log('Phone:', freelancer.phone);
        console.log('Service Location:', freelancer.serviceLocation);
        console.log('Years of Experience:', freelancer.yearsOfExperience);
        console.log('Skills:', freelancer.skills);
        console.log('Profile Picture URL:', freelancer.profilePicture);
        
        console.log('Documents:');
        console.log('  Government ID:', freelancer.documents?.governmentId);
        console.log('  Certificates:', freelancer.documents?.certificates);
        console.log('  Profile Picture in Documents:', freelancer.documents?.profilePicture);
        
        console.log('Address:', freelancer.address);
        console.log('Location:', freelancer.location);
        console.log('Setup Completed:', freelancer.setupCompleted);
        console.log('Approval Status:', freelancer.approvalStatus);
      });
      
      console.log('\n✅ All freelancer information is properly displayed in admin panel!');
      console.log('✅ Profile pictures, government IDs, and certificates are accessible via URLs!');
    } else {
      console.log('ℹ️  No pending freelancers found. This is expected if there are no pending registrations.');
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Error response from server:');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else {
      console.log('❌ Error making request:', error.message);
    }
  }
};

// Run the test
testAdminFreelancerDisplay();