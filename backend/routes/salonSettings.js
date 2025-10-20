import express from 'express';
import {
  getSalonSettings,
  updateSalonSettings,
  getAllSalonSettings
} from '../controllers/salonSettingsController.js';
import { requireSalonOwner, requireAdmin } from '../middleware/roleAuth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// Admin routes
router.get('/', requireAdmin, getAllSalonSettings);
router.get('/:salonId', requireAdmin, validateObjectId('salonId'), getSalonSettings);
router.put('/:salonId', requireAdmin, validateObjectId('salonId'), updateSalonSettings);

// Salon owner routes
router.get('/me', requireSalonOwner, getSalonSettings);
router.put('/me', requireSalonOwner, updateSalonSettings);

export default router;