import express from 'express';
import {
  getSalonDashboard,
  getAdminDashboard,
  getStaffPerformance
} from '../controllers/addonDashboardController.js';
import { requireSalonOwner, requireAdmin } from '../middleware/roleAuth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// Custom middleware to allow either admin or salon owner access
const requireAdminOrSalonOwner = (req, res, next) => {
  // Try admin first
  requireAdmin(req, res, (adminErr) => {
    if (!adminErr) {
      // User is admin, continue
      return next();
    }
    
    // If admin check failed, try salon owner
    requireSalonOwner(req, res, (salonErr) => {
      if (!salonErr) {
        // User is salon owner, continue
        return next();
      }
      
      // Both checks failed, return the appropriate error
      return res.status(403).json({ success: false, message: 'Admin or Salon owner access required' });
    });
  });
};

// Salon dashboard routes
router.get('/salon', requireSalonOwner, getSalonDashboard);

// Admin dashboard routes
router.get('/admin', requireAdmin, getAdminDashboard);

// Staff performance routes - accessible to both admins and salon owners
router.get('/staff-performance', requireAdminOrSalonOwner, getStaffPerformance);

export default router;