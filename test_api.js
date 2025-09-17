// Quick test script to verify the fixes
const BASE_URL = 'http://localhost:5000/api';

async function createAdminUser() {
  try {
    console.log('🧪 Creating admin user...');
    
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'System Administrator',
        email: 'admin@gmail.com',
        password: 'Admin@123',
        userType: 'admin'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin user created successfully');
      return true;
    } else {
      console.log('ℹ️ Admin user creation info:', data.message);
      return true; // Might already exist, which is ok
    }
  } catch (error) {
    console.error('❌ Admin user creation failed:', error.message);
    return false;
  }
}

async function testSalonRegistration() {
  try {
    console.log('🧪 Testing salon registration...');
    
    const response = await fetch(`${BASE_URL}/salon/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Salon Owner',
        email: 'testsalon' + Date.now() + '@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Salon registration successful:', data);
      return data.token;
    } else {
      console.error('❌ Salon registration failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Salon registration failed:', error.message);
    return null;
  }
}

async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login...');
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'Admin@123',
        userType: 'admin'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin login successful');
      return data.token;
    } else {
      console.error('❌ Admin login failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Admin login failed:', error.message);
    return null;
  }
}

async function testGetPendingSalons(adminToken) {
  try {
    console.log('🧪 Testing get pending salons...');
    
    const response = await fetch(`${BASE_URL}/admin/salons/pending`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Get pending salons successful:', data);
      return data;
    } else {
      console.error('❌ Get pending salons failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Get pending salons failed:', error.message);
    return null;
  }
}

async function testGetAllSalons(adminToken) {
  try {
    console.log('🧪 Testing get all salons...');
    
    const response = await fetch(`${BASE_URL}/admin/salons?page=1&limit=10`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Get all salons successful:', data);
      return data;
    } else {
      console.error('❌ Get all salons failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Get all salons failed:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  // Test 0: Create admin user
  await createAdminUser();
  
  // Test 1: Register a salon
  await testSalonRegistration();
  
  // Test 2: Admin login
  const adminToken = await testAdminLogin();
  
  if (adminToken) {
    // Test 3: Get pending salons
    await testGetPendingSalons(adminToken);
    
    // Test 4: Get all salons
    await testGetAllSalons(adminToken);
  }
  
  console.log('\n✨ Tests completed!');
}

runTests().catch(console.error);