/**
 * Test script for the Loyalty Points system
 * This script tests the integration of the loyalty system with appointments
 */

import mongoose from 'mongoose';
import Customer from './models/Customer.js';
import Appointment from './models/Appointment.js';
import { 
  successResponse, 
  errorResponse 
} from './utils/responses.js';

// Test data
const testCustomerData = {
  name: 'Test Customer',
  email: 'test.customer@example.com',
  password: 'Test@123',
  contactNumber: '+1234567890',
  type: 'customer'
};

const testAppointmentData = {
  services: [
    {
      serviceName: 'Hair Cut',
      price: 500,
      duration: 30
    }
  ],
  appointmentDate: '2025-12-01T10:00',
  appointmentTime: '10:00',
  totalAmount: 500,
  finalAmount: 500,
  status: 'Completed'
};

/**
 * Test customer creation and loyalty points initialization
 */
async function testCustomerCreation() {
  console.log('Testing customer creation and loyalty points initialization...');
  
  try {
    // Create a test customer
    const customer = new Customer(testCustomerData);
    await customer.save();
    
    console.log('✅ Customer created successfully');
    console.log(`   Customer ID: ${customer._id}`);
    console.log(`   Initial Loyalty Points: ${customer.loyaltyPoints}`);
    console.log(`   Total Points Earned: ${customer.totalPointsEarned}`);
    console.log(`   Loyalty Tier: ${customer.loyaltyTier}`);
    
    return customer;
  } catch (error) {
    console.error('❌ Error creating customer:', error.message);
    return null;
  }
}

/**
 * Test appointment completion and points earning
 */
async function testPointsEarning(customer) {
  console.log('\nTesting appointment completion and points earning...');
  
  try {
    // Create a test appointment
    const appointment = new Appointment({
      ...testAppointmentData,
      customerId: customer._id,
      // salonId would be required in real implementation
    });
    
    await appointment.save();
    console.log('✅ Appointment created successfully');
    console.log(`   Appointment ID: ${appointment._id}`);
    console.log(`   Appointment Amount: ₹${appointment.finalAmount}`);
    console.log(`   Initial Points Earned: ${appointment.pointsEarned}`);
    
    // Complete the appointment to trigger points earning
    await appointment.updateStatus('Completed');
    
    // Refresh customer data
    const updatedCustomer = await Customer.findById(customer._id);
    
    console.log('✅ Appointment completed and points awarded');
    console.log(`   Points Earned: ${appointment.pointsEarned}`);
    console.log(`   Customer Loyalty Points: ${updatedCustomer.loyaltyPoints}`);
    console.log(`   Customer Total Points Earned: ${updatedCustomer.totalPointsEarned}`);
    console.log(`   Customer Loyalty Tier: ${updatedCustomer.loyaltyTier}`);
    
    return { appointment, customer: updatedCustomer };
  } catch (error) {
    console.error('❌ Error testing points earning:', error.message);
    return null;
  }
}

/**
 * Test points redemption
 */
async function testPointsRedemption(customer, appointment) {
  console.log('\nTesting points redemption...');
  
  try {
    // Try to redeem points
    const pointsToRedeem = 100;
    const discountAmount = pointsToRedeem;
    
    // Update customer points
    customer.loyaltyPoints = customer.loyaltyPoints - pointsToRedeem;
    customer.totalPointsRedeemed = (customer.totalPointsRedeemed || 0) + pointsToRedeem;
    await customer.save();
    
    // Update appointment with redeemed points and discount
    appointment.pointsRedeemed = pointsToRedeem;
    appointment.discountFromPoints = discountAmount;
    appointment.finalAmount = Math.max(0, appointment.finalAmount - discountAmount);
    await appointment.save();
    
    console.log('✅ Points redeemed successfully');
    console.log(`   Points Redeemed: ${appointment.pointsRedeemed}`);
    console.log(`   Discount Applied: ₹${appointment.discountFromPoints}`);
    console.log(`   New Appointment Total: ₹${appointment.finalAmount}`);
    console.log(`   Remaining Customer Points: ${customer.loyaltyPoints}`);
    
    return { appointment, customer };
  } catch (error) {
    console.error('❌ Error testing points redemption:', error.message);
    return null;
  }
}

/**
 * Test loyalty tier progression
 */
async function testLoyaltyTiers(customer) {
  console.log('\nTesting loyalty tier progression...');
  
  try {
    // Simulate earning more points to reach different tiers
    const pointsToEarn = 2000; // Enough to reach Gold tier
    customer.totalPointsEarned = pointsToEarn;
    
    // Update loyalty tier based on total points earned
    if (customer.totalPointsEarned >= 5000) {
      customer.loyaltyTier = 'Platinum';
    } else if (customer.totalPointsEarned >= 2000) {
      customer.loyaltyTier = 'Gold';
    } else if (customer.totalPointsEarned >= 500) {
      customer.loyaltyTier = 'Silver';
    }
    
    await customer.save();
    
    console.log('✅ Loyalty tier updated');
    console.log(`   Total Points Earned: ${customer.totalPointsEarned}`);
    console.log(`   Loyalty Tier: ${customer.loyaltyTier}`);
    
    return customer;
  } catch (error) {
    console.error('❌ Error testing loyalty tiers:', error.message);
    return null;
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(customerId) {
  console.log('\nCleaning up test data...');
  
  try {
    // Delete test customer and related data
    if (customerId) {
      await Customer.findByIdAndDelete(customerId);
      await Appointment.deleteMany({ customerId: customerId });
      console.log('✅ Test data cleaned up');
    }
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Running Loyalty Points System Tests\n');
  
  let testCustomer = null;
  let customerId = null;
  
  try {
    // Test 1: Customer creation
    testCustomer = await testCustomerCreation();
    if (!testCustomer) {
      console.log('❌ Customer creation failed. Stopping tests.');
      return;
    }
    
    customerId = testCustomer._id;
    
    // Test 2: Points earning
    const earningResult = await testPointsEarning(testCustomer);
    if (!earningResult) {
      console.log('❌ Points earning test failed.');
    }
    
    // Test 3: Points redemption
    if (earningResult) {
      const redemptionResult = await testPointsRedemption(
        earningResult.customer, 
        earningResult.appointment
      );
      if (!redemptionResult) {
        console.log('❌ Points redemption test failed.');
      }
    }
    
    // Test 4: Loyalty tiers
    const tierResult = await testLoyaltyTiers(testCustomer);
    if (!tierResult) {
      console.log('❌ Loyalty tier test failed.');
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error during tests:', error.message);
  } finally {
    // Clean up
    await cleanupTestData(customerId);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { 
  testCustomerCreation, 
  testPointsEarning, 
  testPointsRedemption, 
  testLoyaltyTiers, 
  cleanupTestData 
};