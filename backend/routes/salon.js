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
  getGlobalStaffDirectory,
  getStaffAvailability,
  addService,
  getServices,
  getServiceCategories,
  getRevenueByService,
  addExpense,
  getExpenses,
  getExpenseSummary,
  updateExpense,
  deleteExpense
} from '../controllers/salonController.js';
import * as appointmentController from '../controllers/appointmentController.js';
import { requireSalonOwner, requireSalonSetup } from '../middleware/roleAuth.js';
import { getSalonLocations } from '../controllers/salonController.js';
import { validateSalonSetup, validatePagination, validateObjectId } from '../middleware/validation.js';
import { salonSetupUploads, uploadErrorHandler, upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.get('/locations', getSalonLocations);
// Revenue by service (requires auth + setup)
router.get('/dashboard/revenue-by-service', requireSalonOwner, requireSalonSetup, getRevenueByService);
router.get('/dashboard/service-categories', requireSalonOwner, requireSalonSetup, getServiceCategories);

// Expense tracking routes
router.post('/expenses', requireSalonOwner, requireSalonSetup, addExpense);
router.get('/expenses', requireSalonOwner, requireSalonSetup, validatePagination, getExpenses);
router.get('/expenses/summary', requireSalonOwner, requireSalonSetup, getExpenseSummary);
router.patch('/expenses/:expenseId', requireSalonOwner, requireSalonSetup, updateExpense);
router.delete('/expenses/:expenseId', requireSalonOwner, requireSalonSetup, deleteExpense);

// All routes below require salon owner authentication
router.use(requireSalonOwner);

// Details update route

// Setup (no setup completion required)
router.post('/setup', salonSetupUploads, uploadErrorHandler, validateSalonSetup, setupSalon);

// Routes that require completed setup
router.get('/dashboard', requireSalonSetup, getDashboard);
router.get('/dashboard/:salonId', requireSalonSetup, getDashboardById);

// Profile routes with file upload support
router.get('/profile', getProfile);
router.patch('/profile', upload.fields([
  { name: 'salonLogo', maxCount: 1 },
  { name: 'salonImage', maxCount: 1 }
]), uploadErrorHandler, updateProfile);

// Staff Management
router.get('/staff', requireSalonSetup, getSalonStaff);
router.get('/staff/global-directory', requireSalonSetup, getGlobalStaffDirectory);
router.get('/staff/availability', requireSalonSetup, getStaffAvailability);
router.get('/staff/available', requireSalonSetup, validatePagination, getAvailableStaff);
router.post('/staff/hire', requireSalonSetup, hireStaff);
router.delete('/staff/:staffId', requireSalonSetup, validateObjectId('staffId'), removeStaff);

// Service Management
router.get('/services', requireSalonSetup, validatePagination, getServices);
router.post('/services', requireSalonSetup, addService);

// Appointment Management
router.get('/appointments', requireSalonSetup, validatePagination, getAppointments);
router.patch('/appointments/:appointmentId', 
  requireSalonSetup, 
  validateObjectId('appointmentId'), 
  appointmentController.updateAppointment
);
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