import express from 'express';
import {
  register,
  setupProfile,
  getDashboard,
  getProfile,
  updateProfile,
  updateAvailability,
  getAppointments,
  updateAppointmentStatus,
  getTodaySchedule,
  getUpcomingAppointments,
  getCompletedAppointments,
  createStaff
} from '../controllers/staffController.js';
import { requireStaff, requireStaffSetup, requireSalonOwner } from '../middleware/roleAuth.js';
import { validateStaffSetup, validatePagination, validateObjectId } from '../middleware/validation.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post(
  '/create',
  requireSalonOwner,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'governmentId', maxCount: 1 }
  ]),
  validateStaffSetup,
  createStaff
);

// All routes below require staff authentication
router.use(requireStaff);



// Setup (no setup completion required)
router.post('/setup', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 }
]), validateStaffSetup, setupProfile);

// Routes that require completed setup
router.get('/dashboard', requireStaffSetup, getDashboard);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/availability', requireStaffSetup, updateAvailability);

// Appointment Management
router.get('/appointments', requireStaffSetup, validatePagination, getAppointments);
router.get('/schedule/today', requireStaffSetup, getTodaySchedule);
router.get('/upcoming-appointments', requireStaffSetup, getUpcomingAppointments);
router.get('/completed-appointments', requireStaffSetup, validatePagination, getCompletedAppointments);
router.patch('/appointments/:appointmentId/status', 
  requireStaffSetup, 
  validateObjectId('appointmentId'), 
  updateAppointmentStatus
);

export default router;