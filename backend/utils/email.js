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

// Send appointment staff assignment notification email
export async function sendAppointmentStaffAssignmentEmail(email, customerName, appointmentDetails) {
  try {
    const subject = `Your Appointment at ${appointmentDetails.salonName} Has Been Assigned to ${appointmentDetails.staffName}`;
    
    // Create HTML email template
    const servicesList = appointmentDetails.services.map(service => `<li>${service}</li>`).join('');
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">AuraCare</h1>
          <p style="color: white; margin: 5px 0;">Beauty Salon Management</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Appointment Staff Assignment</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Dear ${customerName},
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Great news! Your appointment at <strong>${appointmentDetails.salonName}</strong> has been assigned to <strong>${appointmentDetails.staffName}</strong>.
          </p>
          
          <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
            <p style="color: #2e7d32; margin: 0; font-weight: bold;">
              🎉 Appointment Approved and Assigned!
            </p>
          </div>
          
          <div style="background: white; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #333; margin-top: 0;">Appointment Details</h3>
            <p style="margin: 5px 0;"><strong>Salon:</strong> ${appointmentDetails.salonName}</p>
            <p style="margin: 5px 0;"><strong>Assigned Staff:</strong> ${appointmentDetails.staffName} (${appointmentDetails.staffPosition})</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDetails.date}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${appointmentDetails.time}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> Approved</p>
          </div>
          
          <div style="background: white; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #333; margin-top: 0;">Services</h3>
            <ul style="color: #666; padding-left: 20px;">
              ${servicesList}
            </ul>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Your appointment is now confirmed and approved. Please arrive 10 minutes before your scheduled appointment time.
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
            If you need to reschedule or cancel, please contact the salon at least 24 hours in advance.
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
      console.log(`✅ Appointment staff assignment email sent to ${email}`);
      return { success: true, message: 'Email sent successfully' };
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('❌ Error sending appointment staff assignment email:', error);
    return { success: false, error: error.message };
  }
}

// Send gift card notification email
export async function sendGiftCardNotificationEmail(recipientEmail, recipientName, giftCardDetails) {
  try {
    const subject = `You've Received a Gift Card from ${giftCardDetails.senderName || 'someone'}`;
    
    // Create HTML email template
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎉 Gift Card Received!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">From ${giftCardDetails.senderName || 'a friend'}</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Special Gift Just For You</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Hello ${recipientName || 'there'},
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            You've received a beautiful gift card! Here are the details:
          </p>
          
          <div style="background: white; border: 2px dashed #ff6b6b; padding: 25px; margin: 20px 0; border-radius: 10px; text-align: center;">
            <h3 style="color: #ff6b6b; margin-top: 0; font-size: 24px;">${giftCardDetails.name}</h3>
            <div style="font-size: 32px; font-weight: bold; color: #333; margin: 15px 0;">₹${giftCardDetails.amount}</div>
            <div style="font-size: 14px; color: #666; margin-bottom: 15px;">Code: <strong>${giftCardDetails.code}</strong></div>
            <div style="font-size: 14px; color: #666;">
              Expires: ${new Date(giftCardDetails.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
          
          ${giftCardDetails.personalMessage ? `
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="color: #856404; margin: 0; font-style: italic;">
              <strong>Personal Message:</strong><br>
              "${giftCardDetails.personalMessage}"
            </p>
          </div>
          ` : ''}
          
          <p style="color: #666; line-height: 1.6;">
            This gift card is valid at <strong>${giftCardDetails.salonName}</strong> and can be used for ${giftCardDetails.usageType === 'BOTH' ? 'services and products' : giftCardDetails.usageType === 'SERVICE_ONLY' ? 'services only' : giftCardDetails.usageType === 'PRODUCT_ONLY' ? 'products only' : 'specified services'}. 
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/gift-cards/${giftCardDetails.salonId}" 
               style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block;
                      font-weight: bold;">
              View My Gift Cards
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for being valued! Enjoy your gift.
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
      to: recipientEmail,
      subject: subject,
      html: html
    });
    
    if (result.success) {
      console.log(`✅ Gift card notification email sent to ${recipientEmail}`);
      return { success: true, message: 'Email sent successfully' };
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('❌ Error sending gift card notification email:', error);
    return { success: false, error: error.message };
  }
}
