// Script to check cancellation policies in the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
import connectDB from './config/database.js';
connectDB();

// Import models
import CancellationPolicy from './models/CancellationPolicy.js';
import Salon from './models/Salon.js';

async function checkPolicies() {
  try {
    console.log('🔍 Checking cancellation policies in database...');
    
    // Get all policies
    const policies = await CancellationPolicy.find({}).populate('salonId', 'salonName');
    
    console.log(`📋 Found ${policies.length} cancellation policies:`);
    
    policies.forEach((policy, index) => {
      console.log(`${index + 1}. Salon: ${policy.salonId?.salonName || 'Unknown'}`);
      console.log(`   ID: ${policy._id}`);
      console.log(`   Active: ${policy.isActive}`);
      console.log(`   Notice Period: ${policy.noticePeriod} hours`);
      console.log(`   Late Cancellation Penalty: ${policy.lateCancellationPenalty}%`);
      console.log(`   No-Show Penalty: ${policy.noShowPenalty}%`);
      console.log(`   Message: ${policy.policyMessage}`);
      console.log('---');
    });
    
    if (policies.length === 0) {
      console.log('⚠️  No cancellation policies found in database');
      
      // Check if there are any salons
      const salons = await Salon.find({});
      console.log(`📋 Found ${salons.length} salons in database`);
      
      if (salons.length > 0) {
        console.log('💡 Salons without policies will use default policy values');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking policies:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkPolicies();