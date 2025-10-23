import express from 'express';
import { 
  getCustomerNotifications,
  markCustomerNotificationAsRead,
  markMultipleCustomerNotificationsAsRead
} from '../controllers/customerNotificationController.js';
import { requireAuth, requireCustomer } from '../middleware/roleAuth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// All routes require customer authentication
router.use(requireAuth, requireCustomer);

// Get customer notifications
router.get('/', getCustomerNotifications);

// Mark notification as read
router.put('/:notificationId/read', validateObjectId('notificationId'), markCustomerNotificationAsRead);

// Mark multiple notifications as read
router.put('/read', markMultipleCustomerNotificationsAsRead);

export default router;