import express from 'express';
import {
  getRecentClients,
  getClients,
  getClientRecommendations,
  sendRecommendations,
  getCustomerRecommendations,
  getOneClickBookingPreference
} from '../controllers/recommendationController.js';
import { requireSalonOwner, requireAuth } from '../middleware/roleAuth.js';

const router = express.Router();

// Customer route - requires authentication but not salon owner
router.get('/customer/:customerId', requireAuth, getCustomerRecommendations);

// One-click booking preference route
router.get('/one-click-preference/:customerId', requireAuth, getOneClickBookingPreference);

// All routes below require salon owner authentication
router.use(requireSalonOwner);

// Client routes
router.get('/recent', getRecentClients);
router.get('/clients', getClients);
router.get('/client/:id', getClientRecommendations);
router.post('/send', sendRecommendations);

export default router;