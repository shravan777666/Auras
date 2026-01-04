import express from 'express';
import { 
  joinQueue, 
  getQueueStatus, 
  getQueue, 
  updateQueueStatus,
  getQueueByToken,
  getQueueStatusForCustomer,
  getSalonQueueStatus,
  checkInViaQR
} from '../controllers/queueController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireSalonOwner } from '../middleware/roleAuth.js';

const router = express.Router();

// Salon owner routes (require authentication)
router.use(authenticateToken);
router.use(requireSalonOwner);

// Salon owner queue management
router.post('/join', joinQueue);
router.get('/status', getQueueStatus);
router.get('/', getQueue);
router.patch('/status', updateQueueStatus);

// Customer-facing routes (public access)
router.get('/token/:tokenNumber', getQueueByToken);
router.get('/customer/:tokenNumber', getQueueStatusForCustomer);
router.get('/salon/:salonId', getSalonQueueStatus);

// QR check-in route (public access)
router.post('/checkin', checkInViaQR);

export default router;