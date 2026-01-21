import express from 'express';
import { requireSalonOwner } from '../middleware/roleAuth.js';
import { 
  getGiftCardRecipients, 
  getFilteredGiftCardRecipients, 
  getGiftCardRecipientsStats 
} from '../controllers/giftCardRecipientController.js';

const router = express.Router();

// Get all gift card recipients for a salon
router.get('/', requireSalonOwner, getGiftCardRecipients);

// Get filtered gift card recipients
router.get('/filtered', requireSalonOwner, getFilteredGiftCardRecipients);

// Get gift card recipients statistics
router.get('/stats', requireSalonOwner, getGiftCardRecipientsStats);

export default router;