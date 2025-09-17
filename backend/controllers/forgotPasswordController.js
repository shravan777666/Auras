import bcrypt from 'bcryptjs';
import OTP from '../models/OTP.js';
import Customer from '../models/Customer.js';
import Staff from '../models/Staff.js';
import Salon from '../models/Salon.js';
import Admin from '../models/Admin.js';
import { sendOTPEmail, generateOTP } from '../config/email.js';
import { successResponse, errorResponse } from '../utils/responses.js';

// Wrapper to ensure all async functions return JSON responses
const safeAsyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('=== ASYNC HANDLER ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    // Ensure we haven't already sent a response
    if (res.headersSent) {
      console.error('Headers already sent, cannot send error response');
      return next(error);
    }
    
    // Always return JSON error response
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  });
};

// Helper function to find user by email and type
const findUserByEmailAndType = async (email, userType) => {
  let user = null;
  let model = null;

  switch (userType) {
    case 'customer':
      model = Customer;
      user = await Customer.findOne({ email: email.toLowerCase(), type: userType, isActive: true });
      break;
    case 'staff':
      model = Staff;
      user = await Staff.findOne({ email: email.toLowerCase(), type: userType, isActive: true });
      break;
    case 'salon':
      model = Salon;
      user = await Salon.findOne({ email: email.toLowerCase(), type: userType, isActive: true });
      break;
    case 'admin':
      model = Admin;
      user = await Admin.findOne({ email: email.toLowerCase(), type: userType, isActive: true });
      break;
    default:
      return { user: null, model: null };
  }

  return { user, model };
};

// Step 1: Request OTP for password reset
export const requestPasswordReset = async (req, res) => {
  try {
    console.log('=== REQUEST PASSWORD RESET ===');
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);

    // Parse JSON body if not already parsed
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        console.error('Failed to parse JSON body:', parseError);
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON in request body'
        });
      }
    }

    const { email, userType } = body;

    // Validate email input
    if (!email) {
      console.log('Validation failed: missing email');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate userType
    if (!userType) {
      console.log('Validation failed: missing userType');
      return res.status(400).json({
        success: false,
        message: 'User type is required'
      });
    }

    if (!['customer', 'staff', 'salon', 'admin'].includes(userType)) {
      console.log('Validation failed: invalid userType:', userType);
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Must be customer, staff, salon, or admin'
      });
    }

    // Check if user exists in database
    console.log('Finding user by email and type...');
    console.log('Email to search:', email.toLowerCase());
    console.log('User type:', userType);
    
    const { user, model: UserModel } = await findUserByEmailAndType(email, userType);

    console.log('Final user search result:', user ? 'Found' : 'Not found');

    if (!user) {
      console.log('User not found, returning 404');
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Generate OTP (6-digit number)
    console.log('Generating OTP...');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('OTP generated:', otp);

    // Clean up any existing OTPs for this user
    try {
      console.log('Deleting existing OTPs...');
      await OTP.deleteMany({ email: email.toLowerCase(), userType });
    } catch (cleanupError) {
      console.error('Error cleaning up existing OTPs:', cleanupError);
      // Continue anyway - this is not critical
    }

    // Create new OTP record
    console.log('Creating new OTP record...');
    let otpRecord;
    try {
      otpRecord = new OTP({
        email: email.toLowerCase(),
        otp,
        userType,
        userId: user._id,
        isUsed: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
      });

      await otpRecord.save();
      console.log('OTP record saved to database');
    } catch (saveError) {
      console.error('Error saving OTP record:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate reset token'
      });
    }

    // Send OTP via email
    console.log('Sending OTP email...');
    
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration missing - development mode');
      return res.status(200).json({
        success: true,
        message: `Development mode: Your OTP is ${otp}`,
        data: { 
          otp: otp, // Only for development
          expiresIn: '5 minutes'
        }
      });
    }

    // Send email with proper error handling
    let emailResult;
    try {
      emailResult = await sendOTPEmail(email.toLowerCase(), otp, userType);
      console.log('Email result:', emailResult);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Clean up OTP record if email failed
      try {
        await OTP.deleteOne({ _id: otpRecord._id });
      } catch (cleanupError) {
        console.error('Failed to cleanup OTP record after email failure:', cleanupError);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.'
      });
    }

    // Check if email was sent successfully
    if (!emailResult || !emailResult.success) {
      console.log('Email sending failed');
      
      // Clean up OTP record if email failed
      try {
        await OTP.deleteOne({ _id: otpRecord._id });
      } catch (cleanupError) {
        console.error('Failed to cleanup OTP record after email failure:', cleanupError);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please check your email address and try again.'
      });
    }

    console.log(`OTP sent successfully to ${email} for ${userType}`);

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Password reset OTP has been sent to your email address',
      data: {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for security
        expiresIn: '5 minutes'
      }
    });

  } catch (error) {
    // Catch any unexpected errors
    console.error('Unexpected error in requestPasswordReset:', error);
    console.error('Error stack:', error.stack);
    
    // Ensure we haven't already sent a response
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred. Please try again later.'
      });
    }
  }
};

// Step 2: Verify OTP
export const verifyOTP = safeAsyncHandler(async (req, res) => {
  const { email, otp, userType } = req.body;

  // Validate input
  if (!email || !otp || !userType) {
    return errorResponse(res, 'Email, OTP, and user type are required', 400);
  }

  try {
    // Find valid OTP record
    const otpRecord = await OTP.findOne({
      email,
      otp,
      userType,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return errorResponse(res, 'Invalid or expired OTP', 400);
    }

    // Mark OTP as used (but don't delete yet - we'll delete after password reset)
    otpRecord.isUsed = true;
    await otpRecord.save();

    return successResponse(res, 
      { 
        message: 'OTP verified successfully'
      }, 
      'OTP verified. You can now reset your password.'
    );

  } catch (error) {
    console.error('Error in verifyOTP:', error);
    return errorResponse(res, 'Failed to verify OTP', 500);
  }
});

// Step 3: Reset password
export const resetPassword = safeAsyncHandler(async (req, res) => {
  const { email, otp, newPassword, userType } = req.body;

  // Validate input
  if (!email || !otp || !newPassword || !userType) {
    return errorResponse(res, 'All fields are required', 400);
  }

  if (newPassword.length < 6) {
    return errorResponse(res, 'Password must be at least 6 characters long', 400);
  }

  try {
    // Verify OTP record exists and is used (verified)
    const otpRecord = await OTP.findOne({
      email,
      otp,
      userType,
      isUsed: true,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return errorResponse(res, 'Invalid or expired reset session', 400);
    }

    // Find user
    const { user, model } = await findUserByEmailAndType(email, userType);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await model.findByIdAndUpdate(user._id, { 
      password: hashedPassword,
      updatedAt: new Date()
    });

    // Delete the OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Also clean up any other OTPs for this user
    await OTP.deleteMany({ email, userType });

    console.log(`Password reset successful for ${email} (${userType})`);

    return successResponse(res, 
      { 
        message: 'Password reset successful'
      }, 
      'Your password has been reset successfully. You can now login with your new password.'
    );

  } catch (error) {
    console.error('Error in resetPassword:', error);
    return errorResponse(res, 'Failed to reset password', 500);
  }
});

// Helper: Clean up expired OTPs (can be called periodically)
export const cleanupExpiredOTPs = safeAsyncHandler(async (req, res) => {
  try {
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    console.log(`Cleaned up ${result.deletedCount} expired OTP records`);

    return successResponse(res, 
      { deletedCount: result.deletedCount }, 
      'Expired OTPs cleaned up successfully'
    );
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return errorResponse(res, 'Failed to cleanup expired OTPs', 500);
  }
});