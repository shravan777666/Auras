import express from 'express';
import {
  processMessage,
  getConversationHistory,
  resetSession
} from '../controllers/chatbotController.js';
import { requireCustomer } from '../middleware/roleAuth.js';

const router = express.Router();

// All chatbot routes require customer authentication (includesAuth check)
router.use(requireCustomer);

/**
 * @route   POST /api/chatbot/message
 * @desc    Process user message and generate response
 * @access  Private (Customer only)
 */
router.post('/message', processMessage);

/**
 * @route   GET /api/chatbot/history
 * @desc    Get conversation history
 * @access  Private (Customer only)
 */
router.get('/history', getConversationHistory);

/**
 * @route   POST /api/chatbot/reset
 * @desc    Reset chat session
 * @access  Private (Customer only)
 */
router.post('/reset', resetSession);

export default router;
