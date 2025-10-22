import express from 'express';
import { 
  createPaymentOrder, 
  verifyPayment, 
  handlePaymentFailure 
} from '../controllers/paymentController.js';
import { requireCustomer } from '../middleware/roleAuth.js';

const router = express.Router();

// All routes require customer authentication
router.use(requireCustomer);

// Create payment order
router.post('/create-order', createPaymentOrder);

// Verify payment
router.post('/verify-payment', verifyPayment);

// Handle payment failure
router.post('/payment-failure', handlePaymentFailure);

export default router;