import express from 'express';
import {
  register,
  updateDetails,
  setupSalon,
  getDashboard,
  getDashboardById,
  getProfile,
  updateProfile,
  getAvailableStaff,
  hireStaff,
  removeStaff,
  getAppointments,
  updateAppointmentStatus,
  getSalonStaff,
  getStaffAvailability,
  addService
} from '../controllers/salonController.js';
import { getSalonServices } from '../controllers/serviceController.js';
import { requireSalonOwner, requireSalonSetup } from '../middleware/roleAuth.js';
import { validateSalonSetup, validatePagination, validateObjectId } from '../middleware/validation.js';
import { salonSetupUploads, uploadErrorHandler } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/register', register);

// All routes below require salon owner authentication
router.use(requireSalonOwner);

// Details update route
router.put('/details/:id', updateDetails);

// Setup (no setup completion required)
router.post('/setup', salonSetupUploads, uploadErrorHandler, validateSalonSetup, setupSalon);

// Routes that require completed setup
router.get('/dashboard', requireSalonSetup, getDashboard);
router.get('/dashboard/:salonId', requireSalonSetup, getDashboardById);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// Staff Management
router.get('/staff', requireSalonSetup, getSalonStaff);
router.get('/staff/availability', requireSalonSetup, getStaffAvailability);
router.get('/staff/available', requireSalonSetup, validatePagination, getAvailableStaff);
router.post('/staff/hire', requireSalonSetup, hireStaff);
router.delete('/staff/:staffId', requireSalonSetup, validateObjectId('staffId'), removeStaff);

// Service Management
router.get('/services', requireSalonSetup, validatePagination, getSalonServices);
router.post('/services', requireSalonSetup, addService);

// Appointment Management
router.get('/appointments', requireSalonSetup, validatePagination, getAppointments);
router.patch('/appointments/:appointmentId/status', 
  (req, res, next) => {
    console.log('🔧 Route hit: PATCH /appointments/:appointmentId/status', {
      appointmentId: req.params.appointmentId,
      body: req.body
    });
    next();
  },
  requireSalonSetup, 
  validateObjectId('appointmentId'), 
  updateAppointmentStatus
);

export default router;