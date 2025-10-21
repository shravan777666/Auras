import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';
import User from './models/User.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function testAdminStaffApprovalProcess() {
  try {
    console.log('=== Testing Admin Staff Approval Process ===');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'auracare'
    });
    console.log('✅ Connected to MongoDB');
    
    // Find a staff member that needs approval
    const staff = await Staff.findOne({ 
      approvalStatus: { $ne: 'approved' },
      email: { $exists: true, $ne: null }
    }).populate('assignedSalon');
    
    if (!staff) {
      console.log('⚠️ No staff members needing approval found in database.');
      // Let's create a test staff member
      console.log('Creating a test staff member...');
      
      // Create a test staff member WITHOUT salon assignment
      const testStaff = new Staff({
        name: 'Test Staff Member',
        email: 'test.staff.nosalon@example.com',
        position: 'Hair Stylist',
        approvalStatus: 'pending',
        isVerified: false
        // No assignedSalon - testing the fix for this case
      });
      
      await testStaff.save();
      console.log('✅ Created test staff member without salon:', testStaff.name);
      
      // Re-find without populated salon
      const populatedStaff = await Staff.findById(testStaff._id);
      console.log('Testing with created staff member (no salon)...');
      await testApprovalProcess(populatedStaff);
    } else {
      console.log('Found staff member for testing:', {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        approvalStatus: staff.approvalStatus,
        assignedSalon: staff.assignedSalon
      });
      
      await testApprovalProcess(staff);
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

async function testApprovalProcess(staff) {
  console.log('\n=== SIMULATING ADMIN APPROVAL PROCESS ===');
  
  // Simulate the approval process exactly as in adminController
  console.log('Approving staff member...');
  
  // Update staff status (as done in adminController)
  staff.approvalStatus = 'approved';
  staff.isVerified = true;
  staff.approvalDate = new Date();
  await staff.save();
  
  console.log('✅ Staff member approved in database');
  
  // Now simulate the NEW email sending process (with our fix)
  console.log('\n📧 Initiating email notifications for staff approval (with fix)...');
  
  try {
    console.log('📧 Sending approval email to staff member (even without salon)...');
    
    // Import email functions
    const { sendStaffApprovalEmail, sendStaffApprovalNotificationEmail } = await import('./config/email.js');
    
    // ALWAYS send email to staff member regardless of salon assignment
    if (staff.email) {
      try {
        const staffName = staff.name || 'Staff Member';
        const salonName = staff.assignedSalon ? 'your assigned salon' : 'a salon on AuraCare';
        const position = staff.position || 'Staff';
        
        const staffEmailResult = await sendStaffApprovalEmail(
          staff.email,
          staffName,
          salonName,
          position
        );
        if (staffEmailResult.success) {
          console.log('✅ Staff approval email sent successfully to staff:', staff.email);
        } else {
          console.error('❌ Failed to send staff approval email:', staffEmailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Exception while sending staff approval email:', emailError);
      }
    } else {
      console.log('⚠️ Staff email not available, cannot send approval email to staff.');
    }

    // Send notification email to salon owner ONLY if salon is assigned
    if (staff.assignedSalon) {
      const salon = await Salon.findById(staff.assignedSalon);
      if (salon) {
        const salonName = salon.salonName || 'Your Salon';
        const staffName = staff.name || 'Staff Member';
        const position = staff.position || 'Staff';

        console.log('📧 Preparing salon owner notification for:', {
          salonName,
          staffName,
          position
        });

        // Get salon owner's email from the User model to send notification to salon owner
        const salonOwner = await User.findById(salon.ownerId);
        if (salonOwner && salonOwner.email) {
          try {
            console.log('📧 Sending notification email to salon owner...');
            const ownerEmailResult = await sendStaffApprovalNotificationEmail(
              salonOwner.email,
              salonName,
              staffName,
              position
            );
            if (ownerEmailResult.success) {
              console.log('✅ Staff approval notification email sent successfully to salon owner:', salonOwner.email);
            } else {
              console.error('❌ Failed to send staff approval notification email to salon owner:', ownerEmailResult.error);
            }
          } catch (emailError) {
            console.error('❌ Exception while sending staff approval notification email to salon owner:', emailError);
          }
        } else {
          console.log('⚠️ Salon owner not found or email not available for salon:', salon._id);
        }
      } else {
        console.log('⚠️ Assigned salon not found:', staff.assignedSalon);
      }
    } else {
      console.log('ℹ️ No assigned salon for staff member - skipping salon owner notification (expected for some cases)');
    }
  } catch (emailError) {
    console.error('❌ Error sending staff approval emails:', emailError);
  }
}

testAdminStaffApprovalProcess();