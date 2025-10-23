import cron from 'node-cron';
import Appointment from '../models/Appointment.js';
import CancellationPolicy from '../models/CancellationPolicy.js';
import { sendEmail } from '../config/email.js';

// Send cancellation reminders 48 and 24 hours before appointment
export const startCancellationReminders = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🔍 Checking for cancellation reminders to send...');
      
      // Get appointments scheduled for the next 48-72 hours
      const now = new Date();
      const startTime = new Date(now.getTime() + (48 * 60 * 60 * 1000)); // 48 hours from now
      const endTime = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // 72 hours from now
      
      // Find appointments in this time range
      const appointments = await Appointment.find({
        appointmentDate: {
          $gte: startTime.toISOString().split('T')[0],
          $lte: endTime.toISOString().split('T')[0]
        },
        status: 'Approved',
        cancellationReminderSent: { $ne: true }
      }).populate('customerId', 'name email')
        .populate('salonId', 'salonName contactEmail')
        .populate('services.serviceId', 'name');
      
      console.log(`📧 Found ${appointments.length} appointments for cancellation reminders`);
      
      for (const appointment of appointments) {
        try {
          // Get salon's cancellation policy
          const policy = await CancellationPolicy.findOne({ salonId: appointment.salonId._id });
          
          if (!policy || !policy.isActive) {
            console.log(`⏭️ Skipping appointment ${appointment._id} - no active policy`);
            continue;
          }
          
          // Send reminder email
          await sendCancellationReminder(appointment, policy);
          
          // Mark reminder as sent
          appointment.cancellationReminderSent = true;
          await appointment.save();
          
          console.log(`✅ Sent cancellation reminder for appointment ${appointment._id}`);
        } catch (error) {
          console.error(`❌ Error sending reminder for appointment ${appointment._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in cancellation reminder cron job:', error.message);
    }
  });
};

const sendCancellationReminder = async (appointment, policy) => {
  const customer = appointment.customerId;
  const salon = appointment.salonId;
  
  if (!customer || !customer.email) {
    console.log(`⏭️ Skipping reminder - no customer email for appointment ${appointment._id}`);
    return;
  }
  
  const subject = `Reminder: Cancellation Policy for Your ${salon.salonName} Appointment`;
  
  const servicesList = appointment.services.map(s => s.serviceId?.name || 'Service').join(', ');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">AuraCare</h1>
        <p style="color: white; margin: 5px 0;">Beauty Salon Management</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2 style="color: #333;">Appointment Reminder</h2>
        <p>Hi ${customer.name},</p>
        
        <p>This is a reminder about your upcoming appointment at <strong>${salon.salonName}</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Appointment Details:</h3>
          <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toDateString()}</p>
          <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
          <p><strong>Services:</strong> ${servicesList}</p>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Cancellation Policy:</h3>
          <p>${policy.policyMessage.replace('{noticePeriod}', policy.noticePeriod)}</p>
          <ul>
            <li><strong>Late Cancellation Fee:</strong> ${policy.lateCancellationPenalty}% of service cost</li>
            <li><strong>No-Show Fee:</strong> ${policy.noShowPenalty}% of service cost</li>
          </ul>
          <p>To avoid fees, please cancel at least <strong>${policy.noticePeriod} hours</strong> before your appointment.</p>
        </div>
        
        <p>If you need to cancel or reschedule, please log in to your account or contact the salon directly.</p>
        
        <p>Thank you,<br/>The ${salon.salonName} Team</p>
      </div>
      
      <div style="background: #333; padding: 15px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          © 2024 AuraCare. All rights reserved.
        </p>
      </div>
    </div>
  `;
  
  await sendEmail({
    to: customer.email,
    subject,
    html
  });
};