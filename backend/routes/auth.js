import express from 'express';
import {
  register,
  login,
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

// Add debugging middleware for auth routes
router.use((req, res, next) => {
  console.log(`🔍 Auth route accessed: ${req.method} ${req.url}`);
  console.log(`🔍 Request headers:`, req.headers);
  next();
});

// Registration and Login
router.post('/register', register); // Temporarily disable validation
router.post('/login', (req, res, next) => {
  console.log('=== LOGIN ROUTE CALLED ===');
  console.log('Request body:', req.body);
  console.log('Content-Type:', req.headers['content-type']);
  next();
}, login); // Temporarily disable validation

// Password Reset
router.post('/forgot-password', validatePasswordReset, forgotPassword);
router.post('/verify-otp', validateOTP, verifyOTP);
router.post('/reset-password', validateNewPassword, resetPassword);

// Authenticated routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', logout);
router.post('/change-password', authenticateToken, changePassword);
router.post('/refresh-token', refreshToken); // Remove authenticateToken middleware

// Example usage for protected dashboard routes


export default router;