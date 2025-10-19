import express from 'express';
const router = express.Router();
import { submitInternalFeedback, getInternalFeedbackForSalon, updateInternalFeedbackStatus } from '../controllers/internalFeedbackController.js';
import { authenticateToken as protect } from '../middleware/auth.js'; // Assuming you have auth middleware

// @route   POST /api/internal-feedback
// @desc    Submit internal staff feedback
// @access  Private (Staff)
router.post('/', protect, submitInternalFeedback);

// @route   GET /api/internal-feedback/salon/:salonId
// @desc    Get internal staff feedback for a salon
// @access  Private (Manager/Owner)
router.get('/salon/:salonId', protect, getInternalFeedbackForSalon);

// @route   PATCH /api/internal-feedback/:id/status
// @desc    Update internal feedback status
// @access  Private (Manager/Owner)
router.patch('/:id/status', protect, updateInternalFeedbackStatus);

export default router;
