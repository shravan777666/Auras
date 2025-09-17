import express from 'express';
import {
  getDashboard,
  getProfile,
  updateProfile,
  browseSalons,
  getSalonDetails,
  searchServices,
  getBookings,
  cancelBooking,
  rateAppointment
} from '../controllers/customerController.js';
import { requireCustomer } from '../middleware/roleAuth.js';
import { validatePagination, validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// All routes require customer authentication
router.use(requireCustomer);

// Dashboard and Profile
router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// Browse Salons and Services
router.get('/salons', validatePagination, browseSalons);
router.get('/salons/:salonId', validateObjectId('salonId'), getSalonDetails);
router.get('/services/search', validatePagination, searchServices);

// Booking Management
router.get('/bookings', validatePagination, getBookings);
router.patch('/bookings/:appointmentId/cancel', 
  validateObjectId('appointmentId'), 
  cancelBooking
);
router.post('/bookings/:appointmentId/rate', 
  validateObjectId('appointmentId'), 
  rateAppointment
);

export default router;