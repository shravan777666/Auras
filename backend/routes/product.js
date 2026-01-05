import express from 'express';
import {
  createProduct,
  getSalonProducts,
  getProductDetails,
  updateProduct,
  deleteProduct,
  getCategories,
  getRecommendedProducts
} from '../controllers/productController.js';
import { requireSalonOwner, requireAuth } from '../middleware/roleAuth.js';
import { validateProduct, validatePagination, validateObjectId } from '../middleware/validation.js';
import { salonUpload } from '../config/cloudinary.js'; // Import Cloudinary upload

const router = express.Router();

// Public routes (no authentication required)
router.get('/categories', getCategories);

// Routes for recommended products
router.get('/recommended/:serviceId/:salonId', requireAuth, validateObjectId('serviceId'), validateObjectId('salonId'), getRecommendedProducts);

// Routes requiring authentication
router.get('/salon/:salonId', requireAuth, validateObjectId('salonId'), getSalonProducts);

// Salon owner only routes
router.post('/', requireSalonOwner, salonUpload.single('image'), validateProduct, createProduct);
router.get('/my/products', requireSalonOwner, validatePagination, getSalonProducts);
router.patch('/:productId', requireSalonOwner, salonUpload.single('image'), validateObjectId('productId'), updateProduct);
router.delete('/:productId', requireSalonOwner, validateObjectId('productId'), deleteProduct);

export default router;