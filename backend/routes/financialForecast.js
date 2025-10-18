import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireSalonOwner } from '../middleware/roleAuth.js';
import {
  getFinancialForecast,
  trainModel
} from '../controllers/financialForecastController.js';

const router = express.Router();

// All routes require authentication and salon owner role
router.use(authenticateToken);
router.use(requireSalonOwner);

// Get financial forecast for next week
router.get('/forecast', getFinancialForecast);

// Train the model with new data (admin only in real implementation)
router.post('/train', trainModel);

export default router;