import express from 'express';
import { 
  getPolicy,
  createOrUpdatePolicy,
  getOwnerPolicies
} from '../controllers/cancellationPolicyController.js';
import { requireAuth, requireSalonOwner } from '../middleware/roleAuth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.route('/:salonId')
  .get(validateObjectId('salonId'), getPolicy);

// Private routes (Salon Owner)
router.route('/')
  .post(requireAuth, requireSalonOwner, createOrUpdatePolicy)
  .get(requireAuth, requireSalonOwner, getOwnerPolicies);

export default router;