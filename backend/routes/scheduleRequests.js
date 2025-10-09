import express from 'express';
import {
  createBlockTimeRequest,
  createLeaveRequest,
  createShiftSwapRequest,
  getMyRequests,
  approveRequest,
  rejectRequest,
  getPendingRequestsForOwner
} from '../controllers/scheduleRequestController.js';
import { requireStaff, requireStaffSetup, requireSalonOwner } from '../middleware/roleAuth.js';

const router = express.Router();

// Staff routes for creating requests
router.post('/block-time', requireStaff, requireStaffSetup, createBlockTimeRequest);
router.post('/leave', requireStaff, requireStaffSetup, createLeaveRequest);
router.post('/shift-swap', requireStaff, requireStaffSetup, createShiftSwapRequest);
router.get('/my-requests', requireStaff, requireStaffSetup, getMyRequests);

// Owner routes for managing requests
router.get('/pending', requireSalonOwner, getPendingRequestsForOwner);
router.patch('/:id/approve', requireSalonOwner, approveRequest);
router.patch('/:id/reject', requireSalonOwner, rejectRequest);

export default router;