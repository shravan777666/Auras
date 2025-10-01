import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getCustomerConversations,
  getConversationMessages,
  sendMessageToSalon,
  markMessageAsRead,
  getUnreadMessageCount,
  getMessageNotifications
} from '../controllers/customerMessageController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all conversations for customer
router.get('/conversations', getCustomerConversations);

// Get unread message count
router.get('/unread-count', getUnreadMessageCount);

// Get message notifications
router.get('/notifications', getMessageNotifications);

// Get specific conversation messages
router.get('/conversations/:salonId', getConversationMessages);

// Send message to salon
router.post('/conversations/:salonId', sendMessageToSalon);

// Mark specific message as read
router.put('/messages/:messageId/read', markMessageAsRead);

export default router;
