import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getClientProfile,
  updateInternalNotes,
  getConversation,
  sendMessage,
  getClientProfiles,
  updatePreferredServices,
  deleteInternalNote
} from '../controllers/clientProfileController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all client profiles for salon (messaging dashboard)
router.get('/', getClientProfiles);

// Get specific client profile
router.get('/:customerId', getClientProfile);

// Update client profile internal notes
router.put('/:customerId/notes', updateInternalNotes);

// Delete specific internal note
router.delete('/:customerId/notes/:noteId', deleteInternalNote);

// Update preferred services
router.put('/:customerId/preferred-services', updatePreferredServices);

// Get conversation messages
router.get('/:customerId/messages', getConversation);

// Send message to client
router.post('/:customerId/messages', sendMessage);

export default router;
