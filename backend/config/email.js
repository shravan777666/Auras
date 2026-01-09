import nodemailer from 'nodemailer';

// Create transporter for sending emails
const createTransporter = () => {
  // Check if we should use Resend based on environment variables (at runtime)
  const useResend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0;
  
  if (useResend) {
    // Use Resend SMTP
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      secure: true,
      port: 465,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
      }
    });
  } else {
    // Use Gmail SMTP (fallback)
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
};

// Generic email sending function
export const sendEmail = async (options) => {
  try {
    // Validate inputs
    if (!options.to || !options.subject || (!options.html && !options.text)) {
      throw new Error('Missing required parameters: to, subject, and either html or text');
    }

    // Check email configuration (at runtime)
    const useResend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0;
    
    if (useResend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend configuration missing: RESEND_API_KEY not set');
      }
    } else {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
      }
    }

    const transporter = createTransporter();
    
    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('Email transporter verification failed:', verifyError);
      throw new Error('Email service configuration error: ' + verifyError.message);
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const result = await transporter.sendMail(mailOptions);
    
    if (!result || !result.messageId) {
      throw new Error('Failed to send email - no message ID returned');
    }
    
    console.log('Email sent successfully:', result.messageId);
    console.log('Email sent from:', mailOptions.from);
    console.log('Email sent to:', options.to);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending email:', error);
    
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

// Send OTP email
export const sendOTPEmail = async (email, otp, userType) => {
  try {
    // Validate inputs
    if (!email || !otp || !userType) {
      throw new Error('Missing required parameters: email, otp, or userType');
    }

    // Check email configuration (at runtime)
    const useResend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0;
    
    if (useResend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend configuration missing: RESEND_API_KEY not set');
      }
    } else {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
      }
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
      from: process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>',
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
    console.log('Email sent from:', mailOptions.from);
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

// Send salon approval notification email
export const sendSalonApprovalEmail = async (email, salonName, ownerName) => {
  try {
    // Validate inputs
    if (!email || !salonName || !ownerName) {
      throw new Error('Missing required parameters: email, salonName, or ownerName');
    }

    // Check email configuration (at runtime)
    const useResend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0;
    
    if (useResend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend configuration missing: RESEND_API_KEY not set');
      }
    } else {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
      }
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
      from: process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>',
      to: email,
      subject: 'Your Salon Has Been Approved - AuraCare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AuraCare</h1>
            <p style="color: white; margin: 5px 0;">Beauty Salon Management</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Salon Approval Confirmation</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Dear ${ownerName},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Great news! Your salon <strong>${salonName}</strong> has been successfully approved by our administration team.
            </p>
            
            <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
              <p style="color: #2e7d32; margin: 0; font-weight: bold;">
                🎉 Your salon is now live on AuraCare!
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              You can now log in to your salon dashboard and start managing your appointments, staff, and services.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block;
                        font-weight: bold;">
                Log In to Your Dashboard
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
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
    
    console.log('Salon approval email sent successfully:', result.messageId);
    console.log('Email sent from:', mailOptions.from);
    console.log('Email sent to:', email);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending salon approval email:', error);
    
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

// Send salon rejection notification email
export const sendSalonRejectionEmail = async (email, salonName, ownerName, rejectionReason) => {
  try {
    // Validate inputs
    if (!email || !salonName || !ownerName || !rejectionReason) {
      throw new Error('Missing required parameters: email, salonName, ownerName, or rejectionReason');
    }

    // Check email configuration (at runtime)
    const useResend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0;
    
    if (useResend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend configuration missing: RESEND_API_KEY not set');
      }
    } else {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
      }
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
      from: process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>',
      to: email,
      subject: 'Salon Application Update - AuraCare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AuraCare</h1>
            <p style="color: white; margin: 5px 0;">Beauty Salon Management</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Salon Application Status Update</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Dear ${ownerName},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Thank you for your interest in joining AuraCare. After reviewing your application for <strong>${salonName}</strong>, 
              we regret to inform you that your application has been rejected.
            </p>
            
            <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
              <p style="color: #c62828; margin: 0; font-weight: bold;">
                Reason for Rejection:
              </p>
              <p style="color: #c62828; margin: 10px 0 0 0;">
                ${rejectionReason}
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If you believe this decision was made in error or would like to reapply with additional information, 
              please contact our support team for further assistance.
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
    
    console.log('Salon rejection email sent successfully:', result.messageId);
    console.log('Email sent from:', mailOptions.from);
    console.log('Email sent to:', email);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending salon rejection email:', error);
    
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

// Send staff approval notification email to salon owner
export const sendStaffApprovalNotificationEmail = async (salonOwnerEmail, salonName, staffName, position) => {
  try {
    // Validate inputs
    if (!salonOwnerEmail || !salonName || !staffName || !position) {
      throw new Error('Missing required parameters: salonOwnerEmail, salonName, staffName, or position');
    }

    // Check email configuration (at runtime)
    const useResend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0;
    
    if (useResend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend configuration missing: RESEND_API_KEY not set');
      }
    } else {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
      }
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
      from: process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>',
      to: salonOwnerEmail,
      subject: `New Staff Member Approved - ${staffName} (${position})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AuraCare</h1>
            <p style="color: white; margin: 5px 0;">Beauty Salon Management</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">New Staff Member Approved</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Dear Salon Owner,
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Great news! A new staff member has been approved for your salon <strong>${salonName}</strong>.
            </p>
            
            <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
              <p style="color: #2e7d32; margin: 0; font-weight: bold;">
                🎉 Staff Member Approved
              </p>
              <p style="color: #2e7d32; margin: 5px 0 0 0;">
                <strong>${staffName}</strong> has been approved as <strong>${position}</strong>
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              The staff member can now access your salon dashboard and start accepting appointments.
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
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
    
    console.log('Staff approval notification email sent successfully:', result.messageId);
    console.log('Email sent from:', mailOptions.from);
    console.log('Email sent to:', salonOwnerEmail);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending staff approval notification email:', error);
    
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

// Send staff approval notification email to staff member
export const sendStaffApprovalEmail = async (staffEmail, staffName, salonName, position) => {
  try {
    // Validate inputs
    if (!staffEmail || !staffName || !salonName || !position) {
      throw new Error('Missing required parameters: staffEmail, staffName, salonName, or position');
    }

    // Check email configuration (at runtime)
    const useResend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0;
    
    if (useResend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend configuration missing: RESEND_API_KEY not set');
      }
    } else {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
      }
    }

    console.log('Preparing to send staff approval email:', {
      to: staffEmail,
      staffName,
      salonName,
      position
    });

    const transporter = createTransporter();
    
    // Verify transporter configuration
    try {
      console.log('Verifying email transporter...');
      await transporter.verify();
      console.log('Email transporter verified successfully');
    } catch (verifyError) {
      console.error('Email transporter verification failed:', verifyError);
      throw new Error('Email service configuration error: ' + verifyError.message);
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>',
      to: staffEmail,
      subject: `You've Been Approved! Welcome to ${salonName} on AuraCare`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AuraCare</h1>
            <p style="color: white; margin: 5px 0;">Beauty Salon Management</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to the Team!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hi ${staffName},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Congratulations! You have been approved as a <strong>${position}</strong> for <strong>${salonName}</strong> on the AuraCare platform.
            </p>
            
            <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
              <p style="color: #2e7d32; margin: 0; font-weight: bold;">
                🎉 You can now access your staff dashboard!
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Log in to your account to view your schedule, manage appointments, and more.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block;
                        font-weight: bold;">
                Log In to Your Staff Dashboard
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If you have any questions, please contact your salon owner or our support team.
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

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const result = await transporter.sendMail(mailOptions);
    
    if (!result || !result.messageId) {
      throw new Error('Failed to send email - no message ID returned');
    }
    
    console.log('Staff approval email sent successfully:', result.messageId);
    console.log('Email details:', {
      from: process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>',
      to: staffEmail,
      subject: mailOptions.subject,
      messageId: result.messageId
    });
    
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending staff approval email:', error);
    
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

// Send customer registration confirmation email
export const sendRegistrationConfirmationEmail = async (email, name, userType) => {
  try {
    // Validate inputs
    if (!email || !name || !userType) {
      throw new Error('Missing required parameters: email, name, or userType');
    }

    // Check email configuration (at runtime)
    const useResend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0;
    
    if (useResend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend configuration missing: RESEND_API_KEY not set');
      }
    } else {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
      }
    }

    const transporter = createTransporter();
    
    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('Email transporter verification failed:', verifyError);
      throw new Error('Email service configuration error');
    }
    
    // Determine user type label for the email
    const userTypeLabels = {
      'customer': 'Customer',
      'salon': 'Salon Owner',
      'staff': 'Beauty Professional',
      'admin': 'Administrator'
    };
    
    const userTypeLabel = userTypeLabels[userType] || userType;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>',
      to: email,
      subject: `Welcome to AuraCare - ${userTypeLabel} Account Created Successfully!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AuraCare</h1>
            <p style="color: white; margin: 5px 0;">Beauty Salon Management Platform</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to AuraCare!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hi ${name},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Congratulations! Your ${userTypeLabel} account has been successfully created on AuraCare.
            </p>
            
            <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
              <p style="color: #2e7d32; margin: 0; font-weight: bold;">
                🎉 Account Created Successfully!
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              ${
                userType === 'customer' 
                  ? 'You can now browse salons, book appointments, and manage your beauty services with ease.'
                  : userType === 'salon'
                  ? 'You can now manage your salon, staff, services, and appointments through your dashboard.'
                  : userType === 'staff'
                  ? 'You can now manage your schedule and provide services to clients through your dashboard.'
                  : 'You have administrative access to manage the entire platform.'
              }
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block;
                        font-weight: bold;">
                Log In to Your Account
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
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
    
    console.log('Registration confirmation email sent successfully:', result.messageId);
    console.log('Email sent from:', mailOptions.from);
    console.log('Email sent to:', email);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending registration confirmation email:', error);
    
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

// Send freelancer approval email
export const sendFreelancerApprovalEmail = async (freelancerEmail, freelancerName) => {
  try {
    // Validate inputs
    if (!freelancerEmail || !freelancerName) {
      throw new Error('Missing required parameters: freelancerEmail or freelancerName');
    }

    // Check email configuration (at runtime)
    const useResend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0;
    
    if (useResend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend configuration missing: RESEND_API_KEY not set');
      }
    } else {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
      }
    }

    console.log('Preparing to send freelancer approval email:', {
      to: freelancerEmail,
      freelancerName
    });

    const transporter = createTransporter();
    
    // Verify transporter configuration
    try {
      console.log('Verifying email transporter...');
      await transporter.verify();
      console.log('Email transporter verified successfully');
    } catch (verifyError) {
      console.error('Email transporter verification failed:', verifyError);
      throw new Error('Email service configuration error: ' + verifyError.message);
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>',
      to: freelancerEmail,
      subject: `You've Been Approved! Welcome to AuraCare as a Freelancer`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AuraCare</h1>
            <p style="color: white; margin: 5px 0;">Beauty Service Platform</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to AuraCare!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hi ${freelancerName},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Congratulations! Your freelancer application has been <strong>approved</strong> on the AuraCare platform.
            </p>
            
            <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
              <p style="color: #2e7d32; margin: 0; font-weight: bold;">
                🎉 You can now access your freelancer dashboard!
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Log in to your account to manage your services, view bookings, and grow your independent beauty business.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block;
                        font-weight: bold;">
                Log In to Your Freelancer Dashboard
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If you have any questions, please contact our support team.
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

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const result = await transporter.sendMail(mailOptions);
    
    if (!result || !result.messageId) {
      throw new Error('Failed to send email - no message ID returned');
    }
    
    console.log('Freelancer approval email sent successfully:', result.messageId);
    console.log('Email details:', {
      from: process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>',
      to: freelancerEmail,
      subject: mailOptions.subject,
      messageId: result.messageId
    });
    
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending freelancer approval email:', error);
    
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

// Send freelancer rejection email
export const sendFreelancerRejectionEmail = async (freelancerEmail, freelancerName, rejectionReason) => {
  try {
    // Validate inputs
    if (!freelancerEmail || !freelancerName) {
      throw new Error('Missing required parameters: freelancerEmail or freelancerName');
    }

    // Check email configuration (at runtime)
    const useResend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0;
    
    if (useResend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend configuration missing: RESEND_API_KEY not set');
      }
    } else {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
      }
    }

    console.log('Preparing to send freelancer rejection email:', {
      to: freelancerEmail,
      freelancerName,
      rejectionReason
    });

    const transporter = createTransporter();
    
    // Verify transporter configuration
    try {
      console.log('Verifying email transporter...');
      await transporter.verify();
      console.log('Email transporter verified successfully');
    } catch (verifyError) {
      console.error('Email transporter verification failed:', verifyError);
      throw new Error('Email service configuration error: ' + verifyError.message);
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>',
      to: freelancerEmail,
      subject: `Your Freelancer Application on AuraCare - Status Update`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AuraCare</h1>
            <p style="color: white; margin: 5px 0;">Beauty Service Platform</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Application Status Update</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hi ${freelancerName},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              We have reviewed your freelancer application on the AuraCare platform.
            </p>
            
            <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
              <p style="color: #c62828; margin: 0; font-weight: bold;">
                ❌ Your application has been <strong>rejected</strong>.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              <strong>Reason:</strong> ${rejectionReason || 'Application did not meet requirements'}
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              If you believe this was done in error or would like to reapply after addressing the issues, please contact our support team.
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

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const result = await transporter.sendMail(mailOptions);
    
    if (!result || !result.messageId) {
      throw new Error('Failed to send email - no message ID returned');
    }
    
    console.log('Freelancer rejection email sent successfully:', result.messageId);
    console.log('Email details:', {
      from: process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>',
      to: freelancerEmail,
      subject: mailOptions.subject,
      messageId: result.messageId
    });
    
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending freelancer rejection email:', error);
    
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