import express from 'express';
import { body } from 'express-validator';
import {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageStatus,
  getPackageStats,
  getCustomerPackages
} from '../controllers/packageController.js';
import { requireSalonOwner } from '../middleware/roleAuth.js';

const router = express.Router();

// Validation rules for package creation/update
const packageValidationRules = [
  body('name').notEmpty().withMessage('Package name is required'),
  body('description').notEmpty().withMessage('Package description is required'),
  body('occasionType').notEmpty().withMessage('Occasion type is required'),
  body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
  body('services.*.serviceId').notEmpty().withMessage('Service ID is required'),
  body('services.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('discountPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount percentage must be between 0 and 100'),
  body('discountedPrice').optional().isFloat({ min: 0 }).withMessage('Discounted price must be positive')
];

// Get all packages for a salon (customer accessible)
router.get('/customer/:salonId/packages', getCustomerPackages);

// Get all packages for a salon
router.get('/:salonId/packages', requireSalonOwner, getPackages);

// Get packages for the authenticated salon owner
router.get('/my-packages', requireSalonOwner, getPackages);

// Get package statistics
router.get('/:salonId/packages/stats', requireSalonOwner, getPackageStats);

// Get a single package
router.get('/packages/:packageId', requireSalonOwner, getPackageById);

// Create a new package
router.post('/:salonId/packages', requireSalonOwner, packageValidationRules, createPackage);

// Update a package
router.put('/packages/:packageId', requireSalonOwner, packageValidationRules, updatePackage);

// Delete a package
router.delete('/packages/:packageId', requireSalonOwner, deletePackage);

// Toggle package active status
router.patch('/packages/:packageId/toggle-status', requireSalonOwner, togglePackageStatus);

export default router;