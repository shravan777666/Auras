// backend/utils/email.js
// Placeholder email utility

export function sendEmail(to, subject, body) {
  // Implement email sending logic here
  console.log(`Email sent to ${to}: ${subject}`);
}

// Send appointment confirmation email
export async function sendAppointmentConfirmation(email, customerName, appointmentDetails) {
  try {
    const subject = 'Appointment Confirmation - Auracare Beauty Parlor';
    const body = `
      Dear ${customerName},
      
      Your appointment has been confirmed!
      
      Details:
      - Salon: ${appointmentDetails.salonName}
      - Date: ${appointmentDetails.date}
      - Time: ${appointmentDetails.time}
      - Services: ${appointmentDetails.services.join(', ')}
      - Total Amount: $${appointmentDetails.totalAmount}
      
      Thank you for choosing Auracare!
      
      Best regards,
      Auracare Team
    `;
    
    // For now, just log the email content
    console.log(`Appointment confirmation email sent to ${email}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
    return { success: false, error: error.message };
  }
}
