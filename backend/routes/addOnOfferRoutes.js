import express from 'express';
import {
  createAddOnOffer,
  getAddOnOffers,
  getAddOnOfferById,
  updateAddOnOffer,
  toggleAddOnOfferStatus,
  deleteAddOnOffer,
  getActiveOffersForCustomers,
  createAddonSalesRecords
} from '../controllers/addOnOfferController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Salon owner routes (protected)
router.post('/', authenticateToken, createAddOnOffer);
router.get('/', authenticateToken, getAddOnOffers);
router.get('/:id', authenticateToken, getAddOnOfferById);
router.put('/:id', authenticateToken, updateAddOnOffer);
router.patch('/:id/toggle', authenticateToken, toggleAddOnOfferStatus);
router.delete('/:id', authenticateToken, deleteAddOnOffer);

// Create addon sales records after payment (protected)
router.post('/sales/create', authenticateToken, createAddonSalesRecords);

// Public route for customers
router.get('/public/:salonId', getActiveOffersForCustomers);

export default router;
