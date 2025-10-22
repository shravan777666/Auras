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
  };
  return jwt.sign(payload, secret, { expiresIn });
};

// Register new user with role
export const register = async (req, res) => {
  try {
    console.log('🔍 Registration request received:', {
      body: req.body,
      headers: req.headers['content-type']
    });
    
    const { email, password, name, userType } = req.body;

    // Validate required fields
    if (!email || !password || !name || !userType) {
      return errorResponse(res, 'All fields are required: name, email, password, userType', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'Invalid email format', 400);
    }

    // Validate password length
    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters long', 400);
    }

    // Validate userType
    const validUserTypes = ['customer', 'salon', 'staff', 'admin'];
    if (!validUserTypes.includes(userType)) {
      return errorResponse(res, 'Invalid user type', 400);
    }

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
    
    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return errorResponse(res, `Validation error: ${validationErrors.join(', ')}`, 400);
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return errorResponse(res, `${field} already exists`, 400);
    }
    
    return errorResponse(res, 'Registration failed', 500);
  }
};

// Login with email/password and role
export const login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    console.log('Login attempt:', { email, userType });

    if (!email || !password || !userType) {
      return errorResponse(res, 'Email, password, and user type are required', 400);
    }

    // Refactored path for staff login for clarity and robustness
    if (userType === 'staff') {
      try {
        console.log('=== STAFF LOGIN REFACTORED PATH ===');
        const Staff = (await import('../models/Staff.js')).default;

        // 1. Find the central User record, which is the source of truth for auth
        const centralUser = await User.findOne({ email, type: 'staff' }).select('+password');
        if (!centralUser) {
          console.log(`Staff login failed for ${email}: Central user record not found.`);
          return errorResponse(res, 'Authentication failed. User not found.', 401);
        }

        if (!centralUser.isActive) {
          console.log(`Staff login failed for ${email}: User account is inactive.`);
          return errorResponse(res, 'Your account is inactive. Please contact support.', 403);
        }

        if (!centralUser.password) {
          console.log(`Staff login failed for ${email}: No password set for user (e.g., social login).`);
          return errorResponse(res, 'Authentication failed. No password set for this account.', 401);
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, centralUser.password);
        if (!isMatch) {
          console.log(`Staff login failed for ${email}: Incorrect password.`);
          return errorResponse(res, 'Authentication failed. Incorrect password.', 401);
        }

        // 3. Find the associated Staff profile for business logic checks
        const staffProfile = await Staff.findOne({ user: centralUser._id });
        if (!staffProfile) {
          console.log(`Staff login auth successful for ${email}, but staff profile not found.`);
          return errorResponse(res, 'Login successful, but your staff profile could not be found.', 404);
        }

        // 4. Check approval status from the staff profile
        if (staffProfile.approvalStatus !== 'approved') {
          let message = 'Your staff application is not yet approved for login.';
          if (staffProfile.approvalStatus === 'pending') {
            message = 'Your application is still pending approval. Please complete your profile and wait for confirmation.';
          } else if (staffProfile.approvalStatus === 'rejected') {
            message = `Your application was rejected. Reason: ${staffProfile.rejectionReason || 'No reason provided'}`;
          }
          console.log(`Staff login failed for ${email}: Approval status is '${staffProfile.approvalStatus}'.`);
          return errorResponse(res, message, 403);
        }

        // 5. Success: All checks passed. Sign token and return response.
        const userForToken = {
          _id: centralUser._id,
          email: centralUser.email,
          type: centralUser.type,
          setupCompleted: staffProfile.setupCompleted,
          name: staffProfile.name,
          approvalStatus: staffProfile.approvalStatus,
        };
        const token = signToken(userForToken);
        
        const safeUser = {
          id: centralUser._id.toString(),
          name: staffProfile.name,
          email: centralUser.email,
          type: centralUser.type,
          setupCompleted: staffProfile.setupCompleted,
          approvalStatus: staffProfile.approvalStatus,
        };

        console.log(`Staff login successful for ${email}`);
        return successResponse(res, { token, user: safeUser }, 'Logged in successfully');

      } catch (staffError) {
        console.error('An error occurred during the refactored staff login path:', staffError);
        return errorResponse(res, 'An unexpected error occurred during login.', 500);
      }
    }

    // --- Original logic for other user types (customer, salon, admin) ---
    let user = null;
    let specificModelUser = null;

    try {
      switch (userType) {
        case 'customer':
          const Customer = (await import('../models/Customer.js')).default;
          specificModelUser = await Customer.findOne({ email, isActive: true });
          break;
        case 'salon':
          const Salon = (await import('../models/Salon.js')).default;
          specificModelUser = await Salon.findOne({ email, isActive: true });
          break;
        case 'admin':
          const Admin = (await import('../models/Admin.js')).default;
          specificModelUser = await Admin.findOne({ email, isActive: true });
          break;
        default:
          return errorResponse(res, 'Invalid user type provided.', 400);
      }
    } catch (importError) {
      console.error('Model import error:', importError);
      return errorResponse(res, 'System error occurred during authentication.', 500);
    }

    if (!specificModelUser) {
      user = await User.findOne({ email, type: userType, isActive: true }).select('+password');
      if (!user) {
        return errorResponse(res, 'No user found with provided credentials and role.', 401);
      }
    } else {
      let centralUser = null;
      try {
        if (specificModelUser.ownerId) {
          centralUser = await User.findById(specificModelUser.ownerId).select('+password');
        } else {
          centralUser = await User.findOne({ email: specificModelUser.email, type: userType }).select('+password');
        }
      } catch (dbError) {
        console.error('Database error when finding central user:', dbError);
        return errorResponse(res, 'System error occurred during authentication.', 500);
      }

      if (!centralUser) {
        return errorResponse(res, 'Associated central user not found.', 401);
      }

      user = {
        _id: userType === 'customer' ? specificModelUser._id : centralUser._id,
        name: specificModelUser.name,
        email: specificModelUser.email,
        password: centralUser.password,
        type: userType,
        setupCompleted: specificModelUser.setupCompleted || false,
        isActive: specificModelUser.isActive,
        approvalStatus: specificModelUser.approvalStatus || undefined,
      };
    }

    if (!user.password) {
        return errorResponse(res, 'Authentication failed. No password set for this account.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Incorrect password.', 401);
    }

    if (userType === 'salon') {
        const Salon = (await import('../models/Salon.js')).default;
        const salon = specificModelUser || await Salon.findOne({ email: user.email });
        if (!salon) {
          return errorResponse(res, 'Salon profile not found.', 404);
        }
        user.approvalStatus = salon.approvalStatus;
        if (salon.approvalStatus !== 'approved') {
          let message = 'Your salon is not approved for login.';
          if(salon.approvalStatus === 'pending') message = 'Your salon registration is pending approval.';
          if(salon.approvalStatus === 'rejected') message = `Your salon registration has been rejected. Reason: ${salon.rejectionReason || 'No reason provided'}`;
          return errorResponse(res, message, 403);
        }
    }

    const token = signToken(user);
    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      type: user.type,
      setupCompleted: user.setupCompleted,
    };
    if ((user.type === 'salon' || user.type === 'staff') && user.approvalStatus) {
      safeUser.approvalStatus = user.approvalStatus;
    }

    return successResponse(res, { token, user: safeUser }, 'Logged in successfully');
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse(res, 'Login failed: ' + (err.message || 'Unknown error occurred'), 500);
  }
};

// Google OAuth initiation with role parameter
export const googleAuth = (req, res, next) => {
  console.log('Google OAuth request received:', {
    query: req.query,
    role: req.query.role,
    session: req.session
  });
  
  const { role } = req.query;
  
  if (!role || !['customer', 'salon', 'staff'].includes(role)) {
    console.log('Invalid role parameter:', role);
    return res.status(400).json({
      success: false,
      message: 'Valid role parameter (customer, salon, staff) is required'
    });
  }

  // Store role in session state to pass to callback
  if (req.session) {
    req.session.oauthRole = role;
    console.log('Stored role in session:', role);
  }
  
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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3007';
      return res.redirect(`${frontendUrl}/auth/callback?error=oauth_failed`);
    }

    // Generate JWT token
    const token = signToken(user);
    
    // Prepare user data for frontend
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      type: user.type,
      setupCompleted: user.setupCompleted,
      avatar: user.avatar
    };
    
    // Redirect to frontend OAuth callback with token and user info
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3007';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
    
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3007';
    const errorUrl = `${frontendUrl}/auth/callback?error=oauth_error`;
    return res.redirect(errorUrl);
  }
};

// Google OAuth failure handler
export const googleFailure = (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3007';
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
  try {
    // Get token from Authorization header or request body
    let token = null;
    
    // Check Authorization header first
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If not in header, check request body
    if (!token && req.body && req.body.refreshToken) {
      token = req.body.refreshToken;
    }
    
    // If no token provided at all
    if (!token) {
      return errorResponse(res, 'No token provided', 401);
    }
    
    // Verify the token
    try {
      const secret = process.env.JWT_SECRET || 'dev_secret';
      
      // Verify the token but ignore expiration for refresh
      const payload = jwt.verify(token, secret, { ignoreExpiration: true });
      
      // Remove old expiration and issued-at fields
      const { exp, iat, ...cleanPayload } = payload;
      
      // Create a new token with the same payload but new expiration
      const newToken = jwt.sign(cleanPayload, secret, { 
        expiresIn: process.env.JWT_EXPIRE || '7d' 
      });
      
      return successResponse(res, { token: newToken }, 'Token refreshed successfully');
    } catch (err) {
      // Any error other than expiration should be treated as invalid
      if (err.name === 'JsonWebTokenError') {
        return errorResponse(res, 'Invalid token', 401);
      }
      // Log other unexpected errors
      console.error('Token refresh verification error:', err);
      return errorResponse(res, 'Token verification failed', 401);
    }
  } catch (err) {
    console.error('Token refresh error:', err);
    return errorResponse(res, 'Failed to refresh token', 500);
  }
};

export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};
