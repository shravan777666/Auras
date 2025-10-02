import express from 'express';
import passport from 'passport';
import {
  register,
  login,
  googleCallback,
  getCurrentUser,
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  refreshToken
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validateOTP,
  validateNewPassword
} from '../middleware/validation.js';

const router = express.Router();

// Registration and Login
router.post('/register', register); // Temporarily disable validation
router.post('/login', login); // Temporarily disable validation

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  googleCallback
);

// Password Reset
router.post('/forgot-password', validatePasswordReset, forgotPassword);
router.post('/verify-otp', validateOTP, verifyOTP);
router.post('/reset-password', validateNewPassword, resetPassword);

// Authenticated routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);
router.post('/change-password', authenticateToken, changePassword);
router.post('/refresh-token', authenticateToken, refreshToken);

// Example usage for protected dashboard routes


export default router;