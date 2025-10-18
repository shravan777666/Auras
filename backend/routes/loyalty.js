import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireCustomer, requireSalonOwner } from '../middleware/roleAuth.js';
import {
  redeemPoints,
  getCustomerLoyaltyDetails,
  getLoyaltyDashboardMetrics,
  getTopLoyaltyCustomers
} from '../controllers/loyaltyController.js';

const router = express.Router();

// Customer routes
router.use('/customer', authenticateToken, requireCustomer);

// Redeem points for an appointment
router.post('/customer/redeem', redeemPoints);

// Get customer loyalty details
router.get('/customer/:customerId/details', getCustomerLoyaltyDetails);

// Salon owner routes
router.use('/salon', authenticateToken, requireSalonOwner);

// Get loyalty dashboard metrics
router.get('/salon/dashboard-metrics', getLoyaltyDashboardMetrics);

// Get top loyalty customers
router.get('/salon/top-customers', getTopLoyaltyCustomers);

export default router;