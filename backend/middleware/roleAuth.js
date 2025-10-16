import { authenticateToken } from './auth.js';
import User from '../models/User.js';

// Auth and role guards
export const requireAuth = (req, res, next) => {
  return authenticateToken(req, res, next);
};

export const requireCustomer = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    if (req.user.type !== 'customer') {
      return res.status(403).json({ success: false, message: 'Customer access required' });
    }
    next();
  });
};

export const requireStaff = (req, res, next) => {
  authenticateToken(req, res, async (err) => {
    if (err) return next(err);
    try {
      const user = await User.findById(req.user.id);
      if (!user || user.type !== 'staff') {
        return res.status(403).json({ success: false, message: 'Staff access required' });
      }
      // attach fresh user record
      req.currentUser = user;
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error verifying staff access' });
    }
  });
};

export const requireStaffSetup = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.type !== 'staff') return res.status(403).json({ success: false, message: 'Staff access required' });
    if (!user.setupCompleted) {
      return res.status(403).json({ success: false, message: 'Staff setup required' });
    }
    // attach fresh user record
    req.currentUser = user;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error checking setup status' });
  }
};

export const requireSalonOwner = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    if (req.user.type !== 'salon') {
      return res.status(403).json({ success: false, message: 'Salon owner access required' });
    }
    next();
  });
};

export const requireSalonSetup = async (req, res, next) => {
  try {
    console.log('requireSalonSetup - checking user:', req.user.id);
    const user = await User.findById(req.user.id);
    console.log('requireSalonSetup - user found:', user ? { id: user._id, type: user.type, setupCompleted: user.setupCompleted } : 'null');
    
    if (!user) {
      console.log('requireSalonSetup - User not found');
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    if (user.type !== 'salon') {
      console.log('requireSalonSetup - Invalid user type:', user.type);
      return res.status(403).json({ success: false, message: 'Salon owner access required' });
    }
    
    if (!user.setupCompleted) {
      console.log('requireSalonSetup - Setup not completed');
      return res.status(403).json({ success: false, message: 'Salon setup required' });
    }
    
    console.log('requireSalonSetup - All checks passed');
    next();
  } catch (error) {
    console.error('requireSalonSetup - Error:', error);
    return res.status(500).json({ success: false, message: 'Error checking setup status' });
  }
};

// Role verification middleware
export const verifyRoles = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authenticateToken middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    // Check if user role is in allowed roles
    const userRole = req.user.type;
    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }
  };
};
