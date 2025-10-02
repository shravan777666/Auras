import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireSalonOwner } from '../middleware/roleAuth.js';
import {
  getRevenueData,
  getRevenueRecords,
  getRevenueAnalytics
} from '../controllers/revenueController.js';

const router = express.Router();

// All routes require authentication and salon owner role
router.use(authenticateToken);
router.use(requireSalonOwner);

// Get comprehensive revenue data for dashboard
router.get('/data', getRevenueData);

// Get detailed revenue records with pagination
router.get('/records', getRevenueRecords);

// Get revenue analytics for charts
router.get('/analytics', getRevenueAnalytics);

export default router;
