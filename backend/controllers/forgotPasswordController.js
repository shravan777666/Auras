import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import OTP from '../models/OTP.js';
import Customer from '../models/Customer.js';
import Staff from '../models/Staff.js';
import Salon from '../models/Salon.js';
import Admin from '../models/Admin.js';
import { sendOTPEmail, generateOTP } from '../config/email.js';
import { successResponse, errorResponse } from '../utils/responses.js';

// Helper function to find user by email and type
const findUserByEmailAndType = async (email, userType) => {
  let user = null;
  let model = null;

  try {
    switch (userType) {
      case 'customer':
        model = Customer;
        break;
      case 'staff':
        model = Staff;
        break;
      case 'salon':
        model = Salon;
        break;
      case 'admin':
        model = Admin;
        break;
      default:
        return { user: null, model: null };
    }
    
    // Search for user with proper error handling
    user = await model.findOne({ 
      email: email.toLowerCase(), 
      isActive: true 
    });
    
    return { user, model };
  } catch (error) {
    console.error(`Error finding ${userType} with email ${email}:`, error);
    throw error; // Re-throw to be handled by calling function
  }
};

// Step 1: Request OTP for password reset
export const requestPasswordReset = async (req, res) => {
  try {
    // Handle validation errors first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, userType } = req.body;

    // Validate required fields explicitly
    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email and user type are required'
      });
    }

    // Validate userType
    const validUserTypes = ['customer', 'staff', 'salon', 'admin'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Must be one of: customer, staff, salon, admin'
      });
    }

    // Find user with proper error handling
    let user, model;
    try {
      const result = await findUserByEmailAndType(email, userType);
      user = result.user;
      model = result.model;
    } catch (dbError) {
      console.error('Database error in findUserByEmailAndType:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }

    if (!user) {
      return res.status(200).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Generate OTP (6-digit number)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up any existing OTPs for this user with error handling
    try {
      await OTP.deleteMany({ email: email.toLowerCase(), userType });
    } catch (cleanupError) {
      console.warn('Warning: Failed to cleanup existing OTPs:', cleanupError);
      // Continue execution - this is not critical
    }

    // Create new OTP record
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
    } catch (otpSaveError) {
      console.error('Error saving OTP record:', otpSaveError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate reset token. Please try again later.'
      });
    }

    // Send OTP via email
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

    // Log OTP for debugging (remove in production)
    console.log(`🔑 OTP for ${email}: ${otp}`);

    let emailResult;
    try {
      emailResult = await sendOTPEmail(email.toLowerCase(), otp, userType);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      // Clean up the OTP record if email fails
      try {
        await OTP.deleteOne({ _id: otpRecord._id });
      } catch (cleanupError) {
        console.error('Failed to cleanup OTP after email error:', cleanupError);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please check your email address and try again.'
      });
    }

    if (!emailResult || !emailResult.success) {
      // Clean up the OTP record if email sending failed
      try {
        await OTP.deleteOne({ _id: otpRecord._id });
      } catch (cleanupError) {
        console.error('Failed to cleanup OTP after email failure:', cleanupError);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please check your email address and try again.'
      });
    }

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
    console.error('Unexpected error in requestPasswordReset:', error);
    
    // Check if it's a database connection error
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data provided. Please check your input and try again.'
      });
    }
    
    // Generic server error
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
};

// Step 2: Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    // Handle validation errors first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp, userType } = req.body;

    // Validate input explicitly
    if (!email || !otp || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and user type are required'
      });
    }

    // Find valid OTP record with error handling
    let otpRecord;
    try {
      otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        otp,
        userType,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });
    } catch (dbError) {
      console.error('Database error in verifyOTP:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }

    if (!otpRecord) {
      console.log(`❌ OTP verification failed for ${email}: OTP ${otp} not found or expired`);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark OTP as used (but don't delete yet - we'll delete after password reset)
    try {
      otpRecord.isUsed = true;
      await otpRecord.save();
    } catch (saveError) {
      console.error('Error saving OTP verification:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify OTP. Please try again.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        message: 'OTP verified. You can now reset your password.'
      }
    });

  } catch (error) {
    console.error('Unexpected error in verifyOTP:', error);
    
    // Check if it's a database connection error
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }
    
    // Generic server error
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again later.'
    });
  }
};

// Step 3: Reset password
export const resetPassword = async (req, res) => {
  try {
    // Handle validation errors first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp, newPassword, userType } = req.body;

    // Validate required fields explicitly
    if (!email || !otp || !newPassword || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, new password, and user type are required'
      });
    }

    // Verify OTP record exists and is used (verified) with error handling
    let otpRecord;
    try {
      otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        otp,
        userType,
        isUsed: true,
        expiresAt: { $gt: new Date() }
      });
    } catch (dbError) {
      console.error('Database error finding OTP record:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset session'
      });
    }

    // Find user with error handling
    let user, model;
    try {
      const result = await findUserByEmailAndType(email, userType);
      user = result.user;
      model = result.model;
    } catch (dbError) {
      console.error('Database error finding user:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user password with error handling
    try {
      // Update the specific model (Customer, Salon, Staff, Admin)
      // Use findById and save() to trigger pre-save hooks for password hashing
      const userDoc = await model.findById(user._id);
      if (!userDoc) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      userDoc.password = newPassword; // This will trigger the pre-save hook to hash the password
      userDoc.updatedAt = new Date();
      await userDoc.save();

      // Also update the central User model if it exists
      const User = (await import('../models/User.js')).default;
      const centralUser = await User.findOne({ email: email.toLowerCase() });
      if (centralUser) {
        centralUser.password = newPassword; // This will trigger the pre-save hook to hash the password
        centralUser.updatedAt = new Date();
        await centralUser.save();
        console.log(`✅ Updated password in both ${userType} model and central User model for ${email}`);
      } else {
        console.log(`✅ Updated password in ${userType} model for ${email}`);
      }
    } catch (updateError) {
      console.error('Error updating user password:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update password. Please try again.'
      });
    }

    // Delete the OTP record and cleanup with error handling
    try {
      await OTP.deleteOne({ _id: otpRecord._id });
      // Also clean up any other OTPs for this user
      await OTP.deleteMany({ email: email.toLowerCase(), userType });
    } catch (cleanupError) {
      console.warn('Warning: Failed to cleanup OTP records:', cleanupError);
      // Don't fail the request if cleanup fails
    }

    console.log(`Password reset successful for ${email} (${userType})`);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: {
        message: 'Your password has been reset successfully. You can now login with your new password.'
      }
    });

  } catch (error) {
    console.error('Unexpected error in resetPassword:', error);
    
    // Check if it's a database connection error
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data provided. Please check your input and try again.'
      });
    }
    
    // Generic server error
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again later.'
    });
  }
};

// Helper: Clean up expired OTPs (can be called periodically)
export const cleanupExpiredOTPs = async (req, res) => {
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
};