import { sendEmail } from '../config/email.js';

// Send appointment confirmation email
export async function sendAppointmentConfirmation(email, customerName, appointmentDetails) {
  try {
    const subject = 'Appointment Confirmation - Auracare Beauty Parlor';
    
    // Create HTML email template
    const servicesList = appointmentDetails.services.map(service => `<li>${service}</li>`).join('');
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">AuraCare</h1>
          <p style="color: white; margin: 5px 0;">Beauty Salon Management</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Appointment Confirmation</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Dear ${customerName},
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Your appointment has been confirmed! Here are the details:
          </p>
          
          <div style="background: white; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #333; margin-top: 0;">Appointment Details</h3>
            <p style="margin: 5px 0;"><strong>Salon:</strong> ${appointmentDetails.salonName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDetails.date}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${appointmentDetails.time}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${appointmentDetails.totalAmount}</p>
            ${appointmentDetails.pointsRedeemed ? `
              <p style="margin: 5px 0;"><strong>Points Redeemed:</strong> ${appointmentDetails.pointsRedeemed} (₹${appointmentDetails.discountFromPoints} discount)</p>
            ` : ''}
          </div>
          
          <div style="background: white; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #333; margin-top: 0;">Services</h3>
            <ul style="color: #666; padding-left: 20px;">
              ${servicesList}
            </ul>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Please arrive 10 minutes before your scheduled appointment time. 
            If you need to reschedule or cancel, please contact the salon at least 24 hours in advance.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/bookings" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block;
                      font-weight: bold;">
              View Your Appointments
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for choosing Auracare!
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </div>
        
        <div style="background: #333; padding: 15px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            © 2024 AuraCare. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: email,
      subject: subject,
      html: html
    });
    
    if (result.success) {
      console.log(`✅ Appointment confirmation email sent to ${email}`);
      return { success: true, message: 'Email sent successfully' };
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('❌ Error sending appointment confirmation email:', error);
    return { success: false, error: error.message };
  }
}