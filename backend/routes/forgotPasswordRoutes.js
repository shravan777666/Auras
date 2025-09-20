import express from 'express';
import { body, validationResult } from 'express-validator';
import { requestPasswordReset, verifyOTP, resetPassword, cleanupExpiredOTPs } from '../controllers/forgotPasswordController.js';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg
      }))
    });
  }
  next();
};

// Request password reset (send OTP)
router.post('/request-reset', [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email is too long'),
  body('userType')
    .notEmpty()
    .withMessage('User type is required')
    .isIn(['customer', 'staff', 'salon', 'admin'])
    .withMessage('User type must be one of: customer, staff, salon, admin'),
  handleValidationErrors
], requestPasswordReset);

// Verify OTP
router.post('/verify-otp', [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  body('userType')
    .notEmpty()
    .withMessage('User type is required')
    .isIn(['customer', 'staff', 'salon', 'admin'])
    .withMessage('User type must be one of: customer, staff, salon, admin'),
  handleValidationErrors
], verifyOTP);

// Reset password
router.post('/reset-password', [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .isLength({ max: 128 })
    .withMessage('Password is too long'),
  body('userType')
    .notEmpty()
    .withMessage('User type is required')
    .isIn(['customer', 'staff', 'salon', 'admin'])
    .withMessage('User type must be one of: customer, staff, salon, admin'),
  handleValidationErrors
], resetPassword);

// Cleanup expired OTPs (can be called by admin or cron job)
router.delete('/cleanup-expired', cleanupExpiredOTPs);

export default router;
