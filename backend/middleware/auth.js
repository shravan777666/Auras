import jwt from 'jsonwebtoken';
import TokenBlacklist from '../models/TokenBlacklist.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const blacklistedToken = await TokenBlacklist.findOne({ token });
    if (blacklistedToken) {
      return res.status(401).json({ success: false, message: 'Token is blacklisted' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Role-based access control middleware
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.type !== role) {
      return res.status(403).json({ success: false, message: `Access denied: ${role} only.` });
    }
    next();
  };
};