import express from 'express';
import {
  createService,
  getSalonServices,
  getServiceDetails,
  updateService,
  deleteService,
  assignStaff,
  getCategories,
  getPopularServices,
  searchServices,
  getServiceCatalog
} from '../controllers/serviceController.js';
import { requireSalonOwner, requireAuth } from '../middleware/roleAuth.js';
import { validateService, validatePagination, validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/categories', getCategories);
router.get('/popular', getPopularServices);
router.get('/search', validatePagination, searchServices);
router.get('/catalog', getServiceCatalog);
router.get('/:serviceId', validateObjectId('serviceId'), getServiceDetails);

// Routes requiring authentication
router.get('/salon/:salonId', requireAuth, validateObjectId('salonId'), getSalonServices);

// Salon owner only routes
router.post('/', requireSalonOwner, validateService, createService);
router.get('/my/services', requireSalonOwner, validatePagination, getSalonServices);
router.patch('/:serviceId', requireSalonOwner, validateObjectId('serviceId'), updateService);
router.delete('/:serviceId', requireSalonOwner, validateObjectId('serviceId'), deleteService);
router.post('/:serviceId/assign-staff', 
  requireSalonOwner, 
  validateObjectId('serviceId'), 
  assignStaff
);

export default router;