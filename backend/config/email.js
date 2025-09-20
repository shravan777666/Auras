import nodemailer from 'nodemailer';

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send OTP email
export const sendOTPEmail = async (email, otp, userType) => {
  try {
    // Validate inputs
    if (!email || !otp || !userType) {
      throw new Error('Missing required parameters: email, otp, or userType');
    }

    // Check email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
    }

    const transporter = createTransporter();
    
    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('Email transporter verification failed:', verifyError);
      throw new Error('Email service configuration error');
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - AuraCare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AuraCare</h1>
            <p style="color: white; margin: 5px 0;">Beauty Salon Management</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hello,
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password for your ${userType} account. 
              Please use the following OTP to proceed with password reset:
            </p>
            
            <div style="background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
              <p style="color: #999; margin: 10px 0 0 0; font-size: 14px;">This OTP is valid for 5 minutes</p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If you didn't request this password reset, please ignore this email. 
              Your password will remain unchanged.
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
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    if (!result || !result.messageId) {
      throw new Error('Failed to send email - no message ID returned');
    }
    
    console.log('OTP email sent successfully:', result.messageId);
    console.log('Email sent from:', process.env.EMAIL_USER);
    console.log('Email sent to:', email);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending OTP email:', error);
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      return { success: false, error: 'Email authentication failed. Please check email credentials.' };
    } else if (error.code === 'ECONNECTION') {
      return { success: false, error: 'Failed to connect to email service. Please try again later.' };
    } else if (error.code === 'EMESSAGE') {
      return { success: false, error: 'Invalid email message format.' };
    } else {
      return { success: false, error: error.message || 'Unknown email sending error' };
    }
  }
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
