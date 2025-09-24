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
  createStaff,
  getStaffById,
  updateStaffById,
  getAppointmentsByStaffId,
  getStaffReport
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
router.get('/report', requireStaffSetup, getStaffReport);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
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

// Get appointments for a staff member by staff ID (for admins/salon owners)
router.get('/:id/appointments', validateObjectId('id'), getAppointmentsByStaffId);

// NOTE: Parameter routes must come last to avoid shadowing specific paths like /dashboard
// Get a staff member by ID (for admins/salon owners)
router.get('/:id', validateObjectId('id'), getStaffById);

// Update a staff member by ID (for admins/salon owners)
router.put('/:id', validateObjectId('id'), upload.fields([
  { name: 'profilePicture', maxCount: 1 },
]), updateStaffById);

export default router;