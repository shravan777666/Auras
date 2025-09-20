import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import bcrypt from 'bcryptjs';
import passport from 'passport';


// Helper to sign JWT with essential user properties
const signToken = (user) => {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  const payload = {
    id: user._id.toString(),
    email: user.email,
    type: user.type,
    setupCompleted: !!user.setupCompleted,
    name: user.name,
    // Include approvalStatus for salon owners and staff
    approvalStatus: (user.type === 'salon' || user.type === 'staff') ? user.approvalStatus : undefined,
  };
  return jwt.sign(payload, secret, { expiresIn });
};

// Register new user with role
export const register = async (req, res) => {
  try {
    const { email, password, name, userType } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return errorResponse(res, 'Email already in use', 400);
    }

    // Check if salon email is already in Salon collection
    if (userType === 'salon') {
      const Salon = (await import('../models/Salon.js')).default;
      const existingSalon = await Salon.findOne({ email });
      if (existingSalon) {
        return errorResponse(res, 'Email already registered as salon owner', 400);
      }
    }

    const setupCompleted = userType === 'customer' || userType === 'admin';

    const user = await User.create({
      name,
      email,
      password,
      type: userType,
      setupCompleted,
    });

    // If salon owner, also create salon profile
    if (userType === 'salon') {
      const Salon = (await import('../models/Salon.js')).default;
      await Salon.create({
        ownerId: user._id,
        salonName: name, // Use the user's name as initial salon name
        email,
        password, // This will be hashed by the Salon model's pre-save hook
        role: 'salon',
        setupCompleted: false,
        isActive: true
      });
    }

    // If staff user, also create staff profile
    if (userType === 'staff') {
      const Staff = (await import('../models/Staff.js')).default;
      await Staff.create({
        name,
        email,
        user: user._id,
        setupCompleted: false,
        isActive: true
      });
    }

    // If customer user, also create customer profile
    if (userType === 'customer') {
      const Customer = (await import('../models/Customer.js')).default;
      await Customer.create({
        _id: user._id,
        name,
        email,
      });
    }

    const token = signToken(user);

    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      type: user.type,
      setupCompleted: user.setupCompleted,
      ...(user.type === 'salon' && { approvalStatus: 'pending' }), // Salons are pending on registration
      ...(user.type === 'staff' && { approvalStatus: 'pending' }), // Staff are pending on registration
    };

    return successResponse(res, { token, user: safeUser }, 'Registered successfully');
  } catch (err) {
    console.error('Register error:', err);
    return errorResponse(res, 'Registration failed', 500);
  }
};

// Login with email/password and role
export const login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Validate required fields
    if (!email || !password || !userType) {
      return errorResponse(res, 'Email, password, and user type are required', 400);
    }

    // Find user by email and role - first check central User model
    let user = await User.findOne({ email, type: userType, isActive: true });
    let userFromSpecificModel = null;

    // If not found in central User model, check specific model as fallback
    if (!user) {
      console.log(`User not found in central User model, checking ${userType} model...`);
      
      switch (userType) {
        case 'customer':
          const Customer = (await import('../models/Customer.js')).default;
          userFromSpecificModel = await Customer.findOne({ email, isActive: true });
          break;
        case 'salon':
          const Salon = (await import('../models/Salon.js')).default;
          userFromSpecificModel = await Salon.findOne({ email, isActive: true });
          break;
        case 'staff':
          const Staff = (await import('../models/Staff.js')).default;
          userFromSpecificModel = await Staff.findOne({ email, isActive: true });
          break;
        case 'admin':
          const Admin = (await import('../models/Admin.js')).default;
          userFromSpecificModel = await Admin.findOne({ email, isActive: true });
          break;
      }

      if (!userFromSpecificModel) {
        return errorResponse(res, 'No user found with provided credentials and role.', 401);
      }

      // Create a user object compatible with the rest of the login flow
      user = {
        _id: userFromSpecificModel._id,
        name: userFromSpecificModel.name,
        email: userFromSpecificModel.email,
        password: userFromSpecificModel.password,
        type: userType,
        setupCompleted: userFromSpecificModel.setupCompleted || false,
        isActive: userFromSpecificModel.isActive
      };
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Incorrect password.', 401);
    }

    let salon = null; // Declare salon here

    // For salon users, check approval status
    if (userType === 'salon') {
      console.log('=== SALON LOGIN DEBUG ===');
      console.log('User email:', user.email);
      console.log('User type:', userType);
      
      // If we already have salon data from specific model lookup, use it
      if (userFromSpecificModel) {
        salon = userFromSpecificModel;
      } else {
        const Salon = (await import('../models/Salon.js')).default;
        salon = await Salon.findOne({ email: user.email }); // Assign to declared salon
      }
      
      console.log('Salon found:', salon ? {
        id: salon._id,
        salonName: salon.salonName,
        email: salon.email,
        approvalStatus: salon.approvalStatus,
        isVerified: salon.isVerified
      } : 'null');
      
      if (!salon) {
        console.log('Salon profile not found for email:', user.email);
        return errorResponse(res, 'Salon profile not found.', 404);
      }
      
      // Add approvalStatus to the user object before signing the token
      user.approvalStatus = salon.approvalStatus;

      if (salon.approvalStatus === 'rejected') {
        console.log('Salon is rejected');
        return errorResponse(res, `Your salon registration has been rejected. Reason: ${salon.rejectionReason || 'No reason provided'}`, 403);
      }
      
      if (salon.approvalStatus === 'pending') {
        console.log('Salon is still pending');
        return errorResponse(res, 'Your salon registration is still pending approval by admin. Please wait for approval.', 403);
      }
      
      if (salon.approvalStatus !== 'approved') {
        console.log('Salon approval status is not approved:', salon.approvalStatus);
        return errorResponse(res, 'Your salon is not approved for login.', 403);
      }
      
      console.log('Salon approval check passed - login allowed');
    }

    let staff = null; // Declare staff here

    // For staff users, check approval status
    if (userType === 'staff') {
      console.log('=== STAFF LOGIN DEBUG ===');
      console.log('User email:', user.email);
      console.log('User type:', userType);
      
      // If we already have staff data from specific model lookup, use it
      if (userFromSpecificModel) {
        staff = userFromSpecificModel;
      } else {
        const Staff = (await import('../models/Staff.js')).default;
        staff = await Staff.findOne({ email: user.email }); // Find staff profile
      }
      
      console.log('Staff found:', staff ? {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        approvalStatus: staff.approvalStatus,
        isVerified: staff.isVerified,
        setupCompleted: staff.setupCompleted
      } : 'null');
      
      if (!staff) {
        console.log('Staff profile not found for email:', user.email);
        return errorResponse(res, 'Staff profile not found.', 404);
      }
      
      // Add approvalStatus to the user object before signing the token
      user.approvalStatus = staff.approvalStatus;

      if (staff.approvalStatus === 'rejected') {
        console.log('Staff is rejected');
        return errorResponse(res, `Your staff application has been rejected. Reason: ${staff.rejectionReason || 'No reason provided'}`, 403);
      }
      
      if (staff.approvalStatus === 'pending') {
        console.log('Staff is still pending');
        return errorResponse(res, 'Your staff application is still pending approval by admin. Please complete your profile setup and wait for approval.', 403);
      }
      
      if (staff.approvalStatus !== 'approved') {
        console.log('Staff approval status is not approved:', staff.approvalStatus);
        return errorResponse(res, 'Your staff application is not approved for login.', 403);
      }
      
      console.log('Staff approval check passed - login allowed');
    }

    // If everything is valid, sign JWT and return user
    const token = signToken(user);
    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      type: user.type,
      setupCompleted: user.setupCompleted,
    };

    // Conditionally add approvalStatus for salon and staff users
    if ((user.type === 'salon' || user.type === 'staff') && user.approvalStatus) {
      safeUser.approvalStatus = user.approvalStatus;
    }

    return successResponse(res, { token, user: safeUser }, 'Logged in successfully');
  } catch (err) {
    // Log error and return user-friendly message
    console.error('Login error:', err);
    return errorResponse(res, err.message || 'Login failed', 500);
  }
};

// Google OAuth initiation with role parameter
export const googleAuth = (req, res, next) => {
  const { role } = req.query;
  
  if (!role || !['customer', 'salon', 'staff'].includes(role)) {
    return errorResponse(res, 'Valid role parameter (customer, salon, staff) is required', 400);
  }

  // Store role in session state to pass to callback
  req.session.oauthRole = role;
  
  // Initiate Google OAuth with role as state parameter
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: role
  })(req, res, next);
};

// Google OAuth callback with role-based redirection
export const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/auth/callback?error=oauth_failed`);
    }

    // Generate JWT token
    const token = signToken(user);
    
    // Redirect to frontend OAuth callback with token and user info
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      type: user.type,
      setupCompleted: user.setupCompleted,
      avatar: user.avatar
    };
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
    
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const errorUrl = `${frontendUrl}/auth/callback?error=oauth_error`;
    return res.redirect(errorUrl);
  }
};

// Google OAuth failure handler
export const googleFailure = (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const errorUrl = `${frontendUrl}/auth/callback?error=oauth_cancelled`;
  return res.redirect(errorUrl);
};

export const getCurrentUser = async (req, res) => {
  // req.user is decoded from token by authenticateToken middleware
  return successResponse(res, { user: req.user }, 'Current user');
};

import TokenBlacklist from '../models/TokenBlacklist.js';

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const alreadyBlacklisted = await TokenBlacklist.findOne({ token });
      if (!alreadyBlacklisted) {
        await TokenBlacklist.create({ token });
      }
    }

    return successResponse(res, {}, 'Logged out successfully');
  } catch (err) {
    console.error('Logout error:', err);
    return errorResponse(res, 'Logout failed', 500);
  }
};

export const forgotPassword = async (req, res) => {
  return successResponse(res, {}, 'OTP sent');
};

export const verifyOTP = async (req, res) => {
  return successResponse(res, {}, 'OTP verified');
};

export const resetPassword = async (req, res) => {
  return successResponse(res, {}, 'Password reset');
};

export const changePassword = async (req, res) => {
  return successResponse(res, {}, 'Password changed');
};

export const refreshToken = async (req, res) => {
  const old = req.user;
  if (!old) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const token = signToken(old);
  return successResponse(res, { token }, 'Token refreshed');
};

export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};