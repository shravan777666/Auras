import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireSalonOwner } from '../middleware/roleAuth.js';
import { getExpenseForecast } from '../controllers/expenseForecastController.js';

const router = express.Router();

// All routes require authentication and salon owner role
router.use(authenticateToken);
router.use(requireSalonOwner);

// Get expense forecast for next month
router.post('/forecast', getExpenseForecast);

export default router;