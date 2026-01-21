import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { sendRegistrationConfirmationEmail } from '../config/email.js';

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
    const validUserTypes = ['customer', 'salon', 'staff', 'admin', 'freelancer'];
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

    const setupCompleted = userType === 'customer' || userType === 'admin' || userType === 'freelancer';

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

    // If freelancer user, also create freelancer profile
    if (userType === 'freelancer') {
      const Freelancer = (await import('../models/Freelancer.js')).default;
      try {
        // Create minimal freelancer profile for initial registration
        // More details will be filled in during the setup process
        const freelancerData = {
          user: user._id,
          name,
          email,
          phone: req.body.phone || '',
          serviceLocation: req.body.serviceLocation || '',
          yearsOfExperience: parseInt(req.body.yearsOfExperience) || 0,
          skills: req.body.skills && Array.isArray(req.body.skills) ? req.body.skills : [],
          setupCompleted: false, // Freelancers need approval before setup is considered complete
          approvalStatus: 'pending', // Set approval status to pending
          isActive: true
        };

        // Initialize address object with empty values
        freelancerData.address = {
          addressLine1: req.body.addressLine1 || '',
          addressLine2: req.body.addressLine2 || '',
          city: req.body.city || '',
          state: req.body.state || '',
          postalCode: req.body.postalCode || '',
          country: req.body.country || 'India',
          fullAddress: req.body.fullAddress || `${req.body.addressLine1 || ''} ${req.body.addressLine2 || ''} ${req.body.city || ''} ${req.body.state || ''} ${req.body.postalCode || ''}`.trim()
        };

        // Add location data if coordinates are provided
        if (req.body.latitude && req.body.longitude) {
          freelancerData.location = {
            type: 'Point',
            coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
            address: req.body.fullAddress || `${req.body.addressLine1 || ''} ${req.body.addressLine2 || ''} ${req.body.city || ''} ${req.body.state || ''} ${req.body.postalCode || ''}`.trim(),
            formattedAddress: req.body.fullAddress || `${req.body.addressLine1 || ''} ${req.body.addressLine2 || ''} ${req.body.city || ''} ${req.body.state || ''} ${req.body.postalCode || ''}`.trim()
          };
        }

        await Freelancer.create(freelancerData);
        console.log('✅ Freelancer profile created successfully for user:', user._id);
      } catch (freelancerError) {
        console.error('❌ Error creating freelancer profile:', freelancerError);
        // If freelancer profile creation fails, delete the user to maintain data consistency
        await User.findByIdAndDelete(user._id);
        throw new Error(`Freelancer profile creation failed: ${freelancerError.message}`);
      }
    }

    // For freelancer, update the user object with freelancer-specific data
    if (userType === 'freelancer') {
      const Freelancer = (await import('../models/Freelancer.js')).default;
      const freelancerProfile = await Freelancer.findOne({ user: user._id });
      if (freelancerProfile) {
        user.setupCompleted = freelancerProfile.setupCompleted;
        user.approvalStatus = freelancerProfile.approvalStatus;
      }
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
      ...(user.type === 'freelancer' && { approvalStatus: 'pending' }), // Freelancers are pending on registration
    };


    // Send registration confirmation email
    try {
      const emailResult = await sendRegistrationConfirmationEmail(email, name, userType);
      if (emailResult.success) {
        console.log('✅ Registration confirmation email sent successfully to:', email);
      } else {
        console.error('❌ Failed to send registration confirmation email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Exception while sending registration confirmation email:', emailError);
    }

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

// Login with email/password and automatic role detection
export const login = async (req, res) => {
  try {
    console.log('=== LOGIN REQUEST RECEIVED ===');
    console.log('Request body:', req.body);
    console.log('Content-Type header:', req.headers['content-type']);
    console.log('Request headers:', req.headers);
    
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password: password ? '[PROVIDED]' : '[MISSING]' });

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return errorResponse(res, 'Email and password are required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return errorResponse(res, 'Invalid email format', 400);
    }

    // Find user by email first to determine their role
    const user = await User.findOne({ email, isActive: true }).select('+password');
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      return errorResponse(res, 'No user found with provided credentials.', 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', email);
      return errorResponse(res, 'Incorrect password.', 401);
    }

    // Handle staff login with special checks
    if (user.type === 'staff') {
      try {
        console.log('=== STAFF LOGIN PATH ===');
        const Staff = (await import('../models/Staff.js')).default;

        // Find the associated Staff profile for business logic checks
        const staffProfile = await Staff.findOne({ user: user._id });
        if (!staffProfile) {
          console.log(`Staff login auth successful for ${email}, but staff profile not found.`);
          return errorResponse(res, 'Login successful, but your staff profile could not be found.', 404);
        }

        // Check approval status from the staff profile
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

        // Success: All checks passed. Sign token and return response.
        const userForToken = {
          _id: user._id,
          email: user.email,
          type: user.type,
          setupCompleted: staffProfile.setupCompleted,
          name: staffProfile.name,
          approvalStatus: staffProfile.approvalStatus,
        };
        const token = signToken(userForToken);
        
        const safeUser = {
          id: user._id.toString(),
          name: staffProfile.name,
          email: user.email,
          type: user.type,
          setupCompleted: staffProfile.setupCompleted,
          approvalStatus: staffProfile.approvalStatus,
        };

        console.log(`Staff login successful for ${email}`);
        return successResponse(res, { token, user: safeUser }, 'Logged in successfully');

      } catch (staffError) {
        console.error('An error occurred during the staff login path:', staffError);
        return errorResponse(res, 'An unexpected error occurred during login.', 500);
      }
    }

    // Handle salon login with special checks
    if (user.type === 'salon') {
      try {
        const Salon = (await import('../models/Salon.js')).default;
        const salon = await Salon.findOne({ ownerId: user._id });
        if (!salon) {
          return errorResponse(res, 'Salon profile not found.', 404);
        }
        
        if (salon.approvalStatus !== 'approved') {
          let message = 'Your salon is not approved for login.';
          if(salon.approvalStatus === 'pending') message = 'Your salon registration is pending approval.';
          if(salon.approvalStatus === 'rejected') message = `Your salon registration has been rejected. Reason: ${salon.rejectionReason || 'No reason provided'}`;
          return errorResponse(res, message, 403);
        }
        
        // Update user with salon-specific data
        user.approvalStatus = salon.approvalStatus;
        user.setupCompleted = salon.setupCompleted;
      } catch (salonError) {
        console.error('An error occurred during salon login path:', salonError);
        return errorResponse(res, 'An unexpected error occurred during login.', 500);
      }
    }
    
    // Handle freelancer login with special checks
    if (user.type === 'freelancer') {
      try {
        const Freelancer = (await import('../models/Freelancer.js')).default;
        const freelancer = await Freelancer.findOne({ user: user._id });
        if (!freelancer) {
          return errorResponse(res, 'Freelancer profile not found.', 404);
        }
        
        // Check approval status from the freelancer profile
        if (freelancer.approvalStatus !== 'approved') {
          let message = 'Your freelancer application is not yet approved for login.';
          if (freelancer.approvalStatus === 'pending') {
            message = 'Your application is still pending approval. Please wait for confirmation from the admin.';
          } else if (freelancer.approvalStatus === 'rejected') {
            message = `Your application was rejected. Reason: ${freelancer.rejectionReason || 'No reason provided'}`;
          }
          console.log(`Freelancer login failed for ${email}: Approval status is '${freelancer.approvalStatus}'.`);
          return errorResponse(res, message, 403);
        }
        
        // Update user with freelancer-specific data
        user.approvalStatus = freelancer.approvalStatus;
        user.setupCompleted = freelancer.setupCompleted;
      } catch (freelancerError) {
        console.error('An error occurred during freelancer login path:', freelancerError);
        return errorResponse(res, 'An unexpected error occurred during login.', 500);
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
    
    if ((user.type === 'salon' || user.type === 'staff' || user.type === 'freelancer') && user.approvalStatus) {
      safeUser.approvalStatus = user.approvalStatus;
    }

    return successResponse(res, { token, user: safeUser }, 'Logged in successfully');
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse(res, 'Login failed: ' + (err.message || 'Unknown error occurred'), 500);
  }
};

// Google OAuth initiation with optional role parameter
export const googleAuth = (req, res, next) => {
  console.log('=== GOOGLE OAUTH AUTHENTICATION INITIATED ===');
  console.log('Google OAuth request received:', {
    query: req.query,
    role: req.query.role,
    session: req.session,
    headers: req.headers
  });
  
  // Store role in session state to pass to callback
  // If no role is provided, we'll determine it after authentication
  if (req.session) {
    req.session.oauthRole = req.query.role || 'customer'; // Default to customer if not provided
    console.log('Stored role in session:', req.session.oauthRole);
  }
  
  // Initiate Google OAuth
  const authParams = {
    scope: ['profile', 'email'],
    state: req.query.role || 'customer' // Pass role as state or default to customer
  };
  
  console.log('Initiating Google OAuth with params:', authParams);
  passport.authenticate('google', authParams)(req, res, next);
};

// Google OAuth callback with automatic role detection
export const googleCallback = async (req, res) => {
  try {
    console.log('=== GOOGLE OAUTH CALLBACK RECEIVED ===');
    console.log('Google OAuth callback received:', {
      user: req.user,
      session: req.session,
      query: req.query,
      headers: req.headers
    });
    
    const user = req.user;
    
    if (!user) {
      console.log('❌ No user found in request');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3008';
      const errorUrl = `${frontendUrl}/auth/callback?error=oauth_failed`;
      console.log('Redirecting to error URL:', errorUrl);
      return res.redirect(errorUrl);
    }

    // Find the user in our database to get their actual role
    const dbUser = await User.findOne({ email: user.email });
    if (!dbUser) {
      console.log('❌ User not found in database:', user.email);
      // If user doesn't exist in our database, we can't authenticate them
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3008';
      const errorUrl = `${frontendUrl}/auth/callback?error=user_not_found`;
      console.log('Redirecting to error URL:', errorUrl);
      return res.redirect(errorUrl);
    }

    // Update the user object with the actual role from database
    user.type = dbUser.type;
    user.setupCompleted = dbUser.setupCompleted;

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
    
    console.log('Redirecting with user data:', {
      token: token ? 'Present' : 'Missing',
      userData: userData
    });
    
    // Redirect to frontend OAuth callback with token and user info
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3008';
    
    // Create a simpler redirect URL without complex query parameters
    // This should help avoid issues with URL encoding and routing
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}&type=${user.type}&setupCompleted=${user.setupCompleted}`;
    
    console.log('Redirecting to frontend callback URL:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3008';
    const errorUrl = `${frontendUrl}/auth/callback?error=oauth_error&message=${encodeURIComponent(error.message)}`;
    console.log('Redirecting to error URL:', errorUrl);
    return res.redirect(errorUrl);
  }
};

// Google OAuth failure handler
export const googleFailure = (req, res) => {
  console.log('=== GOOGLE OAUTH FAILURE ===');
  console.log('Google OAuth failed:', {
    query: req.query,
    session: req.session,
    headers: req.headers
  });
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3008';
  const errorUrl = `${frontendUrl}/auth/callback?error=oauth_cancelled`;
  console.log('Redirecting to error URL:', errorUrl);
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
