import express from 'express';
import {
  detectIdleSlots,
  getCustomerHistory,
  predictAddonAcceptance,
  calculateCommission
} from '../controllers/addonController.js';
import { requireSalonOwner, requireAdmin } from '../middleware/roleAuth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// Public routes for ML service to call
router.get('/idle-slots', detectIdleSlots);
router.get('/customer-history', getCustomerHistory);

// POST routes for add-on functionality
router.post('/predict', predictAddonAcceptance);
router.post('/calculate-commission', calculateCommission);

export default router;