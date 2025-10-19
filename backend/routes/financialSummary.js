import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRoles } from '../middleware/roleAuth.js';
import {
  getFinancialSummary,
  getSalonPerformance,
  getRevenueTrend,
  getExpenseBreakdown
} from '../controllers/financialSummaryController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(verifyRoles(['admin']));

// Get comprehensive financial summary
router.get('/summary', getFinancialSummary);

// Get salon performance data
router.get('/salon-performance', getSalonPerformance);

// Get revenue trend data
router.get('/revenue-trend', getRevenueTrend);

// Get expense breakdown data
router.get('/expense-breakdown', getExpenseBreakdown);

export default router;