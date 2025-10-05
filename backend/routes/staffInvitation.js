import express from 'express';
import { createInvitation, getPendingInvitations, acceptInvitation, declineInvitation } from '../controllers/staffInvitationController.js';
import { authenticateToken as auth, requireRole as roleAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/staff-invitations
// @desc    Create a staff invitation
// @access  Private (Salon Owner)
router.post('/', auth, roleAuth('salon'), createInvitation);

// @route   GET /api/staff-invitations
// @desc    Get pending invitations for a staff member
// @access  Private (Staff)
router.get('/', auth, roleAuth('staff'), getPendingInvitations);

// @route   POST /api/staff-invitations/:id/accept
// @desc    Accept a staff invitation
// @access  Private (Staff)
router.post('/:id/accept', auth, roleAuth('staff'), acceptInvitation);

// @route   POST /api/staff-invitations/:id/decline
// @desc    Decline a staff invitation
// @access  Private (Staff)
router.post('/:id/decline', auth, roleAuth('staff'), declineInvitation);

export default router;