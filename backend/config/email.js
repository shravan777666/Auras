import nodemailer from 'nodemailer';

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransporter({
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
    const transporter = createTransporter();
    
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
    console.log('OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
