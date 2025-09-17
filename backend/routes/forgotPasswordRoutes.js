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
      errors: errors.array()
    });
  }
  next();
};

// Request password reset (send OTP)
router.post('/request-reset', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('userType').isIn(['customer', 'staff', 'salon', 'admin']).withMessage('Valid user type is required'),
  handleValidationErrors
], requestPasswordReset);

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('userType').isIn(['customer', 'staff', 'salon', 'admin']).withMessage('Valid user type is required'),
  handleValidationErrors
], verifyOTP);

// Reset password
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('userType').isIn(['customer', 'staff', 'salon', 'admin']).withMessage('Valid user type is required'),
  handleValidationErrors
], resetPassword);

// Cleanup expired OTPs (can be called by admin or cron job)
router.delete('/cleanup-expired', cleanupExpiredOTPs);

export default router;
