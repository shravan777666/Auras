import express from 'express';
import { body } from 'express-validator';
import { 
  requestPasswordReset, 
  verifyOTP, 
  resetPassword, 
  cleanupExpiredOTPs 
} from '../controllers/forgotPasswordController.js';

const router = express.Router();

// Step 1: Request password reset OTP
router.post('/request-reset', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('userType')
    .isIn(['customer', 'staff', 'salon', 'admin'])
    .withMessage('Invalid user type')
], requestPasswordReset);

// Step 2: Verify OTP
router.post('/verify-otp', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  body('userType')
    .isIn(['customer', 'staff', 'salon', 'admin'])
    .withMessage('Invalid user type')
], verifyOTP);

// Step 3: Reset password
router.post('/reset-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('userType')
    .isIn(['customer', 'staff', 'salon', 'admin'])
    .withMessage('Invalid user type')
], resetPassword);

// Admin route: Cleanup expired OTPs
router.delete('/cleanup-expired', cleanupExpiredOTPs);

export default router;
