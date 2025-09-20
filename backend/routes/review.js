import express from 'express';
import { requireCustomer } from '../middleware/roleAuth.js';
import {
  validateCreateReview,
  validateListReviews,
  validateObjectId,
  validatePagination,
} from '../middleware/validation.js';
import {
  createReview,
  listReviewsBySalon,
  getSalonReviewSummary,
} from '../controllers/reviewController.js';

const router = express.Router();

// Create a review (customer only)
router.post('/', requireCustomer, validateCreateReview, createReview);

// List salon reviews with pagination
router.get('/salon/:salonId', validateListReviews, listReviewsBySalon);

// Get salon review summary
router.get('/salon/:salonId/summary', validateObjectId('salonId'), getSalonReviewSummary);

export default router;