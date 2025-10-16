import express from 'express';
import { authenticateToken as protect } from '../middleware/auth.js';
import { requireSalonOwner as admin } from '../middleware/roleAuth.js';
import {
  createBlockTimeRequest,
  createLeaveRequest,
  createShiftSwapRequest,
  getMyRequests,
  getPendingRequestsForOwner,
  approveRequest,
  rejectRequest,
  peerApproveShiftSwap,
  peerRejectShiftSwap,
  getPeerShiftSwapRequests
} from '../controllers/scheduleRequestController.js';


const router = express.Router();

// POST requests
router.post('/block-time', protect, createBlockTimeRequest);
router.post('/leave', protect, createLeaveRequest);
router.post('/shift-swap', protect, createShiftSwapRequest);

// GET requests
router.get('/my-requests', protect, getMyRequests);
router.get('/pending', protect, admin, getPendingRequestsForOwner);
router.get('/peer-requests', protect, getPeerShiftSwapRequests);

// PUT requests for approval/rejection
router.put('/:id/approve', protect, admin, approveRequest);
router.put('/:id/reject', protect, admin, rejectRequest);
router.put('/:id/peer-approve', protect, peerApproveShiftSwap);
router.put('/:id/peer-reject', protect, peerRejectShiftSwap);

export default router;
