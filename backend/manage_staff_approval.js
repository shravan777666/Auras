import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';
import { sendStaffApprovalNotificationEmail } from './config/email.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'auracare'
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const showUsage = () => {
  console.log('\n📋 Staff Approval Management Tool\n');
  console.log('Usage: node manage_staff_approval.js <command> [parameters]');
  console.log('\nCommands:');
  console.log('  list                           - Show all pending staff approvals');
  console.log('  approve <email>               - Approve a staff application');
  console.log('  reject <email> [reason]       - Reject a staff application with optional reason');
  console.log('  status <email>                - Check status of a staff application');
  console.log('\nExamples:');
  console.log('  node manage_staff_approval.js list');
  console.log('  node manage_staff_approval.js approve staff@example.com');
  console.log('  node manage_staff_approval.js reject staff@example.com "Incomplete profile"');
  console.log('  node manage_staff_approval.js status staff@example.com');
};

const listPendingStaff = async () => {
  const pendingStaff = await Staff.find({ approvalStatus: 'pending' })
    .select('name email position skills experience setupCompleted createdAt');
  
  if (pendingStaff.length === 0) {
    console.log('✅ No pending staff approvals');
    return;
  }
  
  console.log(`\n📋 ${pendingStaff.length} Pending Staff Application(s):\n`);
  pendingStaff.forEach((staff, i) => {
    console.log(`${i + 1}. ${staff.name || 'Unnamed Staff'}`);
    console.log(`   Email: ${staff.email}`);
    console.log(`   Position: ${staff.position || 'Not specified'}`);
    console.log(`   Skills: ${staff.skills?.join(', ') || 'Not specified'}`);
    console.log(`   Experience: ${staff.experience?.years || 0} years`);
    console.log(`   Setup Completed: ${staff.setupCompleted ? 'Yes' : 'No'}`);
    console.log(`   Applied: ${staff.createdAt?.toLocaleDateString() || 'Unknown'}`);
    console.log('');
  });
};

const approveStaff = async (email) => {
  const staff = await Staff.findOne({ email });
  if (!staff) {
    console.log(`❌ No staff found with email: ${email}`);
    return;
  }
  
  if (staff.approvalStatus === 'approved') {
    console.log(`✅ Staff ${email} is already approved`);
    return;
  }
  
  // Update staff status
  staff.approvalStatus = 'approved';
  staff.isVerified = true;
  staff.approvalDate = new Date();
  await staff.save();
  
  console.log(`✅ Approved staff: ${staff.name || 'Unnamed'} (${email})`);
  console.log('🎉 The staff member can now log in and access their dashboard!');
  
  // Send approval notification emails to both staff member and salon owner
  try {
    console.log('📧 Initiating email notifications for staff approval...');
    
    // Get the assigned salon to find the owner
    if (staff.assignedSalon) {
      const salon = await Salon.findById(staff.assignedSalon);
      if (salon) {
        const salonName = salon.salonName || 'Your Salon';
        const staffName = staff.name || 'Staff Member';
        const position = staff.position || 'Staff';
        
        console.log('📧 Preparing emails for:', {
          staffEmail: staff.email,
          salonName,
          staffName,
          position
        });

        // Send email to staff member
        if (staff.email) {
          try {
            console.log('📧 Sending approval email to staff member...');
            // Import the email function directly
            const { sendStaffApprovalEmail } = await import('./config/email.js');
            const staffEmailResult = await sendStaffApprovalEmail(
              staff.email,
              staffName,
              salonName,
              position
            );
            
            if (staffEmailResult.success) {
              console.log('✅ Staff approval email sent successfully to staff member!');
            } else {
              console.error('❌ Failed to send staff approval email to staff member:', staffEmailResult.error);
              console.error('Staff email error details:', {
                email: staff.email,
                staffName,
                salonName,
                position
              });
            }
          } catch (emailError) {
            console.error('❌ Exception while sending staff approval email to staff member:', emailError.message);
            console.error('Staff email exception details:', {
              email: staff.email,
              staffName,
              salonName,
              position,
              error: emailError.message
            });
          }
        } else {
          console.log('⚠️ Staff email not available, cannot send approval email to staff.');
        }
        
        // Send notification email to salon owner
        const salonOwner = await User.findById(salon.ownerId);
        if (salonOwner && salonOwner.email) {
          try {
            console.log('📧 Sending notification email to salon owner...');
            const { sendStaffApprovalNotificationEmail } = await import('./config/email.js');
            const ownerEmailResult = await sendStaffApprovalNotificationEmail(
              salonOwner.email, 
              salonName, 
              staffName, 
              position
            );
            
            if (ownerEmailResult.success) {
              console.log('✅ Staff approval notification email sent successfully to salon owner!');
            } else {
              console.error('❌ Failed to send staff approval notification email:', ownerEmailResult.error);
              console.error('Owner email error details:', {
                email: salonOwner.email,
                salonName,
                staffName,
                position
              });
            }
          } catch (emailError) {
            console.error('❌ Exception while sending staff approval notification email:', emailError.message);
            console.error('Owner email exception details:', {
              email: salonOwner.email,
              salonName,
              staffName,
              position,
              error: emailError.message
            });
          }
        } else {
          console.log('⚠️ Salon owner not found or email not available for salon:', salon._id);
        }
      } else {
        console.log('⚠️ Assigned salon not found:', staff.assignedSalon);
      }
    } else {
      console.log('⚠️ No assigned salon for staff member:', staff._id);
    }
  } catch (emailError) {
    console.error('❌ Error sending staff approval emails:', emailError.message);
    console.error('Email error details:', emailError);
  }
};

const rejectStaff = async (email, reason) => {
  const staff = await Staff.findOne({ email });
  if (!staff) {
    console.log(`❌ No staff found with email: ${email}`);
    return;
  }
  
  if (staff.approvalStatus === 'rejected') {
    console.log(`❌ Staff ${email} is already rejected`);
    return;
  }
  
  // Update staff status
  staff.approvalStatus = 'rejected';
  staff.rejectionReason = reason || 'No reason provided';
  staff.isVerified = false;
  await staff.save();
  
  console.log(`❌ Rejected staff: ${staff.name || 'Unnamed'} (${email})`);
  console.log(`📝 Reason: ${staff.rejectionReason}`);
};

const checkStatus = async (email) => {
  const staff = await Staff.findOne({ email })
    .populate('assignedSalon', 'salonName')
    .populate('user', 'name email setupCompleted');
  
  if (!staff) {
    console.log(`❌ No staff found with email: ${email}`);
    return;
  }
  
  console.log(`\n📊 Staff Status for ${email}:`);
  console.log(`Name: ${staff.name || 'Not set'}`);
  console.log(`Position: ${staff.position || 'Not set'}`);
  console.log(`Status: ${staff.approvalStatus}`);
  console.log(`Verified: ${staff.isVerified}`);
  console.log(`Active: ${staff.isActive}`);
  console.log(`Setup Completed: ${staff.setupCompleted}`);
  console.log(`User Setup Completed: ${staff.user?.setupCompleted || 'Unknown'}`);
  console.log(`Skills: ${staff.skills?.join(', ') || 'None specified'}`);
  console.log(`Experience: ${staff.experience?.years || 0} years`);
  console.log(`Assigned Salon: ${staff.assignedSalon?.salonName || 'None'}`);
  
  if (staff.rejectionReason) {
    console.log(`Rejection Reason: ${staff.rejectionReason}`);
  }
  
  if (staff.approvalDate) {
    console.log(`Approved On: ${staff.approvalDate.toLocaleString()}`);
  }
  
  console.log(`Applied: ${staff.createdAt?.toLocaleString() || 'Unknown'}`);
  console.log(`Last Updated: ${staff.updatedAt?.toLocaleString() || 'Unknown'}`);
};

const main = async () => {
  await connectDB();
  
  const command = process.argv[2];
  const email = process.argv[3];
  const reason = process.argv[4];
  
  try {
    switch (command) {
      case 'list':
        await listPendingStaff();
        break;
      case 'approve':
        if (!email) {
          console.log('❌ Email is required for approve command');
          showUsage();
          process.exit(1);
        }
        await approveStaff(email);
        break;
      case 'reject':
        if (!email) {
          console.log('❌ Email is required for reject command');
          showUsage();
          process.exit(1);
        }
        await rejectStaff(email, reason);
        break;
      case 'status':
        if (!email) {
          console.log('❌ Email is required for status command');
          showUsage();
          process.exit(1);
        }
        await checkStatus(email);
        break;
      default:
        console.log(`❌ Unknown command: ${command || 'none'}`);
        showUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

main();